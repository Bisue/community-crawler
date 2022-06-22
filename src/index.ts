import Everytime from './community/everytime';
import config from './config';

(async () => {
  const everytime = new Everytime({
    login: {
      id: config.everytime.id,
      pw: config.everytime.pw,
    },
  });

  await everytime.crawl({
    chunk: {
      amount: 50,
    },
    range: {
      from: 1,
      to: 1000,
    },
  });

  console.log('Crawl finished!');
})();
