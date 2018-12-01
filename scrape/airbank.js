/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

require('dotenv').config();

const Promise = require('bluebird');
const webdriverio = require('webdriverio');
const selenium = require('selenium-standalone');
const moment = require('moment');
const mkdirp = require('mkdirp');

const install = Promise.promisify(selenium.install);

const DRIVERS = {
  chrome: {
    version: '2.40',
    arch: process.arch,
    baseURL: 'https://chromedriver.storage.googleapis.com',
  },
};

const OUTPUT_DIR = `${process.cwd}/output`;
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


async function scrape({
  user,
  pass,
  from = moment().subtract(1, 'month').format(),
  to = moment().format(),
}) {
  const client = webdriverio.remote(OPTIONS);

  const fromParsed = moment(from).format('DD.MM.YYYY');
  const toParsed = moment(to).format('DD.MM.YYYY');

  await client
    .init()
    .url('https://ib.airbank.cz')
    .setValue('input[type="text"]', user)
    .setValue('input[type="password"]', pass)
    .keys('Enter');

  await client.waitForVisible('.cmpLoaderOver', undefined, true);
  // TODO: Find out why next line is not working same as the one above
  // await client.waitUntil(() => !client.isVisible('.cmpLoaderOver'));

  await client.click('span=Účty a karty');
  await client.waitForVisible('.cmpLoaderOver', undefined, true);

  // TODO: Support more accounts

  const balance = await client.getText('.numberPrimary');
  // 12 345,67 CZK => 12345,67CZK
  const balanceClean = balance.replace(/\s/g, '');

  console.log('💰💰💰 BALANCE', balanceClean);

  await client.click('span=Historie plateb');
  await client.waitForVisible('.cmpLoaderOver', undefined, true);

  await client.click('span=Podrobné vyhledávání');
  await client.waitForVisible('.cmpLoaderOver', undefined, true);

  await client.setValue('[name="stateOrForm:formContent:dateFrom:componentWrapper:component"]', fromParsed);

  await client.setValue('[name="stateOrForm:formContent:dateTo:componentWrapper:component"]', toParsed);

  await client.keys('Enter');
  await client.waitForVisible('.cmpLoaderOver', undefined, true);

  // TODO: Assert results

  await client.click('span=Exportovat');

  await client.waitForExist('span=Exportní soubor jsme vytvořili', 10 * 1000);

  return client.end();
}

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
    await scrape({
      user: process.env.AIRBANK_USER,
      pass: process.env.AIRBANK_PASS,
    });
    console.log('🎉 Done');
  });
}

main();
