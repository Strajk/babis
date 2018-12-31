/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const moment = require('moment');

async function scrape(client, {
  user,
  pass,
  from = moment().subtract(2, 'month').format(),
  to = moment().format(),
}) {
  const fromParsed = moment(from).format('DD.MM.YYYY');
  const toParsed = moment(to).format('DD.MM.YYYY');

  await client
    .init()
    .url('https://ib.airbank.cz')
    .setValue('input[type="text"]', user)
    .setValue('input[type="password"]', pass)
    .keys('Enter');

  await client.waitForVisible('.cmpLoaderOver', undefined, true);
  // TODO: Find out why next line is not working same as the one above
  // await client.waitUntil(() => !client.isVisible('.cmpLoaderOver'));

  await client.click('span=Účty a karty');
  await client.waitForVisible('.cmpLoaderOver', undefined, true);

  /*
    Would rather use, but I was unable to make it work
    It kept clicking on first tab :(
    const accounts = await client.elements('#jsLayoutAccounts .tab');
    for (const account of accounts.value) {
      await client.elementIdClick(account.ELEMENT);
  */

  const accounts = await client.elements('#jsLayoutAccounts .tab');

  // eslint-disable-next-line guard-for-in, no-restricted-syntax, no-plusplus
  for (let i = 1; i <= accounts.value.length; i++) {
    await client.click(`#jsLayoutAccounts .tab:nth-child(${i})`);
    await client.waitForVisible('.cmpLoaderOver', undefined, true);

    const balance = await client.getText('.numberPrimary');
    // 12 345,67 CZK => 12345,67CZK
    const balanceClean = balance.replace(/\s/g, '');

    console.log('💰💰💰 BALANCE', balanceClean);

    await client.click('span=Historie plateb');
    await client.waitForVisible('.cmpLoaderOver', undefined, true);

    await client.click('span=Podrobné vyhledávání');
    await client.waitForVisible('.cmpLoaderOver', undefined, true);

    await client.setValue('[name="stateOrForm:formContent:dateFrom:componentWrapper:component"]', fromParsed);

    await client.setValue('[name="stateOrForm:formContent:dateTo:componentWrapper:component"]', toParsed);

    await client.keys('Enter');
    await client.waitForVisible('.cmpLoaderOver', undefined, true);

    // TODO: Assert results

    await client.click('span=Exportovat');

    await client.waitForExist('span=Exportní soubor jsme vytvořili', 10 * 1000);
    await client.pause(500);
    await client.click('.ui-dialog-titlebar-close');
    await client.waitForVisible('.cmpLoaderOver', undefined, true);
  }


  return client.end();
}

function normalize(input) {
  return input.map((x) => {
    let desc = x['Název protistrany'];
    if (x['Typ úhrady'] !== 'Platba kartou') {
      desc += ` | ${x['Typ úhrady']}`;
    }

    if (x['Poznámka pro mne']) {
      desc += ` | ${x['Poznámka pro mne']}`;
    }

    if (x['Zpráva pro příjemce']) {
      desc += ` | ${x['Zpráva pro příjemce']}`;
    }

    if (x['Původní měna úhrady'] !== 'CZK') {
      desc += ` (${-parseFloat(x['Původní částka úhrady'])} ${x['Původní měna úhrady']})`;
    }

    return {
      date: moment(x['Datum provedení'], 'DD/MM/YYYY').format('YYYY-MM-DD'),
      description: desc,
      amount: -parseFloat(x['Částka v měně účtu']),
    };
  });
}

module.exports = {
  scrape,
  normalize,
};
