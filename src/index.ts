import Fmkorea from './request/fmkorea';

(async () => {
  const fmkorea = new Fmkorea();

  console.log('Crawl start');

  await fmkorea.crawl('free', 5, 200);

  console.log('Crawl finished!');
})();
