/* eslint-disable no-unused-vars */

require('dotenv').config();

const Promise = require('bluebird');
const webdriverio = require('webdriverio');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync');
const glob = require('glob');
const fs = require('fs');
const selenium = require('selenium-standalone');

const mkdirp = require('mkdirp');

const csob = require('./csob');
const airbank = require('./airbank');

const install = Promise.promisify(selenium.install);

const DRIVERS = {
  chrome: {
    version: '2.40',
    arch: process.arch,
    baseURL: 'https://chromedriver.storage.googleapis.com',
  },
};

const OUTPUT_DIR = `${process.cwd()}/output`;
mkdirp.sync(OUTPUT_DIR);

const SELENIUM_VERSION = '3.14.0';

const OPTIONS = {
  desiredCapabilities: {
    browserName: 'chrome',
    chromeOptions: {
      prefs: {
        'download.default_directory': OUTPUT_DIR,
      },
    },
  },
  // logLevel: 'verbose',
  waitforTimeout: 10 * 1000,
};

async function main(params) {
  await install({
    version: SELENIUM_VERSION,
    baseURL: 'https://selenium-release.storage.googleapis.com',
    drivers: DRIVERS,
    logger: (msg) => { console.log(msg); },
  });

  await selenium.start({
    version: SELENIUM_VERSION,
    drivers: DRIVERS,
    spawnOptions: {
      stdio: 'inherit',
    },
  }, async (err) => {
    if (err) console.log(err);
    const client = webdriverio.remote(OPTIONS);
    await airbank.scrape(client, {
      user: process.env.AIRBANK_USER,
      pass: process.env.AIRBANK_PASS,
    });
    // Not ready for it's prime time yet
    // await csob.scrape(client, {
    //   user: process.env.CSOB_USER,
    //   pass: process.env.CSOB_PASS,
    // });

    // TODO: Nicer
    // eslint-disable-next-line no-use-before-define
    normalize();
    console.log('🎉 Done');
  });
}

function normalize() {
  glob('output/*.csv', {}, (er, files) => {
    files.forEach((file) => {
      const opened = fs.readFileSync(file, 'utf-8');
      const parsed = parseCsv(opened, { columns: true });
      let normalized;
      if (file.includes('airbank')) {
        normalized = airbank.normalize(parsed);
      }
      // const string = stringifyCsv(normalized, { header: true, quoted: true });
      // TODO: No not replace
      const string = stringifyCsv(normalized, { header: false, quoted: false, delimiter: '\t' });
      fs.writeFileSync(file, string);
    });
  });
}

main();
