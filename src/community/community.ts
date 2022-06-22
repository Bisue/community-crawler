import puppeteer from 'puppeteer';
import launch from '../launch';

export type CommunityConfig = {
  login:
    | {
        id: string;
        pw: string;
      }
    | false;
};

export type Post = {
  title?: string;
  content: string;
  views?: number;
  comments?: string[];
  likes?: number;
  scrap?: number;
};

export type CrawlArgs = {
  filepath?: string;
  range?: {
    from: number;
    to: number;
  };
  chunk?: {
    amount: number;
  };
};

abstract class Community {
  protected timestamp: number;
  protected page: puppeteer.Page | null = null;

  constructor(protected config: CommunityConfig = { login: false }) {
    this.timestamp = Date.now();
  }

  protected abstract login(id: string, pw: string): Promise<boolean>;
  protected abstract run(args: unknown): Promise<Post[]>;

  public async crawl(args: CrawlArgs = {}) {
    this.page = await launch();

    if (this.config.login) {
      const { id, pw } = this.config.login;
      await this.login(id, pw);
    }

    const posts = await this.run(args);

    await this.page.close();
    this.page = null;

    return posts;
  }
}

export default Community;
