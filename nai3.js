const { HttpsProxyAgent } = require('https-proxy-agent');
const proxy = 'http://127.0.0.1:7890';
const agent = new HttpsProxyAgent(proxy);

const get_request_body=function(prompt,type){
    //生成seed
    function generateRandomNineDigitNumber() {
        const min = 100000000; // 最小的9位数
        const max = 999999999; // 最大的9位数
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let width;
    let height;
    if(type==="横图"){
        width=1216;
        height=832;
    }
    else if(type==="方图"){
        width=1024;
        height=1024;
    }
    else{
        width=832;
        height=1216;
    }
    const seed = generateRandomNineDigitNumber();
    console.log('seed:',seed);
    console.log('尺寸:',width,'x',height)
    prompt=prompt+',best quality, amazing quality, very aesthetic, absurdres'
    return {
        "input": prompt,
        "model": "nai-diffusion-3",
        "action": "generate",
        "parameters": {
            "params_version": 1,
            "width": width,
            "height": height,
            "scale": 5,
            "sampler": "k_euler",
            "steps": 28,
            "n_samples": 1,
            "ucPreset": 0,
            "qualityToggle": true,
            "sm": false,
            "sm_dyn": false,
            "dynamic_thresholding": false,
            "controlnet_strength": 1,
            "legacy": false,
            "add_original_image": true,
            "cfg_rescale": 0,
            "noise_schedule": "native",
            "legacy_v3_extend": false,
            "seed": seed,
            "negative_prompt": "nsfw,nipples,pussy, lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract], orgy",
            "reference_image_multiple": [],
            "reference_information_extracted_multiple": [],
            "reference_strength_multiple": []
        }
    } 
}

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 这里填自己的key',
    'x-correlation-id': 'ij9PyX',
    'Origin': 'https://novelai.net',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Priority': 'u=0',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
}

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const unzip = require('unzipper');
const { v4: uuidv4 } = require('uuid');
const requestUrl = 'https://image.novelai.net/ai/generate-image';

async function generateImage(prompt,type) {
    const requestBody=get_request_body(prompt,type)
    try {
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            agent: agent
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("生成成功");
        return response.buffer();
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
}

async function save_img(prompt,type) {
    const fixedDir = path.join(__dirname, 'output');
    if (!fs.existsSync(fixedDir)) {
        fs.mkdirSync(fixedDir, { recursive: true });
    }

    try {
        const imgBuffer = await generateImage(prompt,type);
        const tempZipPath = path.join(fixedDir, 'temp.zip');
        const uniqueFileName = `${uuidv4()}.png`; // 生成唯一的文件名
        const filePath = path.join(fixedDir, uniqueFileName);

        // 将 buffer 写入临时 zip 文件
        fs.writeFileSync(tempZipPath, imgBuffer);

        //用promise防止文件还没写入就进入下一步，entry.pipe(fs.createWriteStream(filePath))是一个异步操作，而且 finish 事件的处理也是异步的。这意味着当 finish 事件触发时，文件写入操作可能还在进行中，或者在文件系统层面上，文件可能还没有完全准备好。
        return new Promise((resolve, reject) => {
            fs.createReadStream(tempZipPath)
                .pipe(unzip.Parse())
                .on('entry', function (entry) {
                    const fileName = entry.path;
                    entry.pipe(fs.createWriteStream(filePath));
                })
                .on('finish', function () {
                    // 删除临时 zip 文件
                    fs.unlinkSync(tempZipPath);
                    console.log('Image saved to:', filePath);
                    resolve(uniqueFileName); // 文件写入完成，解决 Promise
                })
                .on('error', reject); // 如果发生错误，拒绝 Promise
        });
    } catch (err) {
        console.error('Error saving image:', err);
    }
}

// save_img('Komeiji Satori,, best quality, amazing quality, very aesthetic, absurdres');

module.exports = { 
    save_img
};