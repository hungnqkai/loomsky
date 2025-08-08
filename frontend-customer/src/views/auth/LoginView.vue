<template>
  <div class="login-page">
    <!-- Floating Background Shapes -->
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>

    <div class="login-container">
      <div class="login-card">
        <!-- Header Section -->
        <div class="header-section">
          <div class="logo-container">
            <div class="logo">
              <v-icon size="32" color="white">mdi-cloud</v-icon>
            </div>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="alert alert-error">
          <v-icon size="18">mdi-alert-circle-outline</v-icon>
          <span>{{ authStore.error }}</span>
        </div>

        <!-- Login Form -->
        <v-form @submit.prevent="onLogin" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email address</label>
            <div class="input-container">
              <input 
                v-model="email"
                type="email" 
                id="email" 
                class="form-input"
                placeholder="your.email@company.com"
                required
                :disabled="authStore.loading"
              />
              <v-icon class="input-icon" size="20">mdi-email-outline</v-icon>
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <div class="input-container">
              <input 
                v-model="password"
                :type="visible ? 'text' : 'password'"
                id="password" 
                class="form-input"
                placeholder="Nhập mật khẩu của bạn"
                required
                :disabled="authStore.loading"
              />
              <v-icon class="input-icon" size="20">mdi-lock-outline</v-icon>
              <v-icon 
                class="input-icon input-icon-right" 
                size="20"
                @click="visible = !visible"
              >
                {{ visible ? 'mdi-eye-off' : 'mdi-eye' }}
              </v-icon>
            </div>
          </div>

          <div class="forgot-password">
            <router-link to="/auth/forgot-password" class="forgot-link">
              Forgot Password?
            </router-link>
          </div>

          <button 
            type="submit" 
            class="submit-button" 
            :disabled="authStore.loading"
          >
            <div v-if="authStore.loading" class="spinner"></div>
            <v-icon v-else-if="loginSuccess" class="success-icon" size="20">mdi-check-circle</v-icon>
            <span>{{ getButtonText() }}</span>
          </button>
        </v-form>

        <!-- Register Section -->
        <div class="register-section">
          <p class="register-text">
            Don't have an account?
            <router-link to="/auth/register" class="register-link">
              Create new account
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Khởi tạo store
const authStore = useAuthStore()

// State cho form
const visible = ref(false)
const email = ref('')
const password = ref('')
const loginSuccess = ref(false)

// Watch for successful login
watch(() => authStore.loading, (newValue, oldValue) => {
  if (oldValue && !newValue && !authStore.error) {
    loginSuccess.value = true
    setTimeout(() => {
      loginSuccess.value = false
    }, 2000)
  }
})

// Get button text based on state
const getButtonText = () => {
  if (authStore.loading) return 'Logging in...'
  if (loginSuccess.value) return 'Success!'
  return 'Log in'
}

// Hàm xử lý khi submit form
const onLogin = () => {
  if (email.value && password.value) {
    authStore.handleLogin({
      email: email.value,
      password: password.value,
    })
  }
}
</script>

<style scoped>
/* CSS Variables matching LoomSky Design System */
:root {
  --loomsky-primary: #0067b8;
  --loomsky-primary-light: #3b82f6;
  --loomsky-primary-dark: #1e3a8a;
  --loomsky-secondary: #EC4899;
  --loomsky-accent: #10B981;
  --loomsky-neutral-900: #111827;
  --loomsky-neutral-800: #1F2937;
  --loomsky-neutral-700: #374151;
  --loomsky-neutral-600: #4B5563;
  --loomsky-neutral-500: #6B7280;
  --loomsky-neutral-400: #9CA3AF;
  --loomsky-neutral-300: #D1D5DB;
  --loomsky-neutral-200: #E5E7EB;
  --loomsky-neutral-100: #e0e6eb;
  --loomsky-neutral-50: #F8FAFD;
  --loomsky-white: #FFFFFF;
  --loomsky-success: #10B981;
  --loomsky-error: #EF4444;
  --loomsky-text-title: #111c2d;
  --loomsky-text-body: #7b8893;
}

/* Main Page Layout */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 50px 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.login-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="1" fill="rgba(0,103,184,0.05)"/></pattern></defs><rect width="60" height="60" fill="url(%23grid)"/></svg>');
  pointer-events: none;
  z-index: 0;
}

/* Floating Background Shapes */
.floating-shape {
  position: fixed;
  pointer-events: none;
  z-index: 1;
}

.shape-1 {
  top: 10%;
  right: 10%;
  width: 120px;
  height: 120px;
  background: linear-gradient(45deg, var(--loomsky-primary), var(--loomsky-accent));
  border-radius: 16px;
  opacity: 0.08;
  animation: float 6s ease-in-out infinite;
  transform: rotate(15deg);
}

.shape-2 {
  bottom: 20%;
  left: 5%;
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, var(--loomsky-accent), var(--loomsky-secondary));
  border-radius: 50%;
  opacity: 0.06;
  animation: float 8s ease-in-out infinite reverse;
}

.shape-3 {
  top: 60%;
  right: 5%;
  width: 60px;
  height: 60px;
  background: var(--loomsky-primary);
  border-radius: 8px;
  opacity: 0.04;
  animation: float 10s ease-in-out infinite;
  transform: rotate(45deg);
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(var(--rotation, 0deg)); 
  }
  50% { 
    transform: translateY(-30px) rotate(var(--rotation, 0deg)); 
  }
}

/* Main Container */
.login-container {
  width: 100%;
  width: 500px;
  max-width: 620px;
  z-index: 10;
  position: relative;
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Glassmorphism Card Design */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 48px;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--loomsky-primary), var(--loomsky-accent));
  border-radius: 16px 16px 0 0;
}

/* Header Section */
.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  margin-bottom: 24px;
}

.logo {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, var(--loomsky-primary), var(--loomsky-primary-light));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 
    0 10px 25px rgba(0, 103, 184, 0.2),
    0 0 0 8px rgba(0, 103, 184, 0.1);
  position: relative;
}

.logo::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, var(--loomsky-primary), var(--loomsky-accent));
  border-radius: 12px;
  z-index: -1;
  opacity: 0.3;
  filter: blur(8px);
}

.brand-name {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--loomsky-text-title);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 1rem;
  color: var(--loomsky-text-body);
  margin-bottom: 8px;
}

/* Form Styles */
.login-form {
  width: 100%;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--loomsky-text-title);
  margin-bottom: 12px;
}

.input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 20px 16px 48px;
  border: 2px solid var(--loomsky-neutral-200);
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--loomsky-white);
  color: var(--loomsky-text-title);
}

.form-input:focus {
  outline: none;
  border-color: var(--loomsky-primary);
  background: var(--loomsky-white);
  box-shadow: 
    0 0 0 4px rgba(0, 103, 184, 0.1),
    0 4px 12px rgba(0, 103, 184, 0.15);
  transform: translateY(-1px);
}

.form-input::placeholder {
  color: var(--loomsky-neutral-400);
  font-weight: 400;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--loomsky-neutral-400);
  transition: color 0.3s ease;
}

.input-icon-right {
  left: auto;
  right: 16px;
  cursor: pointer;
}

.input-icon-right:hover {
  color: var(--loomsky-primary);
}

.form-input:focus ~ .input-icon {
  color: var(--loomsky-primary);
}

/* Forgot Password */
.forgot-password {
  text-align: right;
  margin-bottom: 32px;
}

.forgot-link {
  color: var(--loomsky-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
}

.forgot-link:hover {
  background: rgba(0, 103, 184, 0.1);
  color: var(--loomsky-primary-dark);
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 20px;
  background: var(--loomsky-primary);
  color: var(--loomsky-white);
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 56px;
  position: relative;
  overflow: hidden;
}

.submit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 15px 35px rgba(0, 103, 184, 0.3),
    0 5px 15px rgba(0, 0, 0, 0.1);
}

.submit-button:hover:not(:disabled)::before {
  left: 100%;
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: var(--loomsky-neutral-300);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-button:disabled::before {
  display: none;
}

/* Loading Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { 
    transform: rotate(360deg); 
  }
}

.success-icon {
  color: var(--loomsky-success);
}

/* Register Section */
.register-section {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--loomsky-neutral-100);
}

.register-text {
  font-size: 0.875rem;
  color: var(--loomsky-text-body);
}

.register-link {
  color: var(--loomsky-primary);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
}

.register-link:hover {
  background: rgba(0, 103, 184, 0.1);
  color: var(--loomsky-primary-dark);
}

/* Alert Styles */
.alert {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease;
}

.alert-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  color: var(--loomsky-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .login-page {
    padding: 8px;
  }

  .login-card {
    padding: 32px;
  }

  .brand-name {
    font-size: 1.5rem;
  }

  .logo {
    width: 64px;
    height: 64px;
  }
}

/* Focus Styles for Accessibility */
.form-input:focus,
.submit-button:focus,
.forgot-link:focus,
.register-link:focus {
  outline: 2px solid var(--loomsky-primary);
  outline-offset: 2px;
}
</style>
