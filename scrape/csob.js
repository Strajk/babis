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
    .url('https://ib.csob.cz/prihlaseni')
    .setValue('#username-view', user)
    .setValue('#password-view', pass)
    .keys('Enter');

  // Requires 2 factor auth ❨╯°□°❩╯︵┻━┻
  await client.waitForVisible('.pui-header-user', 60 * 1000, true);

  await client.url('https://ib.csob.cz/klient/prehledy/historie-plateb');

  // TODO: Support more accounts

  await client.waitForVisible('span=Uložit jako', undefined, true);

  const balance = await client.getText('#po-label-cov-transactionhistory-current-balance');
  // 12 345,67 CZK => 12345,67CZK
  const balanceClean = balance.replace(/\s/g, '');
  console.log('💰💰💰 BALANCE', balanceClean);

  // TODO: Filtering

  await client.click('span=Uložit jako');

  await client.pause(10 * 1000);

  return client.end();
}

module.exports = scrape;
