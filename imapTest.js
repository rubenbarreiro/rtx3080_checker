const imapClient = require('./imap');
const to = require('await-to-js').default;

(async () => {
  const [err, code] = await to(imapClient.connectAndSearch());
  console.log('6 imapTest.js > err === ', err);
  console.log('7 imapTest.js > code === ', code);
})();
