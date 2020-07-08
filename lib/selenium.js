const Promise = require("bluebird")
const selenium = require("selenium-standalone")

const seleniumInstall = Promise.promisify(selenium.install)
const seleniumStart = Promise.promisify(selenium.start)

const DRIVERS = {
  chrome: {
    version: "2.40",
    arch: process.arch,
    baseURL: "https://chromedriver.storage.googleapis.com",
  },
}

const SELENIUM_VERSION = "3.14.0"

async function install () {
  return seleniumInstall({
    version: SELENIUM_VERSION,
    baseURL: "https://selenium-release.storage.googleapis.com",
    drivers: DRIVERS,
    logger: (msg) => { console.log(msg) }, // eslint-disable-line no-console
  })
}

async function start () {
  return seleniumStart({
    version: SELENIUM_VERSION,
    drivers: DRIVERS,
    spawnOptions: {
      stdio: "inherit",
    },
  })
}

module.exports = {
  install,
  start,
}
