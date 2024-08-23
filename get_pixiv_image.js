const { HttpsProxyAgent } = require('https-proxy-agent');
const proxy = 'http://127.0.0.1:7890';
const agent = new HttpsProxyAgent(proxy);
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { url } = require('inspector');

const errorList = [];

const ajaxUrl = 'https://www.pixiv.net/ajax/illust/{}/pages';
const topUrl = 'https://www.pixiv.net/ranking.php';
const searchUrl = 'https://www.pixiv.net/tags';
const headers = {
    'accept': 'application/json',
    'accept-language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en-US;q=0.7,en;q=0.6',
    'dnt': '1',
    'cookie': '', // Replace with your Pixiv cookie
    'referer': 'https://www.pixiv.net/',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.75 Safari/537.36'
};

async function getTopUrl(num) {
    const params = new URLSearchParams({
        mode: 'daily',
        content: 'illust',
        p: num.toString(),
        format: 'json'
    });
    const response = await fetch(`${topUrl}?${params}`, { headers,agent });
    const data = await response.json();
    console.log('data',data)
    return data.contents;
}

function getTopPic(data) {
    const results = [];
    for (const url of data) {
        const illustId = url.illust_id;
        const illustUser = url.user_id;
        results.push({ illustId, illustUser });
    }
    // console.log(`共${results.length}张图片`);
    return results;
}


async function getList(pid) {
    const response = await fetch(ajaxUrl.replace('{}', pid), { headers, method: 'GET', agent });
    const json = await response.json();
    const listTemp = json.body;
    console.log('listTemp',listTemp)
    for (const l of listTemp) {
        const urlTamp = l.urls.original;
        // console.log('urlTamp',urlTamp);
        const filePath = path.join(__dirname, 'img', path.basename(urlTamp));
        if (!fs.existsSync(filePath)) {
            console.log(`开始下载：${path.basename(urlTamp)}`);
            const imgResponse = await fetch(urlTamp, { headers ,agent});
            if (!imgResponse.ok) {
                return pid; // Return the PID if there was an error
            }
            const buffer = await imgResponse.buffer();
            fs.writeFileSync(filePath, buffer);
        } else {
            console.log(`文件：${path.basename(urlTamp)}已存在，跳过`);
        }
    }
}

// async function downloadImages() {
//     console.log('开始抓取...');
//     for (let i = 1; i <= 1; i++) { // Pixiv daily ranking has up to 500 items
//         console.log(`正在抓取第${i}页...`);
//         const topData = await getTopUrl(i);
//         console.log(`第${i}页抓取完成`);
//         // console.log(topData.length)
//         // console.log(topData[0])
//         const pics=getTopPic(topData)
//         let count=0
//         for (const { illustId, illustUser } of pics) {
//             console.log(`正在抓取PID：${illustId}，UID：${illustUser}`);
//             await getList(illustId);
//             console.log(`PID：${illustId}，UID：${illustUser}抓取完成`);
//             count++;
//             console.log(`已抓取${count}张图片`)
//             if(count>=8){
//                 break;
//             }
//         }
//     }

//     // Handle errors by deleting the files for the failed illustIds
//     for (const k of errorList) {
//         const filePath = path.join(__dirname, 'pixiv_data', `${k}.txt`);
//         if (fs.existsSync(filePath)) {
//             fs.unlinkSync(filePath);
//         }
//     }
// }

async function downloadImages() {
    console.log('开始抓取...');
    for (let i = 1; i <= 1; i++) { // Pixiv daily ranking has up to 500 items
        console.log(`正在抓取第${i}页...`);
        const topData = await getTopUrl(i);
        console.log(`第${i}页抓取完成`);
        const pics = getTopPic(topData);
        let count = 0;
        for (const { illustId, illustUser } of pics) {
            console.log(`正在抓取PID：${illustId}，UID：${illustUser}`);
            try {
                await getList(illustId);
                console.log(`PID：${illustId}，UID：${illustUser}抓取完成`);
            } catch (error) {
                console.error(`PID：${illustId}，UID：${illustUser}抓取失败，错误信息：${error.message}`);
                // 将失败的illustId添加到错误列表中，以便后续处理
                errorList.push(illustId);
            }
            count++;
            console.log(`已抓取${count}张图片`);
            if (count >= 7) {
                break;
            }
        }
    }

    // Handle errors by deleting the files for the failed illustIds
    for (const k of errorList) {
        const filePath = path.join(__dirname, 'pixiv_data', `${k}.txt`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}



if (require.main === module) {
    (async () => {
        await downloadImages();
    })();
}

module.exports={
    downloadImages
}
