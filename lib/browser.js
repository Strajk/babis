const webdriverio = require("webdriverio")

async function init ({ outputDir }) {
  return webdriverio.remote({
    runner: true,
    capabilities: {
      browserName: "chrome",
      // BEWARE: logs are downloaded to ~/Downloads and not to specified outputDir
      // Cannot get it to work
      // Tried:
      // - `chromeOptions` and `goog:chromeOptions`
      // - path absolute & relative
      // - prefs objects nested and flat
      // - nothing helped :(
      // https://stackoverflow.com/a/27924901/1732483
      // https://github.com/SeleniumHQ/selenium/issues/5292
      chromeOptions: {
        prefs: {
          download: {
            prompt_for_download: false,
            directory_upgrade: true,
            default_directory: outputDir,
          },
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
