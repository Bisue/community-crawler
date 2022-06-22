import fs from 'fs';
import path from 'path';
import Community, { Post, CrawlArgs } from './community';

class Everytime extends Community {
  protected async login(id: string, pw: string) {
    if (!this.page) throw Error(`Page closed.`);

    try {
      await this.page.goto('https://everytime.kr/login');

      await this.page.type(`input[name="userid"]`, id);
      await this.page.type(`input[name="password"]`, pw);

      await this.page.click(`input[type="submit"]`);
    } catch (e) {
      return false;
    }

    return true;
  }

  private async crawlPage(boardId: string, page: number) {
    if (!this.page) throw Error(`Page closed.`);

    console.log('-- current page:', page, ` [${new Date().toISOString()}]`);

    await this.page.goto(`https://everytime.kr/${boardId}/p/${page.toString()}`);
    await this.page.waitForSelector('.articles article a');

    const links = await this.page.$$eval('.articles article a', (elements) =>
      elements.map((e) => `https://everytime.kr` + e.getAttribute('href'))
    );

    const posts: Post[] = [];
    for (const link of links) {
      await this.page.goto(link);
      await this.page.waitForSelector('.articles>article');

      const container = await this.page.$('.articles>article');
      if (!container) throw Error('Error occur during find article container.');

      const article = await container.$('.article');
      const comments = await container.$$('.comments article');
      if (!article) throw Error('Error occur during find article.');

      const title = await article.$eval('h2.large', (e) => e.textContent);
      const content = await article.$eval('p.large', (e) => e.innerHTML.trim().replace(/<br>/gi, '\n'));
      const votes = await article.$eval('.status .vote', (e) => e.textContent);
      const scrap = await article.$eval('.status .scrap', (e) => e.textContent);
      if (!content) throw Error('Error occur during find article content.');

      const commentContents = await Promise.all(
        comments.map(async (e) => await e.$eval('p.large', (t) => t.textContent ?? ''))
      );

      posts.push({
        content,
        comments: commentContents,
        ...(title != null && { title: title }),
        ...(votes != null && { likes: Number.parseInt(votes) }),
        ...(scrap != null && { scrap: Number.parseInt(scrap) }),
      });
    }

    return posts;
  }

  protected async run(args: CrawlArgs = {}) {
    if (!this.page) throw Error(`Page closed.`);

    const posts: Post[] = [];

    const { from, to } = args.range ?? { from: 1, to: 5 };

    let page: number;
    for (page = from; page <= to; page++) {
      const pagePosts = await this.crawlPage('377389', page);
      posts.push(...pagePosts);

      // save chunk & flush
      if (args.chunk != undefined) {
        // check savepoint
        if (page % args.chunk.amount == 0) {
          // create target directory
          const filepath = args.filepath ?? `./results/${this.timestamp}`;
          if (!fs.existsSync(filepath)) {
            fs.mkdirSync(filepath);
          }

          // json file full path
          const fullpath = path.join(filepath, `posts-${page / args.chunk.amount}.json`);

          // write & flush buffer
          fs.writeFileSync(fullpath, JSON.stringify(posts, null, 2));
          posts.splice(0, posts.length);

          console.log(`chunk saved on '${fullpath}'.`);
        }
      }
    }

    // save remained posts
    const filepath = args.filepath ?? `./results/${this.timestamp}`;
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath);
    }

    // json file full path
    const fullpath = path.join(filepath, `posts-remained.json`);

    // write & flush buffer
    fs.writeFileSync(fullpath, JSON.stringify(posts, null, 2));
    posts.splice(0, posts.length);

    console.log(`remained chunk saved on '${fullpath}'.`);

    return posts;
  }
}

export default Everytime;
