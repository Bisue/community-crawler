import Dcinside from './crawler/dcinside';
import { crwalDetail } from './utils/detail';

(async () => {
  const dcinside = new Dcinside();

  console.log('===== CRAWLING =====');

  // let filepath = await dcinside.crawlRandom('baseball_new10', 40990, 43500, 600, 5);
  let filepath = await dcinside.crawlAllBest('baseball_new10', 1, 1);
  filepath = await crwalDetail(dcinside, filepath);

  console.log('crwal data saved at:', filepath);

  console.log('=====   END   ======');
})();
