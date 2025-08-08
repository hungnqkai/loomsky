<template>
  <div class="register-page">
    <!-- Floating Background Shapes -->
    <div class="floating-shape shape-1"></div>
    <div class="floating-shape shape-2"></div>
    <div class="floating-shape shape-3"></div>

    <div class="register-container">
      <div class="register-card">
        <!-- Header Section -->
        <div class="header-section">
          <div class="logo-container">
            <div class="logo">
              <v-icon size="32" color="white">mdi-cloud</v-icon>
            </div>
          </div>
          <h1 class="brand-name">Create your free account</h1>
          <p class="brand-subtitle">100% free. No credit card needed.</p>
        </div>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="alert alert-error">
          <v-icon size="18">mdi-alert-circle-outline</v-icon>
          <span>{{ authStore.error }}</span>
        </div>

        <!-- Register Form -->
        <v-form @submit.prevent="onRegister" class="register-form">
          <!-- Name Fields Row -->
          <div class="form-row">
            <div class="form-group">
              <label for="first-name" class="form-label">First Name</label>
              <div class="input-container">
                <input 
                  v-model="formData.first_name"
                  type="text" 
                  id="first-name" 
                  class="form-input"
                  :class="getInputClass('firstName')"
                  placeholder="First Name"
                  required
                  :disabled="authStore.loading"
                  @input="validateField('firstName')"
                  @blur="validateField('firstName')"
                />
                <v-icon class="input-icon" size="20">mdi-account</v-icon>
              </div>
              <div v-if="validationErrors.firstName" class="error-message">
                <v-icon size="12">mdi-alert-circle</v-icon>
                <span>{{ validationErrors.firstName }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="last-name" class="form-label">Last Name</label>
              <div class="input-container">
                <input 
                  v-model="formData.last_name"
                  type="text" 
                  id="last-name" 
                  class="form-input"
                  :class="getInputClass('lastName')"
                  placeholder="Last Name"
                  required
                  :disabled="authStore.loading"
                  @input="validateField('lastName')"
                  @blur="validateField('lastName')"
                />
                <v-icon class="input-icon" size="20">mdi-account-outline</v-icon>
              </div>
              <div v-if="validationErrors.lastName" class="error-message">
                <v-icon size="12">mdi-alert-circle</v-icon>
                <span>{{ validationErrors.lastName }}</span>
              </div>
            </div>
          </div>

          <!-- Email Field -->
          <div class="form-group full-width">
            <label for="email" class="form-label">Email address</label>
            <div class="input-container">
              <input 
                v-model="formData.email"
                type="email" 
                id="email" 
                class="form-input"
                :class="getInputClass('email')"
                placeholder="your.email@company.com"
                required
                :disabled="authStore.loading"
                @input="validateField('email')"
                @blur="validateField('email')"
              />
              <v-icon class="input-icon" size="20">mdi-email-outline</v-icon>
            </div>
            <div v-if="validationErrors.email" class="error-message">
              <v-icon size="12">mdi-alert-circle</v-icon>
              <span>{{ validationErrors.email }}</span>
            </div>
            <div v-if="validationSuccess.email" class="success-message">
              <v-icon size="12">mdi-check-circle</v-icon>
              <span>Valid email</span>
            </div>
          </div>

          <!-- Company Name Field -->
          <div class="form-group full-width">
            <label for="company-name" class="form-label">Company / Organization Name</label>
            <div class="input-container">
              <input 
                v-model="formData.company_name"
                type="text" 
                id="company-name" 
                class="form-input"
                :class="getInputClass('companyName')"
                placeholder="Your company or organization name"
                required
                :disabled="authStore.loading"
                @input="validateField('companyName')"
                @blur="validateField('companyName')"
              />
              <v-icon class="input-icon" size="20">mdi-office-building</v-icon>
            </div>
            <div v-if="validationErrors.companyName" class="error-message">
              <v-icon size="12">mdi-alert-circle</v-icon>
              <span>{{ validationErrors.companyName }}</span>
            </div>
          </div>

          <!-- Password Fields Row -->
          <div class="form-row">
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <div class="input-container">
                <input 
                  v-model="formData.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  id="password" 
                  class="form-input"
                  :class="getInputClass('password')"
                  placeholder="Create Password"
                  required
                  :disabled="authStore.loading"
                  @input="validateField('password')"
                />
                <v-icon class="input-icon" size="20">mdi-lock-outline</v-icon>
                <v-icon 
                  class="input-icon input-icon-right" 
                  size="20"
                  @click="passwordVisible = !passwordVisible"
                >
                  {{ passwordVisible ? 'mdi-eye-off' : 'mdi-eye' }}
                </v-icon>
              </div>
              
              <!-- Password Strength Indicator -->
              <div v-if="formData.password" class="password-strength">
                <div class="strength-bar">
                  <div class="strength-fill" :class="passwordStrengthClass"></div>
                </div>
                <div class="strength-text" :class="passwordStrengthTextClass">
                  <v-icon size="12">{{ passwordStrengthIcon }}</v-icon>
                  <span>{{ passwordStrengthText }}</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="confirm-password" class="form-label">Confirm Password</label>
              <div class="input-container">
                <input 
                  v-model="formData.confirmPassword"
                  :type="confirmPasswordVisible ? 'text' : 'password'"
                  id="confirm-password" 
                  class="form-input"
                  :class="getInputClass('confirmPassword')"
                  placeholder="Re-enter password"
                  required
                  :disabled="authStore.loading"
                  @input="validateField('confirmPassword')"
                />
                <v-icon class="input-icon" size="20">mdi-lock-outline</v-icon>
                <v-icon 
                  class="input-icon input-icon-right" 
                  size="20"
                  @click="confirmPasswordVisible = !confirmPasswordVisible"
                >
                  {{ confirmPasswordVisible ? 'mdi-eye-off' : 'mdi-eye' }}
                </v-icon>
              </div>

              <!-- Password Match Indicator -->
              <div v-if="formData.confirmPassword" class="password-match">
                <div class="match-indicator" :class="passwordMatchClass">
                  <v-icon size="12">{{ passwordMatchIcon }}</v-icon>
                  <span>{{ passwordMatchText }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy Notice -->
          <div class="privacy-notice">
            <p class="privacy-text">
              By signing up for an account, you agree to LoomSky's <b>Privacy Policy, Terms of Use</b>, and other applicable policies.
              <br>
              We’re committed to your privacy. LoomSky uses the information you provide to contact you about relevant content, products, and services. You may unsubscribe from these communications at any time. For more details, please review our 
              <a href="#" @click.prevent>Privacy Policy</a>.
            </p>
          </div>



          <!-- Submit Button -->
          <button 
            type="submit" 
            class="submit-button" 
            :disabled="!isFormValid || authStore.loading"
          >
            <div v-if="authStore.loading" class="spinner"></div>
            <v-icon v-else-if="registerSuccess" class="success-icon" size="20">mdi-check-circle</v-icon>
            <span>{{ getButtonText() }}</span>
          </button>
        </v-form>

        <!-- Login Section -->
        <div class="login-section">
          <p class="login-text">
            Already have an account? 
            <router-link to="/auth/login" class="login-link">
              Sign in now
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Form state
const formData = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  company_name: '',
});

// UI state
const passwordVisible = ref(false);
const confirmPasswordVisible = ref(false);
const registerSuccess = ref(false);

// Validation state
const validationErrors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
});

const validationSuccess = reactive({
  firstName: false,
  lastName: false,
  email: false,
  password: false,
  confirmPassword: false,
  companyName: false,
});

// Watch for successful registration
watch(() => authStore.loading, (newValue, oldValue) => {
  if (oldValue && !newValue && !authStore.error) {
    registerSuccess.value = true;
    setTimeout(() => {
      registerSuccess.value = false;
    }, 2000);
  }
});

// Validation rules
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-ZÀ-ỹ\s'-]{1,50}$/;
const passwordRules = {
  minLength: 8,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasNumber: /\d/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
};

// Validation functions
const validateField = (field) => {
  // Clear previous validations
  validationErrors[field] = '';
  validationSuccess[field] = false;

  switch (field) {
    case 'firstName':
      if (!formData.first_name.trim()) {
        validationErrors.firstName = 'First name cannot be blank';
        return false;
      }
      if (!nameRegex.test(formData.first_name)) {
        validationErrors.firstName = 'Names can only contain letters, spaces and punctuation marks.';
        return false;
      }
      validationSuccess.firstName = true;
      return true;

    case 'lastName':
      if (!formData.last_name.trim()) {
        validationErrors.lastName = 'Last name cannot be blank';
        return false;
      }
      if (!nameRegex.test(formData.last_name)) {
        validationErrors.lastName = 'Names can only contain letters, spaces and punctuation marks.';
        return false;
      }
      validationSuccess.lastName = true;
      return true;

    case 'email':
      if (!formData.email) {
        validationErrors.email = 'Email cannot be blank';
        return false;
      }
      if (!emailRegex.test(formData.email)) {
        validationErrors.email = 'Invalid email';
        return false;
      }
      validationSuccess.email = true;
      return true;

    case 'companyName':
      if (!formData.company_name.trim()) {
        validationErrors.companyName = 'Company name cannot be blank';
        return false;
      }
      if (formData.company_name.length < 2) {
        validationErrors.companyName = 'Company name must be at least 2 characters';
        return false;
      }
      validationSuccess.companyName = true;
      return true;

    case 'password':
      validatePasswordField();
      return passwordStrengthScore.value >= 3;

    case 'confirmPassword':
      if (!formData.confirmPassword) {
        validationErrors.confirmPassword = 'Please re-enter password';
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = 'Passwords do not match';
        return false;
      }
      validationSuccess.confirmPassword = true;
      return true;

    default:
      return true;
  }
};

const validatePasswordField = () => {
  validationErrors.password = '';
  if (!formData.password) {
    validationErrors.password = 'Password cannot be blank';
    return false;
  }
  if (passwordStrengthScore.value < 3) {
    validationErrors.password = 'Password is not strong enough';
    return false;
  }
  validationSuccess.password = true;
  return true;
};

// Password strength calculation
const passwordStrengthScore = computed(() => {
  let score = 0;
  const password = formData.password;
  
  if (!password) return 0;
  
  if (password.length >= passwordRules.minLength) score += 1;
  if (passwordRules.hasUpper.test(password)) score += 1;
  if (passwordRules.hasLower.test(password)) score += 1;
  if (passwordRules.hasNumber.test(password)) score += 1;
  if (passwordRules.hasSpecial.test(password)) score += 1;
  
  return score;
});

const passwordStrengthClass = computed(() => {
  const score = passwordStrengthScore.value;
  if (score <= 2) return 'strength-weak';
  if (score === 3) return 'strength-fair';
  if (score === 4) return 'strength-good';
  return 'strength-strong';
});

const passwordStrengthTextClass = computed(() => {
  const score = passwordStrengthScore.value;
  if (score <= 2) return 'strength-weak-text';
  if (score === 3) return 'strength-fair-text';
  if (score === 4) return 'strength-good-text';
  return 'strength-strong-text';
});

const passwordStrengthIcon = computed(() => {
  const score = passwordStrengthScore.value;
  if (score <= 2) return 'mdi-alert-circle';
  if (score === 3) return 'mdi-alert';
  if (score === 4) return 'mdi-information';
  return 'mdi-check-circle';
});

const passwordStrengthText = computed(() => {
  const score = passwordStrengthScore.value;
  const password = formData.password;
  
  if (!password) return '';
  
  const missing = [];
  if (password.length < passwordRules.minLength) missing.push('8 characters');
  if (!passwordRules.hasUpper.test(password)) missing.push('uppercase');
  if (!passwordRules.hasLower.test(password)) missing.push('chữ thường');
  if (!passwordRules.hasNumber.test(password)) missing.push('number');
  if (!passwordRules.hasSpecial.test(password)) missing.push('special characters');
  
  if (score <= 2) return `Weak password - required: ${missing.join(', ')}`;
  if (score === 3) return `Average password - should add: ${missing.join(', ')}`;
  if (score === 4) return 'Good';
  return 'Strong';
});

// Password match computation
const passwordMatchClass = computed(() => {
  if (!formData.confirmPassword) return 'match-waiting';
  return formData.password === formData.confirmPassword ? 'match-success' : 'match-error';
});

const passwordMatchIcon = computed(() => {
  if (!formData.confirmPassword) return 'mdi-information';
  return formData.password === formData.confirmPassword ? 'mdi-check-circle' : 'mdi-alert-circle';
});

const passwordMatchText = computed(() => {
  if (!formData.confirmPassword) return 'Re-enter password to confirm';
  return formData.password === formData.confirmPassword ? 'Password matches' : 'Passwords do not match';
});

// Input styling helper
const getInputClass = (field) => {
  if (validationErrors[field]) return 'error';
  if (validationSuccess[field]) return 'success';
  return '';
};

// Form validation
const isFormValid = computed(() => {
  return validationSuccess.firstName &&
         validationSuccess.lastName &&
         validationSuccess.email &&
         validationSuccess.companyName &&
         passwordStrengthScore.value >= 3 &&
         formData.password === formData.confirmPassword;
});

// Button text
const getButtonText = () => {
  if (authStore.loading) return 'Creating account...';
  if (registerSuccess.value) return 'Success!';
  return 'Create account';
};

// Form submission
const onRegister = () => {
  // Validate all fields
  const fieldsToValidate = ['firstName', 'lastName', 'email', 'companyName', 'password', 'confirmPassword'];
  const isValid = fieldsToValidate.every(field => validateField(field));
  
  if (isValid && isFormValid.value) {
    // Only send password, not confirmPassword to backend
    // Always send terms_accepted as true since user registration implies agreement
    const submitData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password, // Only password, not confirmPassword
      company_name: formData.company_name,
      terms_accepted: true, // Always true since registration implies agreement per privacy notice
    };
    
    authStore.handleRegister(submitData);
  }
};
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
  --loomsky-warning: #F59E0B;
  --loomsky-error: #EF4444;
  --loomsky-info: #3B82F6;
  --loomsky-text-title: #111c2d;
  --loomsky-text-body: #7b8893;
}

/* Main Page Layout */
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 50px 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.register-page::before {
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
.register-container {
  width: 100%;
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
.register-card {
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

.register-card::before {
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
.register-form {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
}

.form-group.full-width {
  flex: none;
  width: 100%;
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

.form-input.success ~ .input-icon {
  color: var(--loomsky-success);
}

.form-input.error ~ .input-icon {
  color: var(--loomsky-error);
}

/* Password Strength Indicator */
.password-strength {
  margin-top: 12px;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: var(--loomsky-neutral-200);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 9999px;
}

.strength-weak { width: 25%; background: var(--loomsky-error); }
.strength-fair { width: 50%; background: var(--loomsky-warning); }
.strength-good { width: 75%; background: var(--loomsky-info); }
.strength-strong { width: 100%; background: var(--loomsky-success); }

.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.strength-weak-text { color: var(--loomsky-error); }
.strength-fair-text { color: var(--loomsky-warning); }
.strength-good-text { color: var(--loomsky-info); }
.strength-strong-text { color: var(--loomsky-success); }

/* Password Match Indicator */
.password-match {
  margin-top: 8px;
}

.match-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.match-success { color: var(--loomsky-success); }
.match-error { color: var(--loomsky-error); }
.match-waiting { color: var(--loomsky-neutral-400); }

/* Privacy Notice */
.privacy-notice {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(0, 103, 184, 0.02);
  border: 1px solid rgba(0, 103, 184, 0.1);
  border-radius: 8px;
}

.privacy-text {
  font-size: 14px;
  color: var(--loomsky-text-body);
  margin: 0;
}

.privacy-text a {
  color: var(--loomsky-primary);
  text-decoration: none;
  font-weight: 500;
}

.privacy-text a:hover {
  text-decoration: underline;
}

/* Checkbox Styles */
.checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(16, 185, 129, 0.02);
  border: 1px solid rgba(16, 185, 129, 0.1);
  border-radius: 8px;
}

.checkbox-container.newsletter {
  background: rgba(0, 103, 184, 0.02);
  border: 1px solid rgba(0, 103, 184, 0.1);
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--loomsky-neutral-300);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.custom-checkbox.checked {
  background: var(--loomsky-primary);
  border-color: var(--loomsky-primary);
}

.custom-checkbox .v-icon {
  display: none;
}

.custom-checkbox.checked .v-icon {
  display: block;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--loomsky-text-body);
  line-height: 1.5;
  cursor: pointer;
}

.checkbox-label a {
  color: var(--loomsky-primary);
  text-decoration: none;
  font-weight: 500;
}

.checkbox-label a:hover {
  text-decoration: underline;
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

/* Login Section */
.login-section {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--loomsky-neutral-100);
}

.login-text {
  font-size: 0.875rem;
  color: var(--loomsky-text-body);
}

.login-link {
  color: var(--loomsky-primary);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
}

.login-link:hover {
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
  .register-page {
    padding: 8px;
  }

  .register-card {
    padding: 32px;
  }

  .brand-name {
    font-size: 1.5rem;
  }

  .logo {
    width: 64px;
    height: 64px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

/* Focus Styles for Accessibility */
.form-input:focus,
.submit-button:focus,
.custom-checkbox:focus,
.login-link:focus {
  outline: 2px solid var(--loomsky-primary);
  outline-offset: 2px;
}
</style>
