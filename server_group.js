const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const {send_private_msg,generate_image, send_group_msg,get_weather } = require('./api');
const {get_300_info}= require('./300_query');
const { catGirl,coc } = require('./character.js');
const {save_img} = require('./nai3.js')
const {downloadImages} = require('./get_pixiv_image.js')
const {get_random_pic} =require('./random_pic.js')
const path = require('path');
const fs= require('fs');
const cors= require('cors');
const {qwen_key}= require('./config.js')
app.use(cors());
const headers=`Bearer ${qwen_key} `// qwen的key
let isNai3RequestInProgress = false; //控制nai3访问量
// 选择角色模板
history = [{"role": "system", "content":catGirl},
            {"role":"assistant","content": "准备好了吗？"}]
// 定义openai接口
const OpenAI = require("openai"); 
const { group } = require('console');
const client = new OpenAI({
    apiKey: "sk-nKzpYJGtFv2Ed8r7zuuIdu4vCMw705RdB0uugNLXcFePqXQ6",    
    baseURL: "https://api.moonshot.cn/v1",
});
const nai3_queue = [];

const Redis = require('redis');
const redis = Redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// 连接事件监听
redis.on('connect', () => {
  console.log('Connected to Redis server');
});
let groups=[];
let groups_power=[];
// groups=[713686061,755594862,953506778,928917063,511710870,1018450371,472917044,760350654,786825478]
// groups_power=[713686061,760350654,786825478]
redis.lrange('groups',0,-1, (err, reply) => {
    if (err) throw err;
    groups=reply.map(item=>{return Number(item);});
});
redis.lrange('groups_power',0,-1,(err, reply) => {
    if (err) throw err;
    groups_power=reply.map(item=>{return Number(item);});
});//注意这个是异步函数，需要等待回调groups才有值

app.use(bodyParser.json());
// controller
app.post('/',async function (req, res) {
    const message=req.body
    if(message.message_type==="group"&&(groups.includes(message.group_id))){
        console.log(message.raw_message)
        if(message.raw_message.startsWith(`[CQ:at,qq=${message.self_id}]`)||message.raw_message.startsWith('@猫猫')){
            var instruction= message.raw_message.replace(`[CQ:at,qq=${message.self_id}]`,'').trim();
            instruction= instruction.replace('@猫猫','').trim();
            console.log("收到指令:"+instruction);
            if(instruction===''){
                await send_group_msg(message.group_id,'text','喵~诶哟你干嘛');
            }
            if(instruction.startsWith('画图')){
                console.log("开始画图");
                try{
                    send_group_msg(message.group_id,'text','正在画图，请稍等');
                    const url=await generate_image(instruction.slice(2));
                    await send_group_msg(message.group_id,'image',url);
                }
                catch(e){
                    console.log(e);
                    await send_group_msg(message.group_id,'text','画图失败');
                }
                console.log("发送图片成功")
            }
            else if(instruction.startsWith("查战绩")){
                try{
                    const user_name=instruction.slice(4,-2);
                    console.log("300查询指令,查询账号:",user_name);
                    const index=instruction.slice(instruction.length-1);
                    const userinfo=await get_300_info(user_name,index);
                    await send_group_msg(message.group_id,'text',userinfo);
                }
                catch(e){
                    console.log(e);
                    await send_group_msg(message.group_id,'text','查询失败');
                }

            }
            else if(instruction.startsWith('nai3')){
                if(nai3_queue.length===0&&!isNai3RequestInProgress){
                    isNai3RequestInProgress=true
                    nai3_queue.push(message)
                    await send_group_msg(message.group_id,'text','收到！nai3画图中，请不要重复发送nai3指令哦')
                    while(nai3_queue.length>0){
                        const message=nai3_queue.shift()
                        let instruction= message.raw_message.replace(`[CQ:at,qq=${message.self_id}]`,'').trim();//这个message和instruction是独立于其他任务的
                        console.log('收到nai3指令')
                        const args=instruction.split(' ')
                        try{
                            const validTypes = ['方图', '横图', '竖图'];
                            const lastArg = args[args.length - 1];
                            const type = validTypes.includes(lastArg) ? lastArg : '方图';
                            const prompt=validTypes.includes(lastArg)?instruction.slice(4,instruction.length-2):instruction.slice(4)
                            console.log('prompt:',prompt)
                            // 过滤违禁词
                            let banned_words=['semen','nsfw','topless','breasts','breast','nipples','nipple','naked','nude','footjob','fellatio','penis','handjob','blowjob','cum','ejaculation','dick','sex','missionary']
                            if(groups_power.includes(message.group_id)){
                                banned_words=['dick','penis','cock','prick','pecker','willy']
                            }
                            let isBanned=false;
                            for(let word of banned_words){
                                if(prompt.toLowerCase().includes(word)){
                                    // await send_private_msg(393360027,'不许瑟瑟！')
                                    isBanned=true
                                    await send_group_msg(message.group_id,'text','不许瑟瑟！')
                                    isNai3RequestInProgress=false
                                }
                            }
                            if(isBanned){
                                continue;    
                            }
                            // 图片生成与保存
                            let file_name=await save_img(prompt,type)
                            const file_path = path.join(__dirname, 'output', file_name);
                            console.log('图片已保存，图片名:',file_path)
                            await send_group_msg(message.group_id,'image',file_path)
                            isNai3RequestInProgress=false
                        }
                        catch(err){
                            console.log('nai3画图失败',err)
                            await send_group_msg(message.group_id,'text','nai3画图失败')
                        }
                    }
                }
                else{
                    if(nai3_queue.length<6){
                        nai3_queue.push(message)
                        await send_group_msg(message.group_id,'text','nai3请求已加入队列,前方请求数:'+nai3_queue.length)
                        console.log('nai3请求已加入队列,前方请求数:',nai3_queue.length)
                    }
                    else{
                        await send_group_msg(message.group_id,'text','nai3请求队列已满,请稍后再试')
                        console.log('nai3请求队列已满,请稍后再试')
                    }
                }
            }
            else if(instruction.startsWith('天气')){
                try{
                    console.log("收到天气查询指令");
                    const cityName= instruction.slice(3);
                    const weather=await get_weather(cityName);
                    console.log(weather);
                    const {main:{temp,feels_like,temp_min,temp_max,humidity},visibility,wind,rain}=weather
                    const weatherInfo = `城市: '${cityName}',\n天气状况: '${weather.weather[0].description}',\n温度: '${temp}°C',\n体感温度: '${feels_like}°C',\n温度范围: '${temp_min}°C -${temp_max}°C',\n湿度: '${humidity}%',\n能见度: '${visibility}米',\n风速: '${wind.speed}米/秒',\n风向: '${wind.deg}°',\n风速极大值: '${wind.gust}米/秒''
                    `;
                    await send_private_msg(393360027,weatherInfo);
                    await send_group_msg(message.group_id,'text',weatherInfo)
                    res.send("天气查询成功");
                }
                catch(err){
                    console.log('天气查询失败',err)
                    await send_group_msg(message.group_id,'text','天气查询失败，请稍后再试')
                }
            }
            else if(instruction==='今日美图'){
                // await send_private_msg(393360027,'今日美图正在下载中，请稍后');
                await send_group_msg(message.group_id,'text','今日美图正在下载中，请稍后');
                let images = fs.readdirSync(path.join(__dirname, 'img'));
                if(images.length<=7){
                    await downloadImages();
                }
                images = fs.readdirSync(path.join(__dirname, 'img'));
                for (const img of images) {
                    const imgPath = path.join(__dirname, 'img', img);
                    // await send_private_msg_with_image(393360027,imgPath);
                    await send_group_msg(message.group_id,'image',imgPath);
                }
                console.log("今日美图发送成功");
            }
            else if(instruction.startsWith('随机')){
                try{
                    send_group_msg(message.group_id,'text','猫猫偷图中。。。');
                    console.log("收到随机指令");
                    const args=instruction.split(' ');
                    if(args[2]==='色'){
                        if(groups_power.includes(message.group_id)){
                            const type=args[1];
                            const url=await get_random_pic(type,true);
                            await send_group_msg(message.group_id,'image',url);
                            return;
                        }
                        else{
                            await send_group_msg(message.group_id,'text','不准瑟瑟!');
                            return;
                        }
                    }
                    if (args.length>3){
                        await send_group_msg(message.group_id,'text','指令格式错误，请重新输入');
                    }
                    else{
                        const type=args[1];
                        const url=await get_random_pic(type);
                        await send_group_msg(message.group_id,'image',url);
                    }
                }
                catch(err){
                    console.log('随机图片查询失败',err)
                    await send_group_msg(message.group_id,'text','随机偷图失败，分类不存在')
                }


            }
            else if(instruction==='help'){
                await send_group_msg(message.group_id,'text',`你好啊！我是猫猫，可以直接艾特我和我对话哦ovo。目前支持以下功能:\n1.直接和我对话 \n2.输入：画图 中文的图片描述 可以生成图片\n3.输入nai3 英文prompt 方图(或者横图，竖图，或者不填)可以生成nai3的美少女图片\n4.输入“今日美图”，即可获取pixiv今日排行榜的美图。\n5.输入随机+图片类型(原神，碧蓝档案，崩坏，碧蓝航线，明日方舟) 来随机生成图片\n6.输入查战绩 角色id 数字(数字1表示最近的1把)查询300英雄战绩`);
            }
            else{
                try{
                    console.log("收到消息")
                    const result = await call_qwen(instruction);
                    console.log("收到llm答案:"+result);
                    await send_group_msg(message.group_id,'text',result)
                    await send_private_msg(393360027,result);
                    res.send("发送消息成功");
                }
                catch (e){
                    console.log(e)
                    await send_group_msg(message.group_id,'text','发送消息失败，请稍后再试')
                }
            }
        }
    }
})
app.get('/add_group', async (req, res) => {
    if (req.query.group_id) {
        const groupId = Number(req.query.group_id);
        console.log('添加了', groupId);
        // 直接将groupId添加到Redis列表中
        await redis.rpush('groups', groupId);
        //添加到内存中
        groups.add(groupId);
        console.log("成功添加到redis");
    }
    res.send("添加成功");
});
app.get('/add_group_power', async (req, res) => {
    if (req.query.group_id) {
        await redis.rpush('groups_power', req.query.group_id);
        //添加到内存中
        groups_power.add(Number(req.query.group_id));
        console.log("成功添加了强力群组");
    }
    res.send("添加成功");
});
app.get('/del_group', async (req, res) => {
    if (req.query.group_id) {
      try {
        await redis.lrem('groups', 0, req.query.group_id);
        //删除内存中对应的group_id的group
        groups.delete(Number(req.query.group_id));
        console.log('删除了group:', req.query.group_id);
        res.send("删除成功");
      } catch (e) {
        console.log(e);
        res.status(500).send("删除失败");
      }
    }
});
app.get('/del_group_power', async (req, res) => {
    if (req.query.group_id) {
        try {
          await redis.lrem('groups_power', 0, req.query.group_id);
          //删除内存中对应的group_id的group
          groups_power.delete(Number(req.query.group_id));
          console.log('删除了groups_power:', req.query.group_id);
          res.send("删除成功");
        } catch (e) {
          console.log(e);
          res.status(500).send("删除失败");
        }
    }
  });
app.get('/get_groups', async (req, res) => {
    try {
        const groupList = await new Promise((resolve, reject) => {
            redis.lrange('groups', 0, -1, (err, values) => {
                if (err) return reject(err);
                resolve(values);
            });
        });
        res.send(groupList);
        console.log('成功获取群组并发送')
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups from Redis' });
    }
})
app.get('/get_groups_power', async (req, res) => {
    try {
        const groups_power = await new Promise((resolve, reject) => {
            redis.lrange('groups_power', 0, -1, (err, values) => {
                if (err) return reject(err);
                resolve(values);
            });
        });
        res.send(groups_power);
        console.log('成功获取强力群组并发送')
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups from Redis' });
    }
})

app.post('/nai3', async (req, res) => {
    const {prompt,type}= req.body;
    let file_name=await save_img(prompt,type)
    // const file_path = path.join(__dirname, 'output', file_name);
    console.log('图片已保存，图片名:',file_name)
    res.send("图片已生成,图片名",file_name);
})


// 调用kimi
async function call_kimi(message) {
    history.push({
        role: "user", content: message
    })
    const completion = await client.chat.completions.create({
        model: "moonshot-v1-8k",         
        messages: history,
        temperature: 0.5
    });
    history = history.concat(completion.choices[0].message)
    if(history.length>12){
        history.splice(2,2)
    }
    console.log("history")
    console.log(history)
    console.log(history.length)
    return completion.choices[0].message.content;
}

async function call_qwen(message){
    history.push({
        role: "user", content: message
    })
    try {
        const res=await fetch(`http://localhost:8000/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': headers
            },
            body: JSON.stringify({
                "model": "qwen",
                "messages": history,
                "stream": false
            })
        });
        const completion = await res.json();
        history = history.concat(completion.choices[0].message)
        if(history.length>12){
            history.splice(2,2)
        }
        console.log("history")
        console.log(history)
        console.log(history.length)
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// module.exports = router;