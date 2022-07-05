import Dcinside from './crawler/dcinside';

(async () => {
  const dcinside = new Dcinside();

  console.log('===== CRAWLING =====');

  // best 6000, random 30000
  await dcinside.crawlRandom('baseball_new11', 1, 14500, 10000, 10);
  await dcinside.crawlAllBest('baseball_new11', 1, 24);

  console.log('=====   END   ======');
})();
