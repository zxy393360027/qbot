<script setup>
const base_url='http://localhost:8080'
import {
  Check,
  Delete,
  Edit,
  Message,
  Search,
  Star,
} from '@element-plus/icons-vue'
import { onMounted } from 'vue';
import { ref } from 'vue'
const input = ref('')
// const groups=ref([{'id':1,'number':123456,'random':true,'nai3':true},{'id':2,'number':654321,'random':false,'nai3':true},{'id':3,'number':451316,'random':false,'nai3':false}])
const get_groups=async()=>{
  const res=await fetch(base_url+'/get_groups',{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors'})
  const output=await res.json()
  console.log('成功获取群组:',output)
  return output
}
const get_groups_power=async()=>{
  const res=await fetch(base_url+'/get_groups_power',{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors'})
  const output=await res.json()
  console.log('成功获取强力群组:',output)
  return output
}
const add_group=async (input)=>{
  groups.value.push({'id':groups.value.length+1,'number':input,'R18':false})
  // 向后端的/add_group发送get请求，携带参数group_id
  const res=await fetch(base_url+'/add_group?'+'group_id='+input)
  const output=await res.json()
  console.log('成功添加群组:',output)
}
const add_group_power=async (input)=>{
  await fetch(base_url+'/add_group_power?'+'group_id='+input)
  console.log('成功添加强力群组')
}
const tonggle_R18=async(number)=>{
  const index = groups.value.findIndex(group => group.number === number);
  if(groups.value[index].R18){
      await del_group_power(number);
  }
  else{
      await add_group_power(number);
  }
  groups.value[index].R18=!groups.value[index].R18;
}
const del_card=async(group_id)=>{
  console.log('准备删除卡片')
  const index=groups.value.findIndex(group=>group.number===group_id);
  groups.value.splice(index, 1);
  try {
    await del_group(group_id);
    console.log('成功删除group');
  } 
  catch (error) {
    console.error('Error in del_group:', error);
  }
  try{
    await del_group_power(group_id);
    console.log("成功删除group_power")
  }
  catch(e){
    console.error('error in del_group_power',e);
  }
}
const del_group=async(group_id)=>{
  await fetch(base_url+'/del_group?'+'group_id='+group_id)
  console.log('成功删除群组')
}
const del_group_power=async(group_id)=>{
  await fetch(base_url+'/del_group_power?'+'group_id='+group_id)
  console.log('成功删除强力群组')
}
const groups=ref([]);
onMounted(async()=>{
  const group_list=await get_groups();
  const power_list=await get_groups_power();
  for(let item of group_list){
    const R18=power_list.includes(item)?true:false;
    groups.value.push({'id':0,'number':item,'R18':R18});
  }
})
</script>

<template>
  <div>
    <div class="top_bar">
      
      <el-card class="item" 
        v-for="group in groups" 
        :key="group.id" 
        style="max-width: 480px; margin-bottom: 20px;" >
        <template #header>
          <div class="card-header">
            <span>群号：{{ group.number }}</span>
          </div>
        </template>
        <!-- 这里可以根据需要替换为实际的列表内容 -->
        <div class="content">
          <span>R18</span>
          <el-button 
            :type="group.R18 ? 'success' : 'info'" 
            :icon="group.R18 ? Check : Delete" 
            circle
            @click="tonggle_R18(group.number)"
          />
        </div>

        <template #footer>
          <div class="footer">
            <el-button type="danger" round class="button" @click="del_card(group.number)">删除</el-button>
          </div>
        </template>
      </el-card>
    </div>
    <div class="down_bar">
      <el-input v-model="input" style="width: 240px" placeholder="Please input" />
      <el-button type="primary" round class="button" @click="add_group(input)">添加</el-button>
     </div>
  </div>

</template>





<style scoped>
.top_bar {
  display: flex;
  flex-direction: row; /* 保持水平排列 */
  flex-wrap: wrap; /* 允许换行 */
  /* align-items: center; */
  /* justify-content: center; */
  width: 75vw; /* 控制宽度为屏幕宽度的75% */
  margin: 0 auto; /* 水平居中 */
  gap: 20px; /* 设置卡片之间的间隔 */
  background-image: linear-gradient(to right, #cfd9df, #e2e9f0);
  margin-bottom: 10px;
}
.item{
  margin: 10px;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  margin-left: 20px;
}
.item:hover{
  transform: scale(1.1);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}
.down_bar{
  display: flex;
  flex-direction: row;
  align-items: center;
}
.button{
  margin-left: 20px;
}
.content{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  margin-bottom: 10px;
}
.footer{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
