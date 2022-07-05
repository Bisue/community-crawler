import Dcinside from './crawler/dcinside';
import { crwalDetail } from './utils/detail';

(async () => {
  const dcinside = new Dcinside();

  console.log('===== CRAWLING =====');

  // best 6000, random 30000
  // let filepath = await dcinside.crawlRandom('baseball_new10', 1, 17500, 6000, 5);
  // filepath = await crwalDetail(dcinside, filepath);
  let filepath = await dcinside.crawlAllBest('baseball_new10', 1, 30);
  filepath = await crwalDetail(dcinside, filepath);

  console.log('crwal data saved at:', filepath);

  console.log('=====   END   ======');
})();
