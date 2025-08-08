<template>
  <div class="forgot-password-page">
    <!-- Floating Background Shapes -->
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>

    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <!-- Header Section -->
        <div class="header-section">
          <div class="logo-container">
            <div class="logo">
              <v-icon size="32" color="white">mdi-cloud</v-icon>
            </div>
          </div>
          <h1 class="brand-name">Reset your password</h1>
          <p class="brand-subtitle">Enter your email address and we'll send you a link to reset your password</p>
        </div>

        <!-- Success Alert -->
        <div v-if="authStore.successMessage" class="alert alert-success">
          <v-icon size="18">mdi-check-circle-outline</v-icon>
          <span>{{ authStore.successMessage }}</span>
        </div>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="alert alert-error">
          <v-icon size="18">mdi-alert-circle-outline</v-icon>
          <span>{{ authStore.error }}</span>
        </div>

        <!-- Forgot Password Form -->
        <v-form @submit.prevent="onRequest" class="forgot-password-form" v-if="!authStore.successMessage">
          <div class="form-group">
            <label for="email" class="form-label">Email address</label>
            <div class="input-container">
              <input 
                v-model="email"
                type="email" 
                id="email" 
                class="form-input"
                :class="getInputClass()"
                placeholder="your.email@company.com"
                required
                :disabled="authStore.loading"
                @input="validateEmail"
                @blur="validateEmail"
              />
              <v-icon class="input-icon" size="20">mdi-email-outline</v-icon>
            </div>
            <div v-if="emailError" class="error-message">
              <v-icon size="12">mdi-alert-circle</v-icon>
              <span>{{ emailError }}</span>
            </div>
            <div v-if="emailValid" class="success-message">
              <v-icon size="12">mdi-check-circle</v-icon>
              <span>Valid email address</span>
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-button" 
            :disabled="!emailValid || authStore.loading"
          >
            <div v-if="authStore.loading" class="spinner"></div>
            <v-icon v-else-if="resetSuccess" class="success-icon" size="20">mdi-check-circle</v-icon>
            <span>{{ getButtonText() }}</span>
          </button>
        </v-form>

        <!-- Success State -->
        <div v-if="authStore.successMessage" class="success-state">
          <div class="success-icon-large">
            <v-icon size="48" color="success">mdi-email-check</v-icon>
          </div>
          <h3 class="success-title">Check your email</h3>
          <p class="success-description">
            We sent a password reset link to <strong>{{ email }}</strong>
          </p>
          <p class="success-note">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
        </div>

        <!-- Back to Login -->
        <div class="back-section">
          <router-link to="/auth/login" class="back-link">
            <v-icon size="18">mdi-arrow-left</v-icon>
            <span>Back to login</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Form state
const email = ref('');
const emailError = ref('');
const emailValid = ref(false);
const resetSuccess = ref(false);

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = () => {
  emailError.value = '';
  emailValid.value = false;
  
  if (!email.value.trim()) {
    emailError.value = 'Email address is required';
    return false;
  }
  
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  
  emailValid.value = true;
  return true;
};

// Input styling helper
const getInputClass = () => {
  if (emailError.value) return 'error';
  if (emailValid.value) return 'success';
  return '';
};

// Watch for successful reset request
watch(() => authStore.loading, (newValue, oldValue) => {
  if (oldValue && !newValue && !authStore.error && authStore.successMessage) {
    resetSuccess.value = true;
    setTimeout(() => {
      resetSuccess.value = false;
    }, 2000);
  }
});

// Button text
const getButtonText = () => {
  if (authStore.loading) return 'Sending reset link...';
  if (resetSuccess.value) return 'Email sent!';
  return 'Send reset link';
};

// Form submission
const onRequest = () => {
  if (validateEmail() && emailValid.value) {
    authStore.handleForgotPassword({ email: email.value });
  }
};

// Clear messages when component unmounts
onUnmounted(() => {
  authStore.clearMessages();
});
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
.forgot-password-page {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  margin: 50px 0;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.forgot-password-page::before {
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
.forgot-password-container {
  width: 100%;
  max-width: 480px;
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
.forgot-password-card {
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

.forgot-password-card::before {
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
  line-height: 1.5;
  margin-bottom: 8px;
}

/* Form Styles */
.forgot-password-form {
  width: 100%;
  margin-bottom: 32px;
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

.form-input.error {
  border-color: var(--loomsky-error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input.success {
  border-color: var(--loomsky-success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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

.form-input:focus ~ .input-icon {
  color: var(--loomsky-primary);
}

.form-input.success ~ .input-icon {
  color: var(--loomsky-success);
}

.form-input.error ~ .input-icon {
  color: var(--loomsky-error);
}

/* Validation Messages */
.error-message {
  font-size: 0.75rem;
  color: var(--loomsky-error);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.success-message {
  font-size: 0.75rem;
  color: var(--loomsky-success);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, var(--loomsky-primary) 0%, var(--loomsky-primary-dark) 100%);
  color: var(--loomsky-white);
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
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
  opacity: 0.7;
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

.alert-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  color: var(--loomsky-success);
  border: 1px solid rgba(16, 185, 129, 0.2);
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

/* Success State */
.success-state {
  text-align: center;
  padding: 32px 0;
  animation: fadeIn 0.5s ease;
}

.success-icon-large {
  margin-bottom: 24px;
}

.success-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--loomsky-text-title);
  margin-bottom: 16px;
}

.success-description {
  font-size: 1rem;
  color: var(--loomsky-text-body);
  line-height: 1.5;
  margin-bottom: 16px;
}

.success-description strong {
  color: var(--loomsky-text-title);
  font-weight: 600;
}

.success-note {
  font-size: 0.875rem;
  color: var(--loomsky-neutral-500);
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Back to Login Section */
.back-section {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--loomsky-neutral-100);
}

.back-link {
  color: var(--loomsky-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-link:hover {
  background: rgba(0, 103, 184, 0.1);
  color: var(--loomsky-primary-dark);
}

/* Responsive Design */
@media (max-width: 640px) {
  .forgot-password-page {
    padding: 8px;
  }

  .forgot-password-card {
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
.back-link:focus {
  outline: 2px solid var(--loomsky-primary);
  outline-offset: 2px;
}
</style>
