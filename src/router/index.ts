import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/home/index.vue'
import Editor from '@/views/Editor/index.vue'
import Screen from '@/views/Screen/index.vue'
import Mobile from '@/views/Mobile/index.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },
  { path: '/editor', name: 'Editor', component: Editor },
  // { path: '/screen', name: 'Screen', component: Screen },
  { path: '/mobile', name: 'Mobile', component: Mobile },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // history: createWebHistory(import.meta.env.BASE_URL),   //原来使用的是这个配置，因为edit模式刷新总是跳转到首页，修改为createWebHistory('/')
  
  routes,
})

export default router