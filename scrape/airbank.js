/* eslint-disable no-await-in-loop, no-console */
const moment = require("moment")
const sync = require("@wdio/sync").default

async function scrape (client, {
  user,
  pass,
  birthdate,
  from = moment().subtract(2, "month").format(),
  to = moment().format(),
}) {
  sync(() => {
    const fromParsed = moment(from).format("DD.MM.YYYY")
    const toParsed = moment(to).format("DD.MM.YYYY")

    client.url("https://ib.airbank.cz")

    /* Email */
    /* === */
    client.$("input[name^=\"authFlow:login\"]").setValue(user)
    client.keys("Enter")

    /* Date of birth */
    /* === */
    client.$("input[name^=\"authFlow:authPanel:dateOfBirth\"]").waitForExist({ timeout: 5000 })
    client.$("input[name=\"authFlow:authPanel:dateOfBirth:componentWrapper:component:day\"]").setValue(birthdate.day)
    client.$("input[name=\"authFlow:authPanel:dateOfBirth:componentWrapper:component:month\"]").setValue(birthdate.month)
    client.$("input[name=\"authFlow:authPanel:dateOfBirth:componentWrapper:component:year\"]").setValue(birthdate.year)
    client.keys("Enter")

    /* Password */
    /* === */
    client.$("input[type=\"password\"]").setValue(pass); client.keys("Enter")

    client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })

    client.$("span=Účty a karty").click()
    client.$("(//*[@class=\"layoutMainMenu\"]//a)[2]").click()
    client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })

    /*
    Would rather use, but I was unable to make it work
    It kept clicking on first tab :(
    const accounts = client.elements('#jsLayoutAccounts .tab');
    for (const account of accounts.value) {
      client.elementIdClick(account.ELEMENT);
  */

    const accounts = client.$$("#jsLayoutAccounts .tab")

    // eslint-disable-next-line guard-for-in, no-restricted-syntax, no-plusplus
    for (let i = 1; i <= accounts.length; i++) {
      client.$(`#jsLayoutAccounts .tab:nth-child(${i})`).click()
      client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })

      const balance = client.$(".numberPrimary").getText()
      // 12 345,67 CZK => 12345,67CZK
      const balanceClean = balance.replace(/\s/g, "")

      console.log("💰💰💰 BALANCE", balanceClean)

      client.$("span=Historie plateb").click()
      client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })

      client.$("span=Podrobné vyhledávání").click()
      client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })

      client.$("[name=\"stateOrForm:formContent:dateFrom:componentWrapper:component\"]").setValue(fromParsed)
      client.$("[name=\"stateOrForm:formContent:dateTo:componentWrapper:component\"]").setValue(toParsed)
      client.keys("Enter")

      client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })

      // TODO: Assert results

      client.$("span=Exportovat").click()

      client.$("span=Exportní soubor jsme vytvořili").waitForExist(10 * 1000)
      client.pause(3000) // TODO: Consider removing after being pretty stable
      client.$("a[href=ExportCsv]").click()
      client.pause(1000) // TODO: Consider removing after being pretty stable
      client.$(".ui-dialog-titlebar-close").click()
      client.$(".cmpLoaderOver").waitForDisplayed({ reverse: true })
    }
  })

  return client.end()
}

function normalize (input) {
  return input.map((x) => {
    let desc = x["Název protistrany"]
    if (x["Typ úhrady"] !== "Platba kartou") {
      desc += ` | ${x["Typ úhrady"]}`
    }

    if (x["Poznámka pro mne"]) {
      desc += ` | ${x["Poznámka pro mne"]}`
    }

    if (x["Zpráva pro příjemce"]) {
      desc += ` | ${x["Zpráva pro příjemce"]}`
    }

    if (x["Původní měna úhrady"] !== "CZK") {
      desc += ` (${-parseFloat(x["Původní částka úhrady"])} ${x["Původní měna úhrady"]})`
    }

    return {
      date: moment(x["Datum provedení"], "DD/MM/YYYY").format("YYYY-MM-DD"),
      description: desc,
      amount: -parseFloat(x["Částka v měně účtu"]),
    }
  })
}

module.exports = {
  scrape,
  normalize,
}
