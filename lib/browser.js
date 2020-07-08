const webdriverio = require("webdriverio")

async function init ({ outputDir }) {
  return webdriverio.remote({
    runner: true,
    capabilities: {
      browserName: "chrome",
      "goog:chromeOptions": {
        prefs: {
          "download.default_directory": outputDir,
        },
      },
    },
    // logLevel: 'verbose',
    waitforTimeout: 60 * 1000,
  })
}

module.exports = {
  init,
}
