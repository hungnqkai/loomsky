import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth';
import AuthLayout from '../layouts/AuthLayout.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/auth/LoginView.vue'),
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('../views/auth/RegisterView.vue'),
        },
        {
          path: 'verify-email',
          name: 'verifyemail',
          component: () => import('../views/auth/VerifyEmailView.vue'),
        },
        {
          path: 'verify-email-notice',
          name: 'verify-email-notice',
          component: () => import('../views/auth/VerifyEmailNoticeView.vue'),
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('../views/auth/ForgotPasswordView.vue'),
        },
      ],
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true }, // Đánh dấu route này cần xác thực
      children: [
        {
          path: '', // Đường dẫn /dashboard
          name: 'dashboard',
          component: () => import('../views/dashboard/DashboardHomeView.vue'),
        },
        {
          path: 'profile',
          name: 'dashboard-profile',
          component: () => import('../views/dashboard/ProfileView.vue'),
        },
        {
          path: 'billing',
          name: 'dashboard-billing',
          component: () => import('../views/dashboard/BillingView.vue'),
        },
        {
          path: 'team', // Đường dẫn /dashboard/team
          name: 'dashboard-team',
          component: () => import('../views/dashboard/TeamView.vue'),
        },
        {
          path: 'settings', // Đường dẫn /dashboard/settings
          name: 'dashboard-settings',
          component: () => import('../views/dashboard/SettingsView.vue'),
        },
      ]
    },
  ],
})

// Navigation Guard - "Vệ sĩ" của các route
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    // Nếu route yêu cầu đăng nhập và người dùng CHƯA đăng nhập
    // thì chuyển hướng họ về trang login.
    next({ name: 'login' });
  } else {
    // Ngược lại, cho phép họ đi tiếp.
    next();
  }
});

export default router
