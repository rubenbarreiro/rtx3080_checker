const chromium = require('chrome-aws-lambda');
const { addExtra } = require('puppeteer-extra');
const puppeteerExtra = addExtra(chromium.puppeteer);
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
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

exports.getBrowser = async () => {
  let browser;

  try {
    browser = await puppeteerExtra.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    return browser;
  } catch (error) {
    throw error;
  }
};

