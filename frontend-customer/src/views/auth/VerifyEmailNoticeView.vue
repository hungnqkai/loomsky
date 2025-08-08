<template>
  <div class="verify-email-page">
    <!-- Floating Background Shapes -->
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>

    <div class="verify-email-container">
      <div class="verify-email-card">
        <!-- Header Section -->
        <div class="header-section">
          <div class="logo-container">
            <div class="logo">
              <v-icon size="32" color="white">mdi-cloud</v-icon>
            </div>
          </div>
          <h1 class="brand-name text-h5">Check your email</h1>
          <p class="brand-subtitle">We've sent you a verification link</p>
        </div>

        <!-- Main Content -->
        <div class="content-section">
          <!-- Large Email Icon -->
          <div class="email-icon-container">
            <div class="email-icon-wrapper">
              <v-icon size="64" color="primary">mdi-email-check</v-icon>
            </div>
          </div>

          <!-- Instructions -->
          <div class="instructions">
            <h3 class="instruction-title text-h6">We sent a verification link to your email</h3>
            <p class="instruction-text">
              Please check your inbox and click the verification link to activate your account. 
              Don't forget to check your spam folder if you don't see it in your inbox.
            </p>
          </div>

          <!-- Additional Actions -->
          <div class="action-section">
            <p class="action-text">Didn't receive the email?</p>
            <div class="action-buttons">
              <button class="resend-button" @click="resendEmail" :disabled="resendCooldown > 0">
                <v-icon size="18">mdi-refresh</v-icon>
                <span v-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
                <span v-else>Resend verification email</span>
              </button>
            </div>
          </div>
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
import { ref, onUnmounted } from 'vue';

// Resend email functionality (optional enhancement)
const resendCooldown = ref(0);
let cooldownTimer = null;

const resendEmail = () => {
  // Start cooldown
  resendCooldown.value = 60; // 60 seconds cooldown
  
  // Start countdown
  cooldownTimer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownTimer);
    }
  }, 1000);
  
  // Here you could integrate with actual resend API
  console.log('Resend verification email requested');
};

// Cleanup timer on unmount
onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }
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
.verify-email-page {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 50px 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.verify-email-page::before {
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
.verify-email-container {
  width: 100%;
  max-width: 520px;
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
.verify-email-card {
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

.verify-email-card::before {
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

/* Content Section */
.content-section {
  text-align: center;
  margin-bottom: 32px;
}

.email-icon-container {
  margin-bottom: 32px;
}

.email-icon-wrapper {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, rgba(0, 103, 184, 0.1), rgba(16, 185, 129, 0.1));
  border: 2px solid rgba(0, 103, 184, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
  animation: pulse 2s infinite;
}

.email-icon-wrapper::before {
  content: '';
  position: absolute;
  inset: -8px;
  background: linear-gradient(135deg, var(--loomsky-primary), var(--loomsky-accent));
  border-radius: 50%;
  z-index: -1;
  opacity: 0.1;
  filter: blur(8px);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 103, 184, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(0, 103, 184, 0);
  }
}

/* Instructions */
.instructions {
  margin-bottom: 32px;
}

.instruction-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--loomsky-text-title);
  margin-bottom: 16px;
  line-height: 1.4;
}

.instruction-text {
  font-size: 1rem;
  color: var(--loomsky-text-body);
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
}

/* Action Section */
.action-section {
  margin-bottom: 24px;
}

.action-text {
  font-size: 0.875rem;
  color: var(--loomsky-neutral-500);
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.resend-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(0, 103, 184, 0.1), rgba(0, 103, 184, 0.05));
  color: var(--loomsky-primary);
  border: 1px solid rgba(0, 103, 184, 0.2);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.resend-button:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 103, 184, 0.15), rgba(0, 103, 184, 0.08));
  border-color: rgba(0, 103, 184, 0.3);
  transform: translateY(-1px);
}

.resend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
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
  .verify-email-page {
    padding: 8px;
  }

  .verify-email-card {
    padding: 32px;
  }

  .brand-name {
    font-size: 1.5rem;
  }

  .logo {
    width: 64px;
    height: 64px;
  }

  .email-icon-wrapper {
    width: 100px;
    height: 100px;
  }

  .instruction-title {
    font-size: 1.125rem;
  }
}

/* Focus Styles for Accessibility */
.resend-button:focus,
.back-link:focus {
  outline: 2px solid var(--loomsky-primary);
  outline-offset: 2px;
}
</style>
