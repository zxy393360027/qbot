const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { get } = require('http');

const dicClass = {
  'a': 'genshinimpact',
  'b': 'bluearchive',
  'c': 'azurlane',
  'd': 'honkai',
  'e': 'arknights',
  'f': ''
};

const askQuestion = (question) => {
  return new Promise((resolve) => {
    readline.question(question, (input) => {
      resolve(input);
    });
  });
};

async function get_random_pic(imageClass, R18) {
  if(!imageClass){
    imageClass='any'
  }
  let isR18 = (R18 === true)?'y':'n'
  let r18 = "";
  let cnt = 1;
  let r18Path = "non";
  if (isR18 === 'y') {
    r18 = "r18=1";
    r18Path = "r18";
  }

  const url = imageClass !== 'any' ? 
    `https://image.anosu.top/pixiv/direct?${r18}&keyword=${imageClass}` : 
    `https://image.anosu.top/pixiv/direct?${r18}`;
  console.log(`url:`,url);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 Edg/122.0.0.0'
  };

  const dirPath = path.join(__dirname, 'random_pic', imageClass);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  console.log(`正在抓取关键词为${imageClass}的${r18Path === "r18" ? "r18图片" : "普通图片"}`);

  try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.log(`请求失败，状态码：${response.status}`);
        return ''
      }  
      const name = path.basename(response.url);
      if (response.url.includes("没有与") && response.url.includes("相关的图片")) {
        console.log(`没有与${imageClass}相关的图片，请更换关键词重试`);
        return ''
      }
      const buffer = await response.buffer();
      const img_path=path.join(dirPath, name)
      fs.writeFileSync(img_path, buffer);
      console.log(`获取成功`);
      return img_path;
  } catch (error) {
      console.error(`下载失败：${error.message}`);
  }
}
// get_random_pic('碧蓝档案',true)
module.exports = {
  get_random_pic
}
