import cheerio from 'cheerio';

export function preprocessContent(content: string): [string, string[]] {
  const $ = cheerio.load(content);
  const imageUrls: string[] = [];
  $('img').each((idx, e) => {
    const url = $(e).attr('data-original');
    if (url) imageUrls.push(url);
  });

  $('script, iframe, video').each((idx, e) => {
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
    throw Error('Content not found');
  }

  return [contentText, imageUrls];
}
