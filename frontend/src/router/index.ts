import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/accounts'
        },
        {
          path: '/accounts',
          name: 'accounts',
          component: () => import('../views/Accounts.vue'),
        },
        {
          path: '/accounts/:id/content',
          name: 'account-content',
          component: () => import('../views/AccountContent.vue'),
        },
        {
          path: '/devices',
          name: 'devices',
          component: () => import('../views/Devices.vue'),
        },
        {
          path: '/personas',
          name: 'personas',
          component: () => import('../views/Personas.vue'),
        },
        {
          path: '/tasks',
          name: 'tasks',
          component: () => import('../views/Tasks.vue'),
        },
        {
          path: '/analytics',
          name: 'analytics',
          component: () => import('../views/Analytics.vue'),
        }
      ]
    }
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  console.log('路由守卫:', from.path, '->', to.path)
  
  // 简化认证逻辑，先让所有路由都通过
  console.log('路由守卫通过，允许访问:', to.path)
  next()
})

export default router