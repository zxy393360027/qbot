// const encodedRoleName = "%E8%90%9D%E5%8D%9C%EF%BC%88python%EF%BC%89";
// const decodedRoleName = decodeURIComponent(encodedRoleName);
// const roleName = "萝卜（python）";
// const encodedRoleName2 = encodeURIComponent(roleName);

// console.log(encodedRoleName2); // 输出: %E8%90%9D%E5%8D%93%EF%BC%88python%EF%BC%89
// console.log(decodedRoleName); // 输出: 萝卜（python）
async function get_300_info(roleName,index){
    if(index>6){
        return "只能查询最近五把的数据"
    }
    const encodedRoleName = encodeURIComponent(roleName);
    const res=await fetch('https://300report.jumpw.com/api/battle/searchNormal?type=h5', { //请求角色id
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://300report.jumpw.com',
            'Referer': 'https://300report.jumpw.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Priority': 'u=0'
        },
        body: `AccountID=0&Guid=0&RoleName=${encodedRoleName}`
    })
    const data= await res.json()
    if(!data.data){
        return '账号不存在'
    }
    const role_id=data.data.RoleID
    console.log("role_id:",role_id)
    const res2= await fetch(`https://300report.jumpw.com/api/battle/searchMatchs?type=h5`,{  //这里是请求具体是哪一把的战绩的id
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://300report.jumpw.com',
            'Referer': 'https://300report.jumpw.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Priority': 'u=0'
        },
        body: 'RoleID='+role_id+'&MatchType=1&searchIndex=1'
    })
    const data2=await res2.json()
    if(!data2.data){
        return '没有查到战绩哦'
    }
    console.log("data2:",data2.data.Matchs)
    const res3= await fetch(`https://300report.jumpw.com/api/battle/searchMatchinfo?type=h5`,{  //这里是请求具体的战绩
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://300report.jumpw.com',
            'Referer': 'https://300report.jumpw.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Priority': 'u=0'
        },
        body: 'mtid='+data2.data.Matchs.Matchs[index-1].MTID
    })
    const data3=await res3.json()
    // console.log("data3:",data3.data)

    const createTime=data3.data.CreateTime //格式化对局时间
    const utcDate = new Date(createTime * 1000); // 乘以 1000 是因为 Date 对象期望毫秒
    // 假设我们需要增加 8 小时来获得正确的本地时间
    const localDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000)); // 8小时的毫秒数
    // 获取本地日期时间
    const formattedDate = localDate.toISOString().substring(0, 19).replace('T', ' ');

    let uitem;
    let TotalKill=[0,0]
    for (let item of data3.data.Players){ //找到自己
        if(item.PlayerID===role_id){uitem=item}
        TotalKill[item.Side-1]+=item.KillPlayer //计算总击杀数用于得到参团率
    }
    let item=uitem
    // console.log(item)
    console.log("TotalKill:",TotalKill)
    // user_info=`
    //     玩家:${roleName}  竞技力:${item.FV}  英雄:${item.HeroID===156?"red":item.HeroID}  ${item.Side===item.Result?"胜利":"失败"}  时长:${(data2.data.Matchs.Matchs[0].UsedTime/60).toFixed(0)}分钟 
    //     战绩:${item.KillPlayer}/${item.Death}/${item.Assist}  k兵:${item.KillUnit} 经济:${item.TotalMoney} 参团率:${((item.KillPlayer+item.Assist)/TotalKill[item.Side-1]*100).toFixed(0)}%
    //     输出:${item.MD[item.MD.length-1]} 输出占比:${(item.MakeDamagePercent*100).toFixed(1)}% 承伤:${item.TD[item.TD.length-1]} 承伤占比:${(item.TakeDamagePercent * 100).toFixed(1)}% 
    //     推塔:${item.DestoryTower} 插眼:${item.PutEyes} 怯战蜥蜴:${item.IsSurrender===0?"否":"是"} 日期:${formattedDate} 
    // `
    user_info=`+-----------------+-----------------+-----------------+-----------------+
    |  ${roleName} |  竞技力: ${item.FV} |  英雄: ${item.HeroID === 156 ? "red" : item.HeroID} |  ${(item.Side === item.Result&&item.Side===1)||(item.Side !== item.Result&&item.Side===2) ? "胜利" : "失败"} |
    +-----------------+-----------------+-----------------+-----------------+
    | 战绩: ${item.KillPlayer}/${item.Death}/${item.Assist} | K兵: ${item.KillUnit} | 经济: ${item.TotalMoney} | 怯战蜥蜴: ${item.IsSurrender === 0 ? "否" : "是"} |
    +-----------------+-----------------+-----------------+-----------------+
    | 参团率: ${((item.KillPlayer + item.Assist) / TotalKill[item.Side - 1] * 100).toFixed(0)}% | 输出: ${item.MD[item.MD.length - 1]} | 输出占比: ${(item.MakeDamagePercent * 100).toFixed(1)}% | 承伤: ${item.TD[item.TD.length - 1]} |
    +-----------------+-----------------+-----------------+-----------------+
    | 日期: ${formattedDate}  | 推塔: ${item.DestoryTower} | 插眼: ${item.PutEyes} | 时长: ${Math.floor(data2.data.Matchs.Matchs[0].UsedTime / 60)}分钟 | 
    +-----------------+-----------------+-----------------+-----------------+`
    return user_info
}


// (async () => {
//     try {
//         const result = await get_300_info("美咲璃＇",1);
//         console.log('Received data:', result);
//     } catch (error) {
//         console.error('Failed to get data:', error);
//     }
// })();

module.exports = { 
    get_300_info 
};