import cheerio from 'cheerio';

export function preprocessContent(content: string) {
  const $ = cheerio.load(content);
  $('script, img, iframe, video').each((idx, e) => {
    $(e).remove();
  });
  const contentText = $.root()
    .html()
    ?.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, ' ')
    .replace(/&gt;/g, ' ')
    .replace(/&lt;/g, ' ')
    .replace(/&rlm;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/- dc official App/g, '')
    .trim();
  if (contentText == undefined) {
    console.log('ERROR!');
    return null;
  }

  return contentText;
}
