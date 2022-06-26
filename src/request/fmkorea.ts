import cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import { htmlToText } from 'html-to-text';
import fs from 'fs';
import path from 'path';

export type Post = {
  category: string;
  title: string;
  content: string;
  hasImage: boolean;
  author: string;
  at: string;

  views: number;
  likes: number;
  comments: number;
};

export type PostQueue = {
  link: string;
  category: string;
  title: string;
  hasImage: boolean;
  author: string;

  views: number;
  likes: number;
}[];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Fmkorea {
  protected http: AxiosInstance;
  protected now: number;
  protected chunk: number;
  protected queueChunk: number;

  constructor() {
    this.http = axios.create({
      baseURL: 'https://www.fmkorea.com',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      },
    });
    this.now = Date.now();
    this.chunk = 0;
    this.queueChunk = 0;
  }

  protected async getList(board: string, start = 1, end = 5) {
    const postQueue: PostQueue = [];

    for (let page = start; page <= end; page++) {
      try {
        console.log('========== page:', page, '==========');
        const path = `/index.php?mid=${board}&page=${page}`;

        const { data: html } = await this.http.get<string>(path);
        const $ = cheerio.load(html);

        const postElements = $('table.bd_lst tbody > tr:not(.notice)');

        for (const postElement of postElements) {
          const post = $(postElement);

          const category = post.find('td.cate').text().trim();
          const link = post.find('td.title a:nth-child(1)').attr('href')?.trim();
          if (link == undefined) continue;
          const title = post.find('td.title a:nth-child(1)').text().trim();
          console.log('title:', title);
          const hasImage = post.find('td.title .attached_image').length == 0 ? false : true;
          const author = post.find('td.author').text().trim();

          const views = Number.parseInt(post.find('.m_no').first().text());
          const likes = Number.parseInt(post.find('.m_no_voted').text());

          postQueue.push({
            link,
            category,
            title,
            hasImage,
            author,
            views,
            likes,
          });

          console.log('- count:', postQueue.length);

          if (postQueue.length >= 100) {
            this.saveQueue(postQueue);
            postQueue.splice(0, postQueue.length);
          }
        }
      } catch (e) {
        console.log('========== Some Error Occur! ==========');
        console.log('---------- During Make Queue ----------');
        console.error(e);
        continue;
      }

      const delay = Math.random() * 5 + 0;
      console.log('---------- delay:', delay, '----------');
      await sleep(delay * 1000);
    }

    this.saveQueue(postQueue);
  }

  protected async getDetail(queue: PostQueue) {
    const posts: Post[] = [];

    for (const target of queue) {
      try {
        const detail = await this.crawlDetail(target.link);
        posts.push({ ...target, ...detail });

        if (posts.length >= 100) {
          this.save(posts);
          posts.splice(0, posts.length);
        }

        const delay = Math.random() * 5 + 0;
        console.log('---------- delay:', delay, '----------');
        await sleep(delay * 1000);
      } catch (e) {
        console.log('========== Some Error Occur! ==========');
        console.log('---------- During Get Detail ----------');
        console.error(e);
        continue;
      }
    }

    this.save(posts);
  }

  public async crawl(board: string, start = 1, end = 5) {
    await this.getList(board, start, end);
  }

  protected async crawlDetail(link: string) {
    const { data: html } = await this.http.get<string>(link);
    const $ = cheerio.load(html);

    const at = $('#bd_capture .date.m_no').text().trim();
    const comments = Number.parseInt($('#bd_capture .side.fr span:nth-child(3)').text().split(' ')[1]);
    const contentRaw = $('#bd_capture .rd_body .xe_content').html() ?? '';

    return {
      at,
      comments,
      content: contentRaw,
    };
  }

  protected saveQueue(queue: PostQueue) {
    const dir = path.join(`./queues/${this.now}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const filename = `${++this.queueChunk}.json`;
    const fullpath = path.join(dir, filename);

    fs.writeFileSync(fullpath, JSON.stringify(queue, null, 2));
  }

  protected save(posts: Post[]) {
    const dir = path.join(`./results/${this.now}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const filename = `${++this.chunk}.json`;
    const fullpath = path.join(dir, filename);

    fs.writeFileSync(fullpath, JSON.stringify(posts, null, 2));
  }
}

export default Fmkorea;
