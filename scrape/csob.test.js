const fs = require("fs")
const parseCsv = require("csv-parse/lib/sync")
const fn = require("./csob")

const samplesFile = fs.readFileSync("scrape/samples/csob.csv")
const samples = parseCsv(samplesFile, { columns: true, delimiter: ";" })

describe("csob", () => {
  test("Valid input", () => {
    expect(fn.normalize(samples)).toMatchSnapshot()
  })
})
