const fs = require("fs")
const parseCsv = require("csv-parse/lib/sync")
const stringifyCsv = require("csv-stringify/lib/sync")
const glob = require("glob")
const iconv = require("iconv-lite")

const airbank = require("../scrape/airbank")
const csob = require("../scrape/csob")
const helpers = require("./helpers")

function normalize () {
  glob("output/*.csv", {}, (er, files) => {
    files.forEach((file) => {
      let opened
      let parsed
      let normalized

      if (file.includes("_normalized")) return

      if (file.includes("airbank")) {
        opened = fs.readFileSync(file, "utf-8")
        parsed = parseCsv(opened, { columns: true })
        normalized = airbank.normalize(parsed)
      }
      if (file.includes("pohyby-na uctu")) { // TODO: Nicer detection
        opened = iconv.decode(fs.readFileSync(file), "win1250")
        parsed = parseCsv(opened.split("\r\n").slice(2).join("\r\n"), {
          columns: true, delimiter: ";", relax_column_count: true, from_line: 3,
        })
        normalized = csob.normalize(parsed)
      }
      normalized = normalized.sort((a, b) => (a.date > b.date ? 1 : -1))
      const string = stringifyCsv(normalized, { header: true, quoted: false, delimiter: "\t" })
      fs.writeFileSync(helpers.appendToFilename(file, "_normalized"), string)
    })
  })
}

module.exports = normalize
