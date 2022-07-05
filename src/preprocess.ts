import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const dataPath = path.join('./dataset/lol', 'detailed_posts_random.json');
const data = JSON.parse(fs.readFileSync(dataPath).toString());

const posts: any[] = [];
for (const post of data) {
  const $ = cheerio.load(post.content);
  $('script, img, iframe, video').each((idx, e) => {
    $(e).remove();
  });
  const contentText = $.root()
    .html()
    ?.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rlm;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/- dc official App/g, '')
    .trim();
  if (contentText == undefined) {
    console.log('ERROR!');
  }

  posts.push({
    ...post,
    content: contentText,
  });
}

const outputDir = `./results/${Date.now()}`;
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.writeFileSync(path.join(outputDir, 'preprocessed.json'), JSON.stringify(posts, null, 2));
