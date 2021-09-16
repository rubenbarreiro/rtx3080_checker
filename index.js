const setup = require("./setup");
const to = require("await-to-js").default;
const Telegram = require("telegram-bot-api");
const imap = require("./imap");
/* eslint-disable */
const URLS = [
  // "https://www.newegg.com/gpk-systems-uk-2prong-6f-power-cables/p/0ZK-01A8-00066",
  // 'https://www.newegg.com/Product/ComboDealDetails?ItemList=Combo.4212ddd336',
  // 'https://www.newegg.com/Product/ComboDealDetails?ItemList=Combo.4212748',
  "https://www.newegg.com/asus-geforce-rtx-3080-rog-strix-rtx3080-o10g-gaming/p/N82E16814126457",
  "https://www.newegg.com/gigabyte-geforce-rtx-3080-gv-n3080aorus-x-10gd/p/N82E16814932345",
  "https://www.newegg.com/evga-geforce-rtx-3080-10g-p5-3897-kr/p/N82E16814487518",
];
/* eslint-enable */

exports.handler = async (event, context, callback) => {
  console.log("==== Starting function, will open browser ====");
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const browser = await setup.getBrowser();
    console.log("Browser launched!");
    const result = await exports.run(browser);
    await browser.close();
    console.log("==== Ending function ====");
    callback(null, result);
  } catch (e) {
    console.log("==== SOMETHING HAPPENED! ====", e);
    callback(e);
  }
};

const notifyStock = async (productName, link, telegramApi) => {
  console.log("THERE IS STOCK!!");
  telegramApi.sendMessage({
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `Stock found for "${productName}" at ${link}`,
  });
};

const notifyError = async (link, telegramApi) => {
  console.log("Something bad happened!!");
  telegramApi.sendMessage({
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `Could not find button container for ${link}`,
  });
};

const closePopup = async (page) => {
  console.log("Trying to close popup...");
  const [errPopup, popupClose] = await to(
    page.waitForSelector("#popup #popup-close", { timeout: 5000 })
  );
  if (errPopup || !popupClose) {
    console.log("no popup to close!");
    return;
  }

  if (popupClose) {
    console.log("closed the motherfucker popup!!!");
    await page.click("#popup #popup-close");
  }
};

function waitForFrame(page) {
  let fulfill;
  const promise = new Promise(x => fulfill = x);
  checkFrame();
  return promise;

  function checkFrame() {
    const frame = page.frames().find(f => f.name().match(/payment/) !== null);
    if (frame)
      fulfill(frame);
    else
      page.once('frameattached', checkFrame);
  }
}

const checkRetypeModal = async (page) => {
  console.log("65 index.js >  === checking retype card number modal");
  const [errCard, cardModal] = await to(
    page.waitForSelector(".modal iframe", { timeout: 10000 })
  );
  if (errCard || !cardModal) {
    console.log("68 index.js >  === no card number modal");
    return;
  }

  const frame = await waitForFrame(page);

  console.log("72 index.js >  === gotta put that card number again");
  await frame.waitForSelector('.modal-content input', {timeout: 10000});
  await frame.waitForTimeout(5000);
  await frame.type(".modal-content input", process.env.CREDIT_CARD_NUMBER, {
    delay: 100,
  });
  await frame.click(".modal-footer .btn-primary");
};

const buyProduct = async (page, selector, producName, telegramApi) => {
  console.log(`Will buy the product! with selector: ${selector}`);
  await closePopup(page);
  await page.click(selector);

  const [err, confirmAddToCart] = await to(
    page.waitForSelector(".modal .btn.btn-primary")
  );

  if (confirmAddToCart) {
    await page.click(".modal .btn.btn-primary");
  }

  await page.goto("https://secure.newegg.com/shop/cart", {
    waitUntil: ["domcontentloaded", "networkidle0"],
  });

  const facemaskClose = await page.$("[data-dismiss='modal']");
  if (facemaskClose) {
    await page.click("[data-dismiss='modal']");
  }

  await page.click(".summary-actions .btn.btn-primary");
  await page.waitForNavigation();

  console.log("\x1b[33m 66 index.js >  === \x1b[0m ");
  await page.waitForSelector("input[type=email]");
  await page.type("input[type=email]", process.env.NEWEGG_ACCOUNT_EMAIL, {
    delay: 100,
  });
  await page.waitForTimeout(1000);
  // await page.waitForSelector('#signInSubmit:not([disabled])');
  console.log("\x1b[33m 70 index.js >  === \x1b[0m ");
  const [errorSubmit] = await to(page.click("#signInSubmit"));
  if (errorSubmit) {
    console.log("solving captchas");
    await page.solveRecaptchas();
    await page.click("#signInSubmit");
  }

  const [errPassword, passwordInput] = await to(
    page.waitForSelector("input[type=password]", { timeout: 2000 })
  );
  if (errPassword || !passwordInput) {
    const [errCode, code] = await to(imap.connectAndSearch());
    if (errCode || !code) {
      console.error("Could not get newegg code", err, code);
      return;
    }

    console.log("newegg code === ", code);
    await page.type(".form-v-code input:nth-child(1)", code[0], { delay: 25 });
    await page.type(".form-v-code input:nth-child(2)", code[1], { delay: 25 });
    await page.type(".form-v-code input:nth-child(3)", code[2], { delay: 25 });
    await page.type(".form-v-code input:nth-child(4)", code[3], { delay: 25 });
    await page.type(".form-v-code input:nth-child(5)", code[4], { delay: 25 });
    await page.type(".form-v-code input:nth-child(6)", code[5], { delay: 25 });
  } else {
    await page.type(
      "input[type=password]",
      process.env.NEWEGG_ACCOUNT_PASSWORD,
      { delay: 100 }
    );
  }

  await page.waitForTimeout(200);

  console.log("\x1b[33m 75 index.js >  === \x1b[0m ");
  await Promise.all([page.waitForNavigation(), page.click("#signInSubmit")]);
  const [errorSubmitAgain, signInButton] = await to(
    page.waitForSelector("#signInSubmit", { timeout: 1000 })
  );
  if (signInButton) {
    await page.solveRecaptchas();
    await Promise.all([page.waitForNavigation(), page.click("#signInSubmit")]);
  }
  // await page.waitForTimeout(10000);
  // Click button: continue to payment
  console.log("\x1b[33m 76 index.js >  === \x1b[0m ");
  await page.waitForSelector("[data-status=add] button.btn-primary");
  await page.click("[data-status=add] button.btn-primary");
  // await page.waitForTimeout(10000);

  console.log("\x1b[33m 79 index.js >  === \x1b[0m ");
  // await page.waitForSelector('[data-status=add]');
  await page.waitForSelector(".retype-security-code input");
  await page.focus(".retype-security-code input");
  // await page.keyboard.type('404')
  await page.type(
    ".retype-security-code input",
    process.env.NEWEGG_ACCOUNT_CVV2,
    { delay: 120 }
  );
  // await page.$eval('.retype-security-code input', el => el.value = '404');
  await page.waitForTimeout(2000);
  await page.click("[data-status=add] button.btn-primary");
  await page.waitForTimeout(2000);
  await page.type(
    ".retype-security-code input",
    process.env.NEWEGG_ACCOUNT_CVV2,
    { delay: 120 }
  );
  await page.waitForTimeout(2000);
  await page.click("[data-status=add] button.btn-primary");
  await page.waitForTimeout(3000);
  await page.waitForSelector("#btnCreditCard");

  console.log("\x1b[33m 85 index.js >  === \x1b[0m ");
  await checkRetypeModal(page);
  console.log("\x1b[33m 95 index.js >  === \x1b[0m ");
  await page.waitForSelector('#btnCreditCard', {timeout: 5000})
  await page.click("#btnCreditCard");
  console.log("\x1b[33m 97 index.js >  === \x1b[0m ");
  await page.waitForNavigation();

  await page.waitForTimeout(10000);

  notifyBuy(producName, telegramApi);
};

const notifyBuy = async (producName, telegramApi) => {
  telegramApi.sendMessage({
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `I bought "${producName}" just for you! no need to thank me <3`,
  });
};

const browsePage = async (url, browser, telegramApi) => {
  const page = await browser.newPage();
  try {
    page.on("error", (error) => {
      console.error("21 index.js > error === ", error);
      page.close();
    });

    console.log(`Will browse to ${url}`);
    await page.goto(url, {
      waitUntil: ["domcontentloaded", "networkidle0"],
    });

    if (url === "https://www.newegg.com/") {
      console.log("=== Newegg homepage! ===");
      await page.waitForTimeout(3000);
      await page.close();
      return;
    }

    console.log('page loaded, will check for "Add to cart" button');

    console.log("Using NewEgg checker");
    const buyPanel = await page.$("#ProductBuy");
    if (!buyPanel) {
      // Combo buying implementation. not supported anymore. don't care about combos
      /*const comboButton = await page.$(".atnPrimary");
      if (!comboButton) {
        console.log("Page does not contain any product");
        await page.close();
        return;
      }

      console.log("=== Product is a combo ===");
      const comboText = await comboButton.evaluate((node) => node.innerText);
      if (!comboText.trim().match(/ADD\sTO\sCART/)) {
        console.log("No stock...");
        await page.close();
        return;
      }

      const productTitleElement = await page.$("[itemprop=name]");
      const productTitle = await productTitleElement.evaluate(
        (node) => node.innerText
      );

      notifyStock(productTitle.trim(), url, telegramApi);
      await buyProduct(page, "", productTitle.trim(), telegramApi);*/
      notifyError(url, telegramApi);
      await page.close();
      return;
    }

    const buyButton = await buyPanel.$(".btn");
    if (!buyButton) {
      console.log("No stock...");
      await page.close();
      return;
    }

    const buttonText = await buyButton.evaluate((node) => node.innerText);
    if (buttonText.trim() === "ADD TO CART") {
      const productTitleDiv = await page.$(".product-title");
      const productTitle = await productTitleDiv.evaluate(
        (node) => node.innerText
      );

      notifyStock(productTitle.trim(), url, telegramApi);
      await buyProduct(
        page,
        "#ProductBuy .btn",
        productTitle.trim(),
        telegramApi
      );
    } else {
      console.log("No stock...");
    }

    await page.close();
  } catch (ex) {
    if (process.env.ENV === "local") {
      console.error(ex);
      process.exit(1);
    }

    console.error(ex);
    await page.close();
    // throw ex;
  }
};

exports.run = async (browser) => {
  const telegramApi = new Telegram({
    token: process.env.TELEGRAM_ACCESS_TOKEN,
  });

  for (const url of URLS) {
    const [err] = await to(browsePage(url, browser, telegramApi)); // eslint-disable-line
    console.log("\n\n");
  }
  return "done";
};
