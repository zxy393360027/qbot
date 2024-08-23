const redis = require('redis');
const client = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// 连接事件监听
client.on('connect', () => {
  console.log('Connected to Redis server');
});

// 设置键值对
client.set('myKey', 'Hello Redis!', redis.print);

// 获取键值
client.get('myKey', (err, reply) => {
  if (err) throw err;
  console.log('Value:', reply);
});

groups=[713686061,755594862,953506778,928917063,511710870,1018450371,472917044,760350654,786825478,992683774]
groups_power=[713686061,760350654,786825478,992683774]
groups.forEach((group) => {
    client.rpush('groups', group, redis.print);
});
groups_power.forEach((group) => {
    client.rpush('groups_power', group, redis.print);
}); 

client.lrange('groups', 0, -1, (err, reply) => {
    if (err) throw err;
    console.log('Groups:', reply);
});
// 关闭 Redis 连接
client.quit();