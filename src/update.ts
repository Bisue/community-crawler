import Dcinside from './crawler/dcinside';
import { crwalDetail } from './utils/detail';

(async () => {
  const originalPath = './original/22-06-14_22-07-06.json';
  console.log(`target: ${originalPath}`);
  const dcinside = new Dcinside();

  console.log('===== CRAWLING =====');
  const filepath = await crwalDetail(dcinside, originalPath);

  console.log('crwal data saved at:', filepath);

  console.log('=====   END   ======');
})();
