import cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import { htmlToText } from 'html-to-text';

export type Post = {
  title: string;
  hasImage: boolean;
  author: string;
  at: string;
  views: number;
  upVotes: number;
  content_raw: string;
  content: string;
  comments: number;
  downVotes: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Dcinside {
  protected http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: 'https://m.dcinside.com',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
      },
    });
  }

  public async fetch(boardId: string, start = 1, end = 10) {
    const posts: Post[] = [];
    for (let page = start; page <= end; page++) {
      console.log('-- page:', page);
      const pagePosts = await this.fetchPage(boardId, page);
      posts.push(...pagePosts);
    }
    return posts;
  }

  protected async fetchPage(boardId: string, page: number) {
    const basePath = '/board';
    const path = `${basePath}/${boardId}?page=${page}`;

    const { data: html } = await this.http.get<string>(path);

    const posts: Post[] = [];

    const $ = cheerio.load(html);
    const postElements = $('.gall-detail-lst .gall-detail-lnktb');
    for (const element of postElements) {
      const e = $(element);

      const title = e.find('.subjectin').text();
      console.log('title', title);

      const hasImage = e.find('.sp-lst-img').length == 0 ? false : true;
      const author = e.find('.ginfo li:nth-child(1)').text();

      const link = e.find('a:first-child').attr('href');
      if (link == undefined) continue;
      const { content_raw, content, at, views, comments, upVotes, downVotes } = await this.fetchPost(link);

      posts.push({
        title,
        content_raw,
        content,
        comments,
        upVotes,
        downVotes,
        hasImage,
        author,
        at,
        views,
      });

      // await sleep(100);
    }

    return posts;
  }

  protected async fetchPost(link: string) {
    const { data: html } = await this.http.get<string>(link);

    const $ = cheerio.load(html);

    const content_raw = ($('.thum-txtin').html() ?? '').trim();
    const content = htmlToText(content_raw);
    const at = $('.btm .ginfo2 li:nth-child(2)').text();
    const views = Number.parseInt($('.gall-thum-btm .ginfo2 li:nth-child(1)').text().split(' ')[1]);
    const comments = Number.parseInt($('.gall-thum-btm .ginfo2 li:nth-child(3)').text().split(' ')[1]);
    const upVotes = Number.parseInt($('#recomm_btn').text());
    const downVotes = Number.parseInt($('#nonrecomm_btn').text());

    return {
      content_raw,
      content,
      at,
      views,
      comments,
      upVotes,
      downVotes,
    };
  }
}

export default Dcinside;
