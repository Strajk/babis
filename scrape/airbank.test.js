const fs = require("fs")
const parseCsv = require("csv-parse/lib/sync")
const fn = require("./airbank")

const samplesFile = fs.readFileSync("scrape/samples/airbank.csv")
const samples = parseCsv(samplesFile, { columns: true })

describe("airbank", () => {
  test("Valid input", () => {
    expect(fn.normalize(samples)).toMatchSnapshot()
  })
})
