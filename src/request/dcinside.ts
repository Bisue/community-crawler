import cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import { htmlToText } from 'html-to-text';

export type Post = {
  no: string;
  title: string;
  hasImage: boolean;
  author: string;
  at: string;
  views: number;
  upVotes: number;
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
      baseURL: 'https://gall.dcinside.com/',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
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
    const basePath = '/board/lists';
    const path = `${basePath}?id=${boardId}&page=${page}`;

    const { data: html } = await this.http.get<string>(path);

    const posts: Post[] = [];

    const $ = cheerio.load(html);
    const postElements = $('table.gall_list tbody>tr.us-post');
    console.log('at:', postElements.length);
    for (const element of postElements) {
      const e = $(element);

      const no = e.find('.gall_num').text();
      if (no == '공지') continue;
      const title = e.find('.gall_tit > a:first-child').text();
      const hasImage = e.find('.gall_tit > .icon_img').length == 0 ? false : true;
      const author = e.find('.gall_writer .nickname').text();
      const at = e.find('.gall_date').attr('title');
      if (at == undefined) continue;
      const views = Number.parseInt(e.find('.gall_count').text());

      const { content, comments, upVotes, downVotes } = await this.fetchPost(boardId, no);

      posts.push({
        no,
        title,
        content,
        comments,
        upVotes,
        downVotes,
        hasImage,
        author,
        at,
        views,
      });

      await sleep(1000);
    }

    return posts;
  }

  protected async fetchPost(boardId: string, no: string) {
    const path = `/board/view?id=${boardId}&no=${no}`;

    const { data: html } = await this.http.get<string>(path);

    const $ = cheerio.load(html);

    const content = htmlToText($('.write_div').text());
    const comments = Number.parseInt($('.gall_comment').text().split(' ')[1]);
    const upVotes = Number.parseInt($('.up_num').text());
    const downVotes = Number.parseInt($('.down_num').text());

    return {
      content,
      comments,
      upVotes,
      downVotes,
    };
  }
}

export default Dcinside;
