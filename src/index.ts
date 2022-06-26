import Dcinside from './request/dcinside';
import fs from 'fs';

(async () => {
  const dcinside = new Dcinside();

  console.log('Crawl start');

  const posts = await dcinside.fetch('baseball_new11', 1, 100);
  fs.writeFileSync('./output.json', JSON.stringify(posts, null, 2));

  console.log('Crawl finished!');
  console.log(posts, posts.length);
})();
