import Dcinside, { Post } from './crawler/dcinside';
import fs from 'fs';
import { randomSleep } from './utils/sleep';
import path from 'path';

(async () => {
  const postsPath = './dataset/temp.json';
  const posts: Post[] = JSON.parse(fs.readFileSync(postsPath).toString());

  const dcinside = new Dcinside();
  const detailedPost: Post[] = [];

  console.log('===== DETAIL CRAWLING =====');

  let errorCount = 0;
  for (const post of posts) {
    try {
      console.log(`CUR POST: ${post.title}`);
      detailedPost.push(await dcinside.fillDetail(post));
      console.log(`SUCCESS! - ${detailedPost.length}/${posts.length}`);
    } catch (e) {
      console.error(`===== ERROR! (${post.link}) =====`);
      console.error(e);
      errorCount++;
    } finally {
      await randomSleep(5000, 15000);
    }
  }

  const dir = `./results/${dcinside.timestamp}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const fullpath = path.join(dir, 'detailed_posts.json');
  fs.writeFileSync(fullpath, JSON.stringify(detailedPost, null, 2));

  console.log('=====       END       =====');
  console.log(`DETAIL CRAWLING: ${posts.length}`);
  console.log(`ERROR          : ${errorCount}`);
  console.log(`RESULT COUNT   : ${detailedPost.length}`);
  console.log(`RESULT SAVE AT : ${fullpath}`);
})();