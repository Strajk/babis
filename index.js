/* eslint-disable no-unused-vars */
const mkdirp = require("mkdirp")

const selenium = require("./lib/selenium")
const browser = require("./lib/browser")
const normalize = require("./lib/normalize")

const csob = require("./scrape/csob")
const airbank = require("./scrape/airbank")

require("dotenv").config()

const OUTPUT_DIR = `${process.cwd()}/output`;

(async () => {
  mkdirp.sync(OUTPUT_DIR)

  await selenium.install()
  await selenium.start()
  const client = await browser.init({ outputDir: OUTPUT_DIR })

  airbank.scrape(client, {
    user: process.env.AIRBANK_USER,
    pass: process.env.AIRBANK_PASS,
    birthdate: {
      day: process.env.BIRTHDAY_DAY,
      month: process.env.BIRTHDAY_MONTH,
      year: process.env.BIRTHDAY_YEAR,
    },
  })

  // Not ready for it's prime time yet
  await csob.scrape(client, {
    user: process.env.CSOB_USER,
    pass: process.env.CSOB_PASS,
  })

  normalize()
  console.log("🎉 Done")
})()
