import cheerio from 'cheerio';
import axios, { AxiosInstance } from 'axios';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import { shuffle } from '../utils/shuffle';
import { randomSleep } from '../utils/sleep';
import { preprocessContent } from '../utils/preprocess';

// types
export type Post = {
  link: string | null;
  title: string;
  content: string | null;
  author: string;
  anonymous: boolean;
  datetime: string | null;
  hasImage: boolean; //
  hasVideo: boolean; //
  isBest: boolean;
};

// dcinside crawler
class Dcinside {
  // axios instance
  protected http: AxiosInstance;
  public readonly timestamp: number;

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

  protected save(data: any, filename: string) {
    const dir = `./results/${this.timestamp}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const fullpath = path.join(dir, filename);
    fs.writeFileSync(fullpath, JSON.stringify(data, null, 2));

    return fullpath;
  }

  // 특정 게시판 특정 페이지 게시글 목록 크롤링
  protected async getPosts(board: string, page: number, best: boolean) {
    const url = `/board/${board}?page=${page}${best ? '&recommend=1' : ''}`;

    const { data: html } = await this.http.get<string>(url, { headers: { Cookie: 'list_count=200;' } });
    const $ = cheerio.load(html);

    const elements = $('.gall-detail-lst > li:not(.adv-inner)');
    const posts: Post[] = [];
    elements.each((_, e) => {
      const element = $(e);

      let link = element.find('.gall-detail-lnktb > a').first().attr('href')?.trim() || null;
      if (link != null) {
        link = link.split('?')[0];
      }
      const title = element.find('.subjectin').first().text().trim();
      const author = element.find('.ginfo li').first().text().trim();
      const anonymous = element.find('.ginfo .sp-nick').length == 0 ? true : false;
      const hasImage = element.find('.sp-lst-img, .sp-lst-recoimg').length == 0 ? false : true;
      const hasVideo = element.find('.sp-lst-play, .sp-lst-recoplay').length == 0 ? false : true;
      const isBest =
        element.find('.sp-lst-recotxt, .sp-lst-recoimg, .sp-lst-recoplay, .sp-lst-best').length == 0 ? false : true;

      posts.push({
        link,
        title,
        author,
        anonymous,
        // date: null,
        datetime: null,
        content: null,
        hasImage,
        hasVideo,
        isBest,
      });
    });

    return posts;
  }

  protected async getPostDetail(link: string) {
    const { data: html } = await this.http.get<string>(link);
    const $ = cheerio.load(html);

    // title
    const title = $('.gallview-tit-box .tit').first().text().trim();
    const author = $('.gallview-tit-box .ginfo2 li').first().text().trim();
    let content = $('.gall-thum-btm-inner .thum-txt .thum-txtin').first().html()?.trim() ?? null;
    if (content != null) {
      content = preprocessContent(content);
    }

    // datetime
    const datetime = dayjs(
      $('.gallview-tit-box .btm .ginfo2 > li').eq(1).text().trim(),
      'YYYY.MM.DD HH:mm:ss'
    ).format();

    // images, videos check
    const images = $('.gall-thum-btm-inner .thum-txtin img').length;
    const hasImage = images > 0 ? true : false;
    const videos = $('.gall-thum-btm-inner .thum-txtin video').length;
    const hasVideo = videos > 0 ? true : false;

    return { title, author, content, datetime, hasImage, hasVideo };
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
        if (page < end) await randomSleep(100, 500);
      }
    }

    console.log(`CRAWL ALL  : ${start}p ~ ${end}p`);
    console.log(`ERROR      : ${errorCount}`);
    console.log(`POSTS COUNT: ${posts.length}`);

    return this.save(posts, 'crawl_all.json');
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
        if (posts.length < total) await randomSleep(100, 500);
      }
    }

    console.log(`SELECTED PAGES: ${selectedPages}`);
    console.log(`CRAWL RANDOM  : ${min}p ~ ${max}p`);
    console.log(`ERROR         : ${errorCount}`);
    console.log(`POSTS COUNT   : ${posts.length}`);
    const filepath = this.save(posts, 'crawl_random.json');
    this.save(selectedPages, 'crawl_random_selected_pages.json');

    return filepath;
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
        if (page < end) await randomSleep(100, 500);
      }
    }

    console.log(`CRAWL ALL BEST: ${start}p ~ ${end}p`);
    console.log(`ERROR         : ${errorCount}`);
    console.log(`POSTS COUNT   : ${posts.length}`);
    return this.save(posts, 'crawl_all_best.json');
  }

  // // 페이지 범위 내 랜덤으로 글 크롤링 (개념글)
  // public async crawlRandomBest(board: string, start: number, end: number) {
  //   //
  // }

  public async fillDetail(post: Post): Promise<Post> {
    if (!post.link) throw Error('post.link not found!');

    const detail = await this.getPostDetail(post.link);

    return { ...post, ...detail };
  }
}

export default Dcinside;
