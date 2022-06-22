import { Post } from './community/community';
import fs from 'fs';

function merge() {
  const result: any[] = [];

  const chunk = 20;
  for (let i = 1; i <= chunk; i++) {
    const raw = fs.readFileSync(`./data/1/posts-${i}.json`).toString();
    const json: Post[] = JSON.parse(raw);
    console.log(`merge.. ${i}`);
    result.push(...json);
  }
  const raw = fs.readFileSync(`./data/1/posts-remained.json`).toString();
  const json: Post[] = JSON.parse(raw);
  result.push(...json);

  fs.writeFileSync('./data/1/result.json', JSON.stringify(result, null, 2));
}

function showInfo() {
  const raw = fs.readFileSync('./data/1/result.json').toString();
  const json: Post[] = JSON.parse(raw);
  console.log(`==== 총 ${json.length}개의 Posts ====`);
  console.log(`---- ${json[0].at} ~ ${json[json.length - 1].at}`);

  // max
  const maxLikes = json.reduce((acc, cur) => {
    if (cur.likes != undefined) {
      return acc < cur.likes ? cur.likes : acc;
    }
    return acc;
  }, 0);
  const maxScraps = json.reduce((acc, cur) => {
    if (cur.scrap != undefined) {
      return acc < cur.scrap ? cur.scrap : acc;
    }
    return acc;
  }, 0);
  const maxComments = json.reduce((acc, cur) => {
    if (cur.comments?.length != undefined) {
      return acc < cur.comments?.length ? cur.comments?.length : acc;
    }
    return acc;
  }, 0);

  // average
  const sumLikes = json.reduce((acc, cur) => {
    if (cur.likes != undefined) {
      return acc + cur.likes;
    }
    return acc;
  }, 0);
  const sumScraps = json.reduce((acc, cur) => {
    if (cur.scrap != undefined) {
      return acc + cur.scrap;
    }
    return acc;
  }, 0);
  const sumComments = json.reduce((acc, cur) => {
    if (cur.comments?.length != undefined) {
      return acc + cur.comments?.length;
    }
    return acc;
  }, 0);
  const avgLikes = sumLikes / json.length;
  const avgScraps = sumScraps / json.length;
  const avgComments = sumComments / json.length;

  console.log(`- max:     likes(${maxLikes}), scraps(${maxScraps}), comments(${maxComments})`);
  console.log(`- average: likes(${avgLikes}), scraps(${avgScraps}), comments(${avgComments})`);
}

if (!fs.existsSync('./data/1/result.json')) {
  merge();
}
showInfo();
