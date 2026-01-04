import { createRouter, createWebHistory } from 'vue-router'
import MapDemo from '@/views/MapDemo.vue'

const routes = [
    {
        path: '/',
        name: 'MapDemo',
        component: MapDemo
    },
    // 重定向到地图页面
    {
        path: '/map',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router