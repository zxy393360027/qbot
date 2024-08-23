// api.js
const baseUrl = "http://localhost:3000/";
const path= require('path');
const makeRequest = async (method, url, data = null, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { ...defaultHeaders, ...options.headers },
            body: data ? JSON.stringify(data) : null,
            ...options
        });

        const json = await response.json();
        console.log('Success:', json);
        return json;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const send_private_msg = async (user_id, data = null) => {
    try {
        await fetch(`${baseUrl}send_private_msg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id,
                message: [{
                    type: 'text',
                    data: {
                        text: data
                    }
                }]
            })
        });
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const send_private_msg_with_image = async (user_id, image_path_or_url) => {
    try {
        await fetch(`${baseUrl}send_private_msg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id,
                message: [{
                    type: 'image',
                    data: {
                        file: image_path_or_url
                    }
                }]
            })
        });
        console.log('Image sent successfully');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};


const generate_image = async function(prompt){
    try {
        const response = await fetch(`http://localhost:8000/v1/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer Esf0KbHIYB7GreoU*tntMAHELF6sFvJ_v67hXrUuyUugNdkfAxEuB6c_OHVx7phv0 ',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "model": "wanxiang",
                "prompt": prompt
            })
        });
        const data = await response.json();
        const url=data.data[0].url;
        // console.log(data)
        console.log('Image generated successfully');
        return url; // 假设数据中的 URL 字段名为 url
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const send_group_msg = async (group_id,type, data = null) => { 
    try {
        var message_body;
        if (type==="text"){
            message_body={
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    group_id,
                    message: [{
                        type: 'text',
                        data: {
                            text: data
                        }
                    }]
                })
            }
        }
        else{
            console.log(data)
            message_body={
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    group_id,
                    message: [{
                        type: 'image',
                        data: {
                            file:data
                            // file:path.join(__dirname, 'output', '686b4913-7c24-432b-bf3f-dd28b2454d39.png')
                        }
                    }]
                })
            }
            console.log('准备发送图片')
        }
        const res = await fetch(`${baseUrl}send_group_msg`, message_body);
        const result = await res.json(); // 解析JSON响应
        console.log('Success:', result);
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
 };

//  天气预报
 const apiKey = '76352a6cee509db3ff6c3f823dbec1dd'; // 使用你的API Key
 async function get_weather(cityName) {
   try {
     const response = await fetch(
       `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
     );
     const data = await response.json();
     return data
   } catch (err) {
     console.log(err);
   }
 }

module.exports = {
    makeRequest,
    send_private_msg,
    send_private_msg_with_image,
    generate_image,
    send_group_msg,
    get_weather
};
// const res=generate_image("一只可爱的猫");
// console.log(res);