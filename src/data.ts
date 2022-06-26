import fs from 'fs';
import path from 'path';

const queues = [];

// 합치기
for (let i = 1; i <= 6; i++) {
  const dir = `./temp/${i}`;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullpath = path.join(dir, file);

    const queue = JSON.parse(fs.readFileSync(fullpath).toString());
    queues.push(...queue);
  }
}

// 중복 제거
const distinct = queues.filter(function (item, pos, list) {
  const p = list
    .map(function (e) {
      return e.link;
    })
    .indexOf(item.link);
  return p == pos;
});

distinct.forEach((e) => {
  if (e.likes == null) {
    e.likes = 0;
  }
});
distinct.forEach((e) => {
  if (e.views == 0) {
    console.log(e);
  }
});

console.log(queues.length, distinct.length);
fs.writeFileSync('./queue.json', JSON.stringify(distinct, null, 2));

const maxViews = distinct.reduce((acc, cur) => {
  return acc > cur.views ? acc : cur.views;
}, 0);
const maxLikes = distinct.reduce((acc, cur) => {
  return acc > cur.likes ? acc : cur.likes;
}, 0);
const minViews = distinct.reduce((acc, cur) => {
  return acc < cur.views ? acc : cur.views;
}, Number.MAX_VALUE);
const minLikes = distinct.reduce((acc, cur) => {
  return acc < cur.likes ? acc : cur.likes;
}, Number.MAX_VALUE);
const avgViews =
  distinct.reduce((acc, cur) => {
    return acc + cur.views;
  }, 0) / distinct.length;
const avgLikes =
  distinct.reduce((acc, cur) => {
    return acc + cur.likes;
  }, 0) / distinct.length;

console.log('views max:', maxViews);
console.log('views avg:', avgViews);
console.log('views min:', minViews);
console.log('likes max:', maxLikes);
console.log('likes avg:', avgLikes);
console.log('likes min:', minLikes);
