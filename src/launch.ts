import puppeteer from 'puppeteer';

const launch = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36'
  );

  return page;
};

export default launch;
