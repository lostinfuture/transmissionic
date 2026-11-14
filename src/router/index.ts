import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import List from '../views/List.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:pathMatch(.*)*',
    component: List
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
}) 

export default router
