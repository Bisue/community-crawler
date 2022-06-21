import launch from './launch';

(async () => {
  const page = await launch();
  await page.goto('https://google.com');

  const html = await page.content();
  console.log(html);

  await page.close();
})();
