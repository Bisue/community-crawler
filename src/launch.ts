import puppeteer from 'puppeteer';

const launch = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  return page;
};

export default launch;
