const { chromium } = require("playwright");
const pLimit = require("p-limit").default;

async function scrapeMaps(query) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('div[role="feed"]');

  const scrollContainer = await page.$('div[role="feed"]');

  let previousHeight;

  while (true) {
    const height = await scrollContainer.evaluate(el => el.scrollHeight);

    if (height === previousHeight) break;
    previousHeight = height;

    await scrollContainer.evaluate(el => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(2000);
  }

  const links = await page.$$eval(
    'a.hfpxzc',
    anchors => anchors.map(a => a.href)
  );

  console.log(`Collected ${links.length} place URLs`);

  const limit = pLimit(5); // parallel workers

  const results = await Promise.all(
    links.map(link =>
      limit(() => scrapeDetail(browser, link))
    )
  );

  await browser.close();

  return results.filter(Boolean);
}

async function scrapeDetail(browser, url) {
  await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("h1", { timeout: 10000 });

    const data = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.innerText || null;

      const name = getText("h1");

      const address = getText('button[data-item-id="address"]');

      const phone = getText('button[data-item-id^="phone"]');

      const website =
        document.querySelector('a[data-item-id="authority"]')?.href || null;

      const rating =
        document.querySelector(".MW4etd")?.innerText || null;

      const reviews =
        document.querySelector(".UY7F9")?.innerText || null;

      const hours =
        document.querySelector('[aria-label*="Hours"]')?.innerText || null;

      return {
        name,
        address,
        phone,
        website,
        rating,
        reviews,
        hours,
        mapsUrl: window.location.href
      };
    });

    await page.close();

    return data;
  } catch (err) {
    await page.close();
    return null;
  }
}

module.exports = scrapeMaps;
