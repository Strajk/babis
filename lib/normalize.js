const fs = require("fs")
const parseCsv = require("csv-parse/lib/sync")
const stringifyCsv = require("csv-stringify/lib/sync")
const glob = require("glob")
const iconv = require("iconv-lite")

const airbank = require("../scrape/airbank")
const csob = require("../scrape/csob")

/* eslint-disable quote-props */
const PATTERNS = {
  "AirBank Rewards": "Air Bank | Odměny za placení | Připsání odměn",
  "Albert": "ALBERT VAM DEKUJE",
  "Apple Services": "APPLE.COM/BILL",
  "Billa": "BILLA, spol. s r. o.",
  "Gas": "CS EUROOIL KRENOVICE",
  "Rohlik": "DEKUJEME, ROHLIK.CZ",
  "Dm": "dm drogerie markt s.r.o.",
  "JetBrains Sub": /^JetBrains/,
  "Pharmacy": /^LEKARNA/,
  "Lidl": "LIDL DEKUJE ZA NAKUP",
  "Makro": "MAKRO, spol. s r.o.",
  "MND (Electricity)": /^MND A.S./,
  "OBRAZ - Obránci zvířat": /^OBRAZ - Obránci zvíř/,
  "Steam": /STEAM GAMES/,
  "Ring Sub": /^RING MONTHLY PLAN/,
  "Apartment fund": /^Společenství pro dům/,
  "T-Mobile": "T-MOBILE CZ",
  "Vodafone (UPC) internet": "Vodafone Czech Republic a.s.",
  "Sklizeno": /^SKLIZENO/,
}
/* eslint-enable quote-props */

function _clean (x) {
  for (const [val, pattern] of Object.entries(PATTERNS)) {
    if (typeof pattern === "string") {
      if (x === pattern) return val
    } else if (typeof pattern === "object") { // RegExp
      if (pattern.test(x)) return val
    }
  }
  return x
}

function clean (transactions) {
  return transactions.map(x => Object.assign(
    {},
    x,
    { description: _clean(x.description) },
  ))
}

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
      normalized = clean(normalized)
      const string = stringifyCsv(normalized, { header: true, quoted: false, delimiter: "\t" })
      fs.writeFileSync(file.replace(".csv", "_normalized.tsv"), string)
    })
  })
}

module.exports = normalize
