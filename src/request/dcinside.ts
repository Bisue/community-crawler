import cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

// types
export type Post = {
  link: string | null;
  title: string;
  author: string;
  anonymous: boolean;
  date: string;
  datetime: string | null;
  onlyText: boolean; //
  hasImage: boolean; //
  hasVideo: boolean; //
  views: number;
  upVotes: number;
  // downVotes: number;
  comments: number;
};

// delay function
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// random delay function
async function randomSleep(min: number, max: number) {
  const delay = Math.random() * (max - min) + min;
  console.log(`sleeping... (${(delay / 1000).toFixed(2)}s)`);
  await sleep(delay);
}

// Fisher-Yates shuffle
function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// dcinside crawler
class Dcinside {
  // axios instance
  protected http: AxiosInstance;
  protected timestamp: number;

  constructor() {
    this.http = axios.create({
      baseURL: 'https://m.dcinside.com',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
      },
    });
    this.timestamp = Date.now();
  }

  protected async save(data: any, filename: string) {
    const dir = `./results/${this.timestamp}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const fullpath = path.join(dir, filename);
    fs.writeFileSync(fullpath, JSON.stringify(data, null, 2));
  }

  // 특정 게시판 특정 페이지 게시글 목록 크롤링
  protected async getPosts(board: string, page: number, best: boolean) {
    const url = `/board/baseball_new10?page=${page}${best ? '&recommend=1' : ''}`;

    const { data: html } = await this.http.get<string>(url, { headers: { Cookie: 'list_count=200;' } });
    const $ = cheerio.load(html);

    const elements = $('.gall-detail-lst > li:not(.adv-inner)');
    const posts: Post[] = [];
    elements.each((_, e) => {
      const element = $(e);

      const link = element.find('.gall-detail-lnktb > a').first().attr('href')?.trim() || null;
      const title = element.find('.subjectin').first().text().trim();
      const author = element.find('.ginfo li').first().text().trim();
      const anonymous = element.find('.ginfo .sp-nick').length == 0 ? true : false;
      const date = dayjs(element.find('.ginfo li').eq(1).text().trim(), 'MM.DD').year(2022).format('YYYY-MM-DD');
      const datetime = null;
      const onlyText = element.find('.sp-lst-txt, .sp-lst-recotxt').length == 0 ? false : true;
      const hasImage = element.find('.sp-lst-img, .sp-lst-recoimg').length == 0 ? false : true;
      const hasVideo = element.find('.sp-lst-play, .sp-lst-recoplay').length == 0 ? false : true;
      const views = Number.parseInt(element.find('.ginfo li').eq(2).text().trim().split(' ')[1]);
      const upVotes = Number.parseInt(element.find('.ginfo li').eq(3).text().trim().split(' ')[1]);
      const comments = Number.parseInt(element.find('.gall-detail-lnktb > .rt .ct').first().text().trim());

      posts.push({
        link,
        title,
        author,
        anonymous,
        date,
        datetime,
        onlyText,
        hasImage,
        hasVideo,
        views,
        upVotes,
        comments,
      });
    });

    return posts;
  }

  // 페이지 범위 내 모든 글 크롤링 (일반글)
  public async crawlAll(board: string, start: number, end: number) {
    const posts: Post[] = [];

    let errorCount = 0;
    for (let page = start; page <= end; page++) {
      try {
        console.log(`CUR PAGE: ${page}p`);
        const pagePosts = await this.getPosts(board, page, false);
        posts.push(...pagePosts);
        console.log(`SUCCESS!`);
      } catch (e) {
        console.error(`===== ERROR! (${page}p) =====`);
        console.error(e);
        errorCount++;
      } finally {
        if (page < end) await randomSleep(5000, 15000);
      }
    }

    console.log(`CRAWL ALL  : ${start}p ~ ${end}p`);
    console.log(`ERROR      : ${errorCount}`);
    console.log(`POSTS COUNT: ${posts.length}`);
    this.save(posts, 'crawl_all.json');
  }

  // 페이지 범위 내 랜덤으로 글 크롤링 (일반글)
  public async crawlRandom(board: string, min: number, max: number, total: number, perPage: number) {
    const posts: Post[] = [];

    const selectedPages: number[] = [];
    let errorCount = 0;
    while (posts.length < total) {
      // min <= page <= max
      const page = Math.floor(Math.random() * (max - min + 1) + min);
      if (selectedPages.includes(page)) continue;
      selectedPages.push(page);

      try {
        console.log(`SELECTED PAGE: ${page}p`);
        const pagePosts = await this.getPosts(board, page, false);
        shuffle(pagePosts);
        const selectedPosts = pagePosts.slice(0, perPage);
        posts.push(...selectedPosts);
        console.log(`SUCCESS! - (${posts.length}/${total})`);
      } catch (e) {
        console.error(`===== ERROR! (${page}p) =====`);
        console.error(e);
        errorCount++;
      } finally {
        if (posts.length < total) await randomSleep(5000, 15000);
      }
    }

    console.log(`SELECTED PAGES: ${selectedPages}`);
    console.log(`CRAWL RANDOM  : ${min}p ~ ${max}p`);
    console.log(`ERROR         : ${errorCount}`);
    console.log(`POSTS COUNT   : ${posts.length}`);
    this.save(posts, 'crawl_random.json');
    this.save(selectedPages, 'crawl_random_selected_pages.json');
  }

  // 페이지 범위 내 모든 글 크롤링 (개념글)
  public async crawlAllBest(board: string, start: number, end: number) {
    const posts: Post[] = [];

    let errorCount = 0;
    for (let page = start; page <= end; page++) {
      try {
        console.log(`CUR PAGE: ${page}`);
        const pagePosts = await this.getPosts(board, page, true);
        posts.push(...pagePosts);
        console.log(`SUCCESS!`);
      } catch (e) {
        console.error(`===== ERROR! (${page}p) =====`);
        console.error(e);
        errorCount++;
      } finally {
        if (page < end) await randomSleep(5000, 15000);
      }
    }

    console.log(`CRAWL ALL BEST: ${start}p ~ ${end}p`);
    console.log(`ERROR         : ${errorCount}`);
    console.log(`POSTS COUNT   : ${posts.length}`);
    this.save(posts, 'crawl_all_best.json');
  }

  // // 페이지 범위 내 랜덤으로 글 크롤링 (개념글)
  // public async crawlRandomBest(board: string, start: number, end: number) {
  //   //
  // }
}

export default Dcinside;
