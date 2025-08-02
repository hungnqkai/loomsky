import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth';
import AuthLayout from '../layouts/AuthLayout.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import SettingsLayout from '../layouts/SettingsLayout.vue'

// Định nghĩa các route chính
const routes = [
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
      // ... các route auth khác
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
      {
        path: 'accept-invitation',
        name: 'accept-invitation',
        component: () => import('../views/auth/AcceptInvitationView.vue'),
      },
    ],
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/dashboard/DashboardHomeView.vue') },
      { path: 'profile', name: 'dashboard-profile', component: () => import('../views/dashboard/ProfileView.vue') },
      
      // BƯỚC 2: Tạo route "cha" cho khu vực cài đặt
      {
        path: 'settings',
        component: SettingsLayout, // Sử dụng layout mới
        redirect: '/dashboard/settings/profile', // Mặc định chuyển đến trang profile
        children: [
          {
            path: 'profile',
            name: 'settings-profile',
            component: () => import('../views/settings/CompanyProfileView.vue'),
          },
          {
            path: 'team',
            name: 'settings-team',
            component: () => import('../views/settings/TeamSettingsView.vue'),
          },
          {
            path: 'billing',
            name: 'settings-billing',
            component: () => import('../views/settings/BillingSettingsView.vue'),
          },
        ]
      },
      // === ĐÃ XÓA STYLE GUIDE RA KHỎI ĐÂY ===
    ]
  },
];

// === THÊM ROUTE STYLE GUIDE CHO MÔI TRƯỜNG DEV ===
// Vite cung cấp biến import.meta.env.DEV để kiểm tra
if (import.meta.env.DEV) {
  routes.push({
    path: '/style-guide', // Giờ đây đường dẫn là /style-guide
    name: 'style-guide',
    component: () => import('../views/internal/StyleGuideView.vue'),
    // Không cần layout phức tạp, chỉ cần component là đủ
  });
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // Sử dụng mảng routes đã được cập nhật
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
