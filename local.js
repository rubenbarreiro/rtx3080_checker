const {run} = require('./index');

const chromium = require('chrome-aws-lambda');
const { addExtra } = require('puppeteer-extra');
const puppeteerExtra = addExtra(chromium.puppeteer);
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

puppeteerExtra.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN,
    },
    visualFeedback: true,
  })
);
puppeteerExtra.use(StealthPlugin());
puppeteerExtra.use(AdblockerPlugin());

(async () => {
  const browser = await puppeteerExtra.launch({
      executablePath: '/c/Program\ Files\ (x86)/Google/Chrome/Application/chrome.exe',
      headless: false,
      slowMo: process.env.SLOWMO_MS,
      dumpio: false,
      // use chrome installed by puppeteer
  });
  await run(browser)
  .then((result) => console.log(result))
  .catch((err) => console.error(err));
  await browser.close();
})();