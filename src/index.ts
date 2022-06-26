import Dcinside from './request/dcinside';

(async () => {
  const dcinside = new Dcinside();

  console.log('Crawl start');

  const posts = await dcinside.fetch('baseball_new11', 1, 10);
  console.log(posts, posts.length);

  console.log('Crawl finished!');
})();
