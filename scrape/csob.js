/* eslint-disable no-console */
const moment = require("moment")

async function scrape (client, {
  user,
  pass,
  from = moment().subtract(2, "month").format(),
  to = moment().format(),
}) {
  const fromParsed = moment(from).format("DD.MM.YYYY") // eslint-disable-line no-unused-vars
  const toParsed = moment(to).format("DD.MM.YYYY") // eslint-disable-line no-unused-vars

  await client
    .init()
    .url("https://ib.csob.cz/prihlaseni")
    .setValue("#username-view", user)
    .setValue("#password-view", pass)
    .keys("Enter")

  // Requires 2 factor auth ❨╯°□°❩╯︵┻━┻
  await client.waitForVisible(".pui-header-user", 60 * 1000, true)

  await client.url("https://ib.csob.cz/klient/prehledy/historie-plateb")

  // TODO: Support more accounts

  await client.waitForVisible("span=Uložit jako", undefined, true)

  const balance = await client.getText("#po-label-cov-transactionhistory-current-balance")
  // 12 345,67 CZK => 12345,67CZK
  const balanceClean = balance.replace(/\s/g, "")
  console.log("💰💰💰 BALANCE", balanceClean)

  // TODO: Filtering

  await client.click("span=Uložit jako")

  await client.pause(10 * 1000)

  return client.end()
}

function normalize (input) {
  return input.map((x) => {
    let desc = x["poznámka"]
    if (
      x["označení operace"] !== "Transakce platební kartou" ||
      x["označení operace"] !== "Čerpání úvěru platební kartou"
    ) {
      desc += ` | ${x["označení operace"]}`
    }

    if (x["název účtu protiúčtu"]) {
      desc += ` | ${x["název účtu protiúčtu"]}`
    }

    if (x["Zpráva pro příjemce"]) {
      desc += ` | ${x["Zpráva pro příjemce"]}`
    }

    // if (x['Původní měna úhrady'] !== 'CZK') {
    //   desc += ` (${-parseFloat(x['Původní částka úhrady'])} ${x['Původní měna úhrady']})`;
    // }

    return {
      date: moment(x["datum zaúčtování"], "DD.MM.YYYY").format("YYYY-MM-DD"),
      description: desc,
      amount: -parseFloat(x["částka"]),
    }
  })
}

module.exports = {
  scrape,
  normalize,
}
