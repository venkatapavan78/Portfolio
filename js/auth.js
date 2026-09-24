/**
 * ==========================================================================
 * Authentication & Session Management Module
 * Portfolio Website - Module 2: Signup + Local Storage Authentication
 * ==========================================================================
 *
 * SECURITY DEMONSTRATION NOTE:
 * "This Local Storage authentication is implemented for educational/demo
 * purposes only. Production applications must use secure server-side
 * authentication and must never store plaintext passwords in browser Local Storage."
 *
 * This module strictly uses Vanilla JavaScript and browser localStorage.
 * It provides client-side signup validation, duplicate email prevention,
 * user registration with default 'user' role, and storage utilities.
 */

window.PortfolioAuth = (function() {
  "use strict";

  /* --------------------------------------------------------------------------
     1. User Roles Contract
     -------------------------------------------------------------------------- */
  const ROLES = Object.freeze({
    ADMIN: "admin",
    USER: "user"
  });

  /* --------------------------------------------------------------------------
     2. Unique User ID Generator (Section 8)
     Uses crypto.randomUUID() where supported, with deterministic safe fallback.
     Example: "user_8f23..."
     -------------------------------------------------------------------------- */
  function generateUserId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      try {
        return "user_" + window.crypto.randomUUID().replace(/-/g, "").substring(0, 12);
      } catch (e) {
        // Fallback if randomUUID fails
      }
    }
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return "user_" + timestamp + randomPart;
  }

  /* --------------------------------------------------------------------------
     3. Validation Functions (Section 4, 16)
     -------------------------------------------------------------------------- */
  /**
   * Validate Full Name
   * Requirements:
   * - Required
   * - Minimum 2 characters
   * - Should not contain only spaces
   * @param {string} name
   * @returns {{isValid: boolean, error: string}}
   */
  function validateName(name) {
    if (typeof name !== "string") {
      return { isValid: false, error: "Please enter your full name." };
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return { isValid: false, error: "Please enter your full name." };
    }
    if (trimmed.length < 2) {
      return { isValid: false, error: "Full name must be at least 2 characters." };
    }
    if (trimmed.length > 60) {
      return { isValid: false, error: "Full name cannot exceed 60 characters." };
    }
    const nameRegex = /^[a-zA-Z\s'.-]+$/;
    if (!nameRegex.test(trimmed)) {
      return { isValid: false, error: "Full name can only contain letters, spaces, hyphens, and apostrophes." };
    }
    return { isValid: true, error: "" };
  }

  /**
   * Validate Email Address
   * Requirements:
   * - Required
   * - Must follow a valid email format
   * @param {string} email
   * @returns {{isValid: boolean, error: string}}
   */
  function validateEmail(email) {
    if (typeof email !== "string") {
      return { isValid: false, error: "Please enter your email address." };
    }
    const trimmed = email.trim();
    if (!trimmed) {
      return { isValid: false, error: "Please enter your email address." };
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, error: "Please enter a valid email address." };
    }
    return { isValid: true, error: "" };
  }

  /**
   * Validate Password & Compute Strength (Section 5, 16)
   * Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one number (0-9)
   * Example: Password123
   * Strength levels: Weak, Medium, Strong
   * Security guarantee: Does NOT display the actual password in error messages.
   * @param {string} password
   * @returns {{
   *   isValid: boolean,
   *   score: number,
   *   strength: "none"|"Weak"|"Medium"|"Strong",
   *   checks: { length: boolean, uppercase: boolean, lowercase: boolean, number: boolean },
   *   error: string
   * }}
   */
  function validatePassword(password) {
    const pwd = typeof password === "string" ? password : "";
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd)
    };

    let error = "";
    if (!pwd) {
      error = "Password must contain at least 8 characters, including uppercase, lowercase, and a number.";
    } else if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number) {
      error = "Password must contain at least 8 characters, including uppercase, lowercase, and a number.";
    }

    const isValid = Boolean(pwd) && checks.length && checks.uppercase && checks.lowercase && checks.number;

    // Calculate strength: Weak | Medium | Strong
    let score = 0;
    let strength = "none";

    if (pwd.length > 0) {
      let passedCount = 0;
      if (checks.length) passedCount++;
      if (checks.uppercase) passedCount++;
      if (checks.lowercase) passedCount++;
      if (checks.number) passedCount++;

      score = passedCount;

      if (passedCount <= 1) {
        strength = "Weak";
      } else if (passedCount <= 3) {
        strength = "Medium";
      } else {
        strength = "Strong";
      }
    }

    return {
      isValid: isValid,
      score: score,
      strength: strength,
      checks: checks,
      error: error
    };
  }

  /**
   * Validate Confirm Password
   * Requirements:
   * - password === confirmPassword
   * Otherwise display: "Passwords do not match."
   * @param {string} password
   * @param {string} confirmPassword
   * @returns {{isValid: boolean, error: string}}
   */
  function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
      return { isValid: false, error: "Please confirm your password." };
    }
    if (password !== confirmPassword) {
      return { isValid: false, error: "Passwords do not match." };
    }
    return { isValid: true, error: "" };
  }

  /**
   * Validate entire registration form data (Section 15, 16)
   * @param {Object} formData
   * @returns {{isValid: boolean, errors: Object}}
   */
  function validateSignupForm(formData) {
    const data = formData || {};
    const errors = {};

    // 1. Full Name
    const nameVal = validateName(data.fullName || data.name);
    if (!nameVal.isValid) {
      errors.fullName = nameVal.error;
    }

    // 2. Email & Duplicate check
    const emailVal = validateEmail(data.email);
    if (!emailVal.isValid) {
      errors.email = emailVal.error;
    } else {
      const cleanEmail = String(data.email).trim().toLowerCase();
      if (window.PortfolioStorage && window.PortfolioStorage.findUserByEmail(cleanEmail)) {
        errors.email = "An account with this email already exists. Please log in instead.";
      }
    }

    // 3. Password
    const passwordVal = validatePassword(data.password);
    if (!passwordVal.isValid) {
      errors.password = passwordVal.error;
    }

    // 4. Confirm Password
    const confirmVal = validateConfirmPassword(data.password, data.confirmPassword);
    if (!confirmVal.isValid) {
      errors.confirmPassword = confirmVal.error;
    }

    // 5. Terms & Conditions
    if (!data.agreeTerms) {
      errors.agreeTerms = "Please accept the Terms & Conditions.";
    }

    const isValid = Object.keys(errors).length === 0;
    return { isValid: isValid, errors: errors };
  }

  /* --------------------------------------------------------------------------
     4. User Registration (Section 7, 9, 11, 12, 13, 15)
     -------------------------------------------------------------------------- */
  /**
   * Register a new user account into Local Storage.
   *
   * Flow:
   * 1. Validate fields.
   * 2. Prevent duplicate email (case-insensitive).
   * 3. Construct user object:
   *    {
   *      id: "user_...",
   *      fullName: "User Name",
   *      email: "user@example.com",
   *      password: "Password123",
   *      role: "user",
   *      createdAt: "..."
   *    }
   * 4. Persist to localStorage (portfolio_users) without overwriting.
   * 5. Do NOT create an active session (reserved for Module 3 Login).
   *
   * @param {Object} formData
   * @returns {Promise<{success: boolean, user?: Object, errors?: Object, message: string}>}
   */
  function registerUser(formData) {
    return new Promise((resolve) => {
      // Check storage availability
      if (!window.PortfolioStorage || !window.PortfolioStorage.isAvailable()) {
        resolve({
          success: false,
          errors: { general: "Unable to save account data in this browser. Please check your browser storage settings." },
          message: "Unable to save account data in this browser. Please check your browser storage settings."
        });
        return;
      }

      // Validate form data
      const validation = validateSignupForm(formData);
      if (!validation.isValid) {
        resolve({
          success: false,
          errors: validation.errors,
          message: "Please correct the errors in the form before submitting."
        });
        return;
      }

      const cleanEmail = String(formData.email).trim().toLowerCase();

      // Check duplicate accounts (Section 13)
      const existingUser = window.PortfolioStorage.findUserByEmail(cleanEmail);
      if (existingUser) {
        resolve({
          success: false,
          errors: {
            email: "An account with this email already exists. Please log in instead."
          },
          message: "An account with this email already exists. Please log in instead."
        });
        return;
      }

      // User Data Structure (Section 7)
      const newUser = {
        id: generateUserId(),
        fullName: String(formData.fullName || formData.name).trim(),
        email: cleanEmail,
        password: String(formData.password), // Demo academic storage as specified in Section 7
        role: "user", // Default user role strictly set to "user"
        createdAt: new Date().toISOString()
      };

      // Persist to portfolio_users array via storage utility (Section 9, 10)
      const stored = window.PortfolioStorage.addUser(newUser);
      if (!stored) {
        resolve({
          success: false,
          errors: { general: "Unable to save account data in this browser. Please check your browser storage settings." },
          message: "Unable to save account data in this browser. Please check your browser storage settings."
        });
        return;
      }

      // Do NOT create an authenticated session (Section 11)
      console.log(`[PortfolioAuth] User registered successfully: ${newUser.email} (ID: ${newUser.id}, Role: ${newUser.role})`);

      resolve({
        success: true,
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        message: "Account created successfully. Redirecting to login..."
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. Admin Account Initialization (Module 3 - Section 12, 13)
     --------------------------------------------------------------------------
     Predefined demonstration admin account for testing:
     Email: admin@portfolio.com
     Password: Admin123
     Role: admin
     
     SECURITY & ACADEMIC NOTICE (Section 28):
     "This Local Storage authentication is for educational/demo purposes only.
     Browser-side authentication cannot provide production-level security.
     Real applications should use secure server-side authentication, password
     hashing, HTTPS, secure sessions/tokens, and appropriate authorization controls."

     Rules:
     1. Read users from Local Storage (portfolio_users).
     2. Check whether an admin already exists.
     3. If an admin exists, do nothing (no duplicate accounts).
     4. If no admin exists, create the predefined demonstration admin.
     5. Save the updated users array.
     -------------------------------------------------------------------------- */
  function initializeAdmin() {
    if (!window.PortfolioStorage || !window.PortfolioStorage.isAvailable()) {
      return null;
    }
    try {
      const users = window.PortfolioStorage.getUsers();
      const adminExists = users.some(u => u && (u.role === "admin" || (u.email && u.email.toLowerCase() === "admin@portfolio.com")));
      if (adminExists) {
        return null; // Admin already initialized; do not create duplicate
      }

      const adminUser = {
        id: "user_admin_01",
        fullName: "System Administrator",
        email: "admin@portfolio.com",
        password: "Admin123", // Demonstration academic credentials only
        role: "admin",
        createdAt: new Date().toISOString()
      };

      users.push(adminUser);
      window.PortfolioStorage.saveUsers(users);
      console.log("[PortfolioAuth] Demonstration admin initialized: admin@portfolio.com (Role: admin)");
      return adminUser;
    } catch (e) {
      console.error("[PortfolioAuth] Failed to initialize admin account:", e);
      return null;
    }
  }

  /* --------------------------------------------------------------------------
     6. User Authentication & Login (Module 3 - Section 5, 6, 7, 8, 9, 10, 11)
     --------------------------------------------------------------------------
     Workflow:
     1. Validate email (required, valid format) & password (required).
     2. Normalize email: email.trim().toLowerCase().
     3. Retrieve registered users from Local Storage (portfolio_users).
     4. Find matching user by email.
     5. Compare password with stored password.
     6. If email not found or password incorrect -> "Invalid email or password."
        (Never reveal whether email exists).
     7. On success, create session object WITHOUT password:
        { id, fullName, email, role, loginTime }
     8. Persist session under 'portfolio_current_user'.
     9. Inspect role: 'admin' -> admin-dashboard.html, 'user' -> user-dashboard.html.
     -------------------------------------------------------------------------- */
  function login(credentials) {
    return new Promise((resolve) => {
      // Storage availability check (Section 25)
      if (!window.PortfolioStorage || !window.PortfolioStorage.isAvailable()) {
        resolve({
          success: false,
          error: "Authentication storage is unavailable. Please check your browser storage settings."
        });
        return;
      }

      const email = credentials ? credentials.email : "";
      const password = credentials ? credentials.password : "";
      const rememberMe = Boolean(credentials && credentials.rememberMe);

      // 1. Email Validation (Section 6)
      if (typeof email !== "string" || !email.trim()) {
        resolve({
          success: false,
          field: "email",
          error: "Please enter your email."
        });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(cleanEmail)) {
        resolve({
          success: false,
          field: "email",
          error: "Please enter a valid email address."
        });
        return;
      }

      // 2. Password Validation (Section 6)
      if (typeof password !== "string" || !password) {
        resolve({
          success: false,
          field: "password",
          error: "Please enter your password."
        });
        return;
      }

      // 3. Retrieve users & find matching user (Section 7, 8)
      const user = window.PortfolioStorage.findUserByEmail(cleanEmail);

      // 4. Validate credentials (Section 8)
      // If user does not exist OR password does not match, return identical error message:
      // "Invalid email or password." (Do NOT reveal whether the email exists).
      if (!user || user.password !== password) {
        resolve({
          success: false,
          error: "Invalid email or password."
        });
        return;
      }

      // 5. Successful login: Create session / current-user object (Section 9, 10, 27)
      // CRITICAL RULE: Session/current-user object MUST NOT contain the password!
      const sessionUser = {
        id: user.id,
        fullName: user.fullName || user.name || "User",
        email: user.email,
        role: user.role || "user",
        loginTime: new Date().toISOString()
      };

      // 6. Store in Local Storage under 'portfolio_current_user' (Section 9, 23)
      // In this frontend academic implementation, the session is stored in localStorage.
      // If Remember Me is unchecked, the session key remains portfolio_current_user
      // for client-side state; true cookie-level session expiration requires a backend server.
      window.PortfolioStorage.setCurrentUser(sessionUser);

      // 7. Role-Based Routing (Section 11)
      const redirectUrl = sessionUser.role === "admin" ? "admin-dashboard.html" : "user-dashboard.html";

      console.log(`[PortfolioAuth] Login successful: ${sessionUser.email} (Role: ${sessionUser.role}) -> ${redirectUrl}`);

      resolve({
        success: true,
        user: sessionUser,
        redirectUrl: redirectUrl,
        message: "Login successful. Redirecting..."
      });
    });
  }

  /* --------------------------------------------------------------------------
     7. Protected Page Logic & Authentication Guards (Section 16, 17, 18, 19, 20, 21)
     -------------------------------------------------------------------------- */
  /**
   * Check if a user is currently authenticated
   * @returns {boolean}
   */
  function isAuthenticated() {
    return window.PortfolioStorage ? window.PortfolioStorage.isUserLoggedIn() : false;
  }

  /**
   * Get current authenticated user profile
   * @returns {Object|null}
   */
  function getCurrentUser() {
    return window.PortfolioStorage ? window.PortfolioStorage.getCurrentUser() : null;
  }

  /**
   * Get current authenticated user's role
   * @returns {string} e.g. "admin", "user", "guest"
   */
  function getUserRole() {
    const user = getCurrentUser();
    return user && user.role ? user.role : "guest";
  }

  /**
   * Authentication Guard: Require an active logged-in session.
   * Redirects unauthenticated users to login page immediately on page load.
   * @param {string} [redirectPath="login.html"]
   * @returns {Object|null} The current user object or null if redirected
   */
  function requireAuthentication(redirectPath = "login.html") {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.warn("[PortfolioAuth Guard] Access denied: Unauthenticated user. Redirecting to login.");
      window.location.replace(redirectPath);
      return null;
    }
    return currentUser;
  }

  /**
   * Role Guard: Require a specific role (e.g. "admin").
   * 1. If not authenticated -> redirect to login.html.
   * 2. If authenticated but role does not match:
   *    Redirect normal user to user-dashboard.html and stash permission notice.
   * @param {string} allowedRole - Expected role (e.g. "admin")
   * @param {string} [unauthorizedRedirect="user-dashboard.html"]
   * @param {string} [loginRedirect="login.html"]
   * @returns {Object|null} The current user object or null if redirected
   */
  function requireRole(allowedRole, unauthorizedRedirect = "user-dashboard.html", loginRedirect = "login.html") {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.warn("[PortfolioAuth Guard] Access denied: Unauthenticated user. Redirecting to login.");
      window.location.replace(loginRedirect);
      return null;
    }

    if (currentUser.role !== allowedRole) {
      console.warn(`[PortfolioAuth Guard] Access denied: Role "${currentUser.role}" does not have "${allowedRole}" permissions.`);
      try {
        sessionStorage.setItem("portfolio_auth_notice", "You do not have permission to access the Admin Dashboard.");
      } catch (e) {}
      window.location.replace(unauthorizedRedirect);
      return null;
    }

    return currentUser;
  }

  /**
   * Logout current user (Section 20)
   * 1. Clears current session from Local Storage (portfolio_current_user).
   * 2. Redirects to specified path (e.g. ../index.html).
   * @param {string} [redirectPath="../index.html"]
   */
  function logout(redirectPath = "../index.html") {
    if (window.PortfolioStorage) {
      window.PortfolioStorage.clearCurrentUser();
    }
    try {
      window.dispatchEvent(new CustomEvent("portfolio:auth-change", { detail: { action: "logout" } }));
    } catch (e) {}
    console.log("[PortfolioAuth] Session cleared. User logged out.");
    window.location.replace(redirectPath);
  }

  function logoutUser(redirectPath = "../index.html") {
    return logout(redirectPath);
  }

  /* --------------------------------------------------------------------------
     Public Interface
     -------------------------------------------------------------------------- */
  return {
    ROLES: ROLES,
    generateUserId: generateUserId,
    validateName: validateName,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateConfirmPassword: validateConfirmPassword,
    validateSignupForm: validateSignupForm,
    registerUser: registerUser,
    signup: registerUser, // Alias for compatibility
    login: login,
    initializeAdmin: initializeAdmin,
    isAuthenticated: isAuthenticated,
    getUserRole: getUserRole,
    getCurrentUser: getCurrentUser,
    requireAuthentication: requireAuthentication,
    requireRole: requireRole,
    logout: logout,
    logoutUser: logoutUser
  };
})();

// Automatically initialize predefined demonstration admin account if needed (Section 12, 13)
if (window.PortfolioAuth && typeof window.PortfolioAuth.initializeAdmin === "function") {
  window.PortfolioAuth.initializeAdmin();
}

/* ----------------------------------------------------------------------------
   UI Controller & Form Synchronization
   ---------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function() {
  "use strict";

  // 1. Synchronize theme preference across authentication pages
  if (window.PortfolioStorage) {
    const currentTheme = window.PortfolioStorage.getTheme();
    document.documentElement.setAttribute("data-theme", currentTheme);
    const toggles = document.querySelectorAll(".theme-toggle");
    toggles.forEach(btn => {
      btn.addEventListener("click", () => {
        window.PortfolioStorage.toggleTheme();
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. Show / Hide Password Controls (Section 6)
     Eye button toggles password field between "text" and "password".
     Fully keyboard accessible.
     -------------------------------------------------------------------------- */
  const toggleButtons = document.querySelectorAll(".password-toggle-btn");
  toggleButtons.forEach(btn => {
    btn.addEventListener("click", function() {
      const targetId = this.getAttribute("data-target");
      const targetInput = targetId ? document.getElementById(targetId) : this.closest(".password-input-wrapper").querySelector("input");
      if (!targetInput) return;

      const isPassword = targetInput.getAttribute("type") === "password";
      targetInput.setAttribute("type", isPassword ? "text" : "password");
      this.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
      this.classList.toggle("active", isPassword);

      const eyeOpen = this.querySelector(".icon-eye-open");
      const eyeClosed = this.querySelector(".icon-eye-closed");
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? "none" : "block";
        eyeClosed.style.display = isPassword ? "block" : "none";
      }
    });

    // Keyboard accessibility for Enter / Space keys
    btn.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  });

  /* --------------------------------------------------------------------------
     3. Signup Form Controller (Section 4, 5, 6, 12, 13, 16)
     -------------------------------------------------------------------------- */
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    const nameInput = document.getElementById("signup-name");
    const emailInput = document.getElementById("signup-email");
    const passwordInput = document.getElementById("signup-password");
    const confirmPasswordInput = document.getElementById("signup-confirm-password");
    const termsCheckbox = document.getElementById("signup-terms");
    const submitBtn = document.getElementById("signup-submit-btn");
    const alertBox = document.getElementById("auth-alert");

    // Password criteria items
    const ruleLength = document.getElementById("rule-length");
    const ruleUpper = document.getElementById("rule-upper");
    const ruleLower = document.getElementById("rule-lower");
    const ruleNumber = document.getElementById("rule-number");

    // Password strength meter
    const strengthSegments = document.querySelectorAll(".strength-segment");
    const strengthText = document.getElementById("strength-text");

    // Match indicator
    const matchIndicator = document.getElementById("match-indicator");

    function showAlert(type, message, isHtml = false) {
      if (!alertBox) return;
      alertBox.className = "auth-alert " + (type === "success" ? "auth-alert-success" : "auth-alert-error");
      if (isHtml) {
        alertBox.innerHTML = `
          <span class="auth-alert-icon" aria-hidden="true">${type === "success" ? "✓" : "⚠"}</span>
          <span class="auth-alert-text">${message}</span>
        `;
      } else {
        alertBox.innerHTML = `
          <span class="auth-alert-icon" aria-hidden="true">${type === "success" ? "✓" : "⚠"}</span>
          <span class="auth-alert-text">${escapeHtml(message)}</span>
        `;
      }
      alertBox.style.display = "flex";
      alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function hideAlert() {
      if (alertBox) {
        alertBox.style.display = "none";
        alertBox.textContent = "";
      }
    }

    function setFieldError(fieldId, errorMsg) {
      const input = document.getElementById(fieldId);
      const errorDiv = document.getElementById(fieldId + "-error");
      if (input) {
        if (errorMsg) {
          input.classList.add("is-invalid");
          input.classList.remove("is-valid");
          input.setAttribute("aria-invalid", "true");
        } else {
          input.classList.remove("is-invalid");
          input.classList.add("is-valid");
          input.setAttribute("aria-invalid", "false");
        }
      }
      if (errorDiv) {
        errorDiv.textContent = errorMsg || "";
        errorDiv.classList.toggle("active", Boolean(errorMsg));
      }
    }

    function clearFieldError(fieldId) {
      setFieldError(fieldId, "");
    }

    /**
     * Real-time password strength indicator (Section 5)
     * Displays: Weak | Medium | Strong
     */
    function updatePasswordMeter(pwd) {
      const val = window.PortfolioAuth.validatePassword(pwd);

      // Update rule checklist items (4 required criteria)
      if (ruleLength) ruleLength.classList.toggle("valid", val.checks.length);
      if (ruleUpper) ruleUpper.classList.toggle("valid", val.checks.uppercase);
      if (ruleLower) ruleLower.classList.toggle("valid", val.checks.lowercase);
      if (ruleNumber) ruleNumber.classList.toggle("valid", val.checks.number);

      // Update strength segments
      if (strengthSegments.length > 0) {
        strengthSegments.forEach((seg, idx) => {
          seg.className = "strength-segment";
          if (pwd.length > 0) {
            if (val.strength === "Weak" && idx === 0) {
              seg.classList.add("active-weak");
            } else if (val.strength === "Medium" && idx <= 1) {
              seg.classList.add("active-medium");
            } else if (val.strength === "Strong") {
              seg.classList.add("active-strong");
            }
          }
        });
      }

      // Text indicator: Weak | Medium | Strong
      if (strengthText) {
        if (!pwd) {
          strengthText.textContent = "Enter password";
          strengthText.style.color = "var(--text-muted)";
        } else {
          strengthText.textContent = val.strength;
          if (val.strength === "Weak") {
            strengthText.style.color = "var(--accent-rose)";
          } else if (val.strength === "Medium") {
            strengthText.style.color = "var(--accent-amber)";
          } else if (val.strength === "Strong") {
            strengthText.style.color = "var(--accent-emerald)";
          }
        }
      }

      // Check confirm password match in real time
      if (confirmPasswordInput && confirmPasswordInput.value) {
        updatePasswordMatch();
      }

      return val;
    }

    /**
     * Real-time password confirmation match check (Section 4)
     */
    function updatePasswordMatch() {
      if (!confirmPasswordInput || !passwordInput) return;
      const pwd = passwordInput.value;
      const confirmPwd = confirmPasswordInput.value;

      if (!confirmPwd) {
        if (matchIndicator) {
          matchIndicator.textContent = "";
          matchIndicator.className = "password-match-indicator";
        }
        return;
      }

      const isMatch = pwd === confirmPwd;
      if (matchIndicator) {
        matchIndicator.className = "password-match-indicator " + (isMatch ? "matched" : "mismatched");
        matchIndicator.textContent = isMatch ? "✓ Passwords match" : "✕ Passwords do not match";
      }

      if (isMatch) {
        confirmPasswordInput.classList.add("is-valid");
        confirmPasswordInput.classList.remove("is-invalid");
        clearFieldError("signup-confirm-password");
      } else {
        confirmPasswordInput.classList.remove("is-valid");
        confirmPasswordInput.classList.add("is-invalid");
      }
    }

    // Input listeners for real-time validation
    if (nameInput) {
      nameInput.addEventListener("input", function() {
        const check = window.PortfolioAuth.validateName(this.value);
        if (check.isValid) {
          clearFieldError("signup-name");
        }
      });
      nameInput.addEventListener("blur", function() {
        const check = window.PortfolioAuth.validateName(this.value);
        if (!check.isValid) {
          setFieldError("signup-name", check.error);
        } else {
          clearFieldError("signup-name");
        }
      });
    }

    if (emailInput) {
      emailInput.addEventListener("input", function() {
        const check = window.PortfolioAuth.validateEmail(this.value);
        if (check.isValid) {
          clearFieldError("signup-email");
        }
      });
      emailInput.addEventListener("blur", function() {
        const check = window.PortfolioAuth.validateEmail(this.value);
        if (!check.isValid) {
          setFieldError("signup-email", check.error);
        } else {
          const cleanEmail = this.value.trim().toLowerCase();
          if (window.PortfolioStorage && window.PortfolioStorage.findUserByEmail(cleanEmail)) {
            setFieldError("signup-email", "An account with this email already exists. Please log in instead.");
          } else {
            clearFieldError("signup-email");
          }
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener("input", function() {
        updatePasswordMeter(this.value);
        const check = window.PortfolioAuth.validatePassword(this.value);
        if (check.isValid) {
          clearFieldError("signup-password");
        }
      });
      passwordInput.addEventListener("blur", function() {
        const check = window.PortfolioAuth.validatePassword(this.value);
        if (!check.isValid) {
          setFieldError("signup-password", check.error);
        } else {
          clearFieldError("signup-password");
        }
      });
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener("input", updatePasswordMatch);
      confirmPasswordInput.addEventListener("blur", function() {
        if (!this.value) {
          setFieldError("signup-confirm-password", "Please confirm your password.");
        } else if (passwordInput && this.value !== passwordInput.value) {
          setFieldError("signup-confirm-password", "Passwords do not match.");
        } else {
          clearFieldError("signup-confirm-password");
        }
      });
    }

    if (termsCheckbox) {
      termsCheckbox.addEventListener("change", function() {
        if (!this.checked) {
          setFieldError("signup-terms", "Please accept the Terms & Conditions.");
        } else {
          clearFieldError("signup-terms");
        }
      });
    }

    // Form submission handler
    signupForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      hideAlert();

      const fullName = nameInput ? nameInput.value : "";
      const email = emailInput ? emailInput.value : "";
      const password = passwordInput ? passwordInput.value : "";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
      const agreeTerms = termsCheckbox ? termsCheckbox.checked : false;

      // Disable submit button during processing
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `
          <span class="auth-btn-spinner" aria-hidden="true"></span>
          <span>Creating Account...</span>
        `;
      }

      try {
        const result = await window.PortfolioAuth.registerUser({
          fullName: fullName,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
          agreeTerms: agreeTerms
        });

        if (result.success) {
          // Section 12: Display success message and redirect to login.html
          showAlert("success", "Account created successfully. Redirecting to login...");

          // Reset form fields
          signupForm.reset();
          if (strengthSegments) {
            strengthSegments.forEach(s => s.className = "strength-segment");
          }
          if (strengthText) strengthText.textContent = "";
          if (matchIndicator) matchIndicator.textContent = "";
          document.querySelectorAll(".rule-item").forEach(r => r.classList.remove("valid"));

          // Redirect to login.html after short delay so user sees message
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        } else {
          // Display validation errors on inputs
          if (result.errors) {
            if (result.errors.fullName) setFieldError("signup-name", result.errors.fullName);
            if (result.errors.email) setFieldError("signup-email", result.errors.email);
            if (result.errors.password) setFieldError("signup-password", result.errors.password);
            if (result.errors.confirmPassword) setFieldError("signup-confirm-password", result.errors.confirmPassword);
            if (result.errors.agreeTerms) setFieldError("signup-terms", result.errors.agreeTerms);

            // Focus first error field for accessibility
            const firstErrorKey = Object.keys(result.errors)[0];
            const firstFieldId = firstErrorKey === "fullName" ? "signup-name" :
              firstErrorKey === "confirmPassword" ? "signup-confirm-password" :
              firstErrorKey === "agreeTerms" ? "signup-terms" : "signup-" + firstErrorKey;
            const firstErrorEl = document.getElementById(firstFieldId);
            if (firstErrorEl) firstErrorEl.focus();
          }

          if (result.errors && result.errors.email && result.errors.email.includes("already exists")) {
            showAlert("error", `An account with this email already exists. <a href="login.html" class="form-link" style="text-decoration:underline;">Please log in instead.</a>`, true);
          } else {
            showAlert("error", result.message || "Failed to create account. Please check the fields.");
          }

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalText || "Create Account";
          }
        }
      } catch (err) {
        showAlert("error", "An unexpected error occurred. Please try again.");
        console.error("[PortfolioAuth] Signup error:", err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalText || "Create Account";
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     4. Login Form Controller (Module 3 - Section 4, 5, 6, 8, 9, 11, 23, 24, 30)
     -------------------------------------------------------------------------- */
  const loginForm = document.getElementById("loginForm") || document.getElementById("login-form");
  if (loginForm) {
    const emailInput = document.getElementById("loginEmail") || document.getElementById("login-email");
    const passwordInput = document.getElementById("loginPassword") || document.getElementById("login-password");
    const rememberCheckbox = document.getElementById("rememberMe") || document.getElementById("login-remember");
    const submitBtn = document.getElementById("login-submit-btn") || loginForm.querySelector("button[type='submit']");
    const alertBox = document.getElementById("auth-alert");

    function showLoginAlert(type, message) {
      if (!alertBox) return;
      alertBox.className = "auth-alert " + (type === "success" ? "auth-alert-success" : "auth-alert-error");
      alertBox.innerHTML = `
        <span class="auth-alert-icon" aria-hidden="true">${type === "success" ? "✓" : "⚠"}</span>
        <span class="auth-alert-text">${escapeHtml(message)}</span>
      `;
      alertBox.style.display = "flex";
      alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function hideLoginAlert() {
      if (alertBox) {
        alertBox.style.display = "none";
        alertBox.textContent = "";
      }
    }

    function setLoginFieldError(input, errorDivId, message) {
      if (input) {
        if (message) {
          input.classList.add("is-invalid");
          input.classList.remove("is-valid");
          input.setAttribute("aria-invalid", "true");
        } else {
          input.classList.remove("is-invalid");
          input.classList.add("is-valid");
          input.setAttribute("aria-invalid", "false");
        }
      }
      const errEl = document.getElementById(errorDivId);
      if (errEl) {
        errEl.textContent = message || "";
        errEl.classList.toggle("active", Boolean(message));
      }
    }

    function clearLoginFieldError(input, errorDivId) {
      setLoginFieldError(input, errorDivId, "");
    }

    // Input listeners for real-time validation & clear on edit
    if (emailInput) {
      emailInput.addEventListener("input", function() {
        if (this.value.trim()) {
          clearLoginFieldError(this, "login-email-error");
        }
      });
      emailInput.addEventListener("blur", function() {
        if (!this.value.trim()) {
          setLoginFieldError(this, "login-email-error", "Please enter your email.");
        } else {
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
          if (!emailRegex.test(this.value.trim().toLowerCase())) {
            setLoginFieldError(this, "login-email-error", "Please enter a valid email address.");
          } else {
            clearLoginFieldError(this, "login-email-error");
          }
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener("input", function() {
        if (this.value) {
          clearLoginFieldError(this, "login-password-error");
        }
      });
      passwordInput.addEventListener("blur", function() {
        if (!this.value) {
          setLoginFieldError(this, "login-password-error", "Please enter your password.");
        } else {
          clearLoginFieldError(this, "login-password-error");
        }
      });
    }

    // Optional Demo Credentials Fill Buttons (Academic / Demo testing helper)
    const btnFillAdmin = document.getElementById("btn-demo-admin");
    if (btnFillAdmin && emailInput && passwordInput) {
      btnFillAdmin.addEventListener("click", function() {
        emailInput.value = "admin@portfolio.com";
        passwordInput.value = "Admin123";
        clearLoginFieldError(emailInput, "login-email-error");
        clearLoginFieldError(passwordInput, "login-password-error");
        hideLoginAlert();
        passwordInput.focus();
      });
    }

    // Form submission listener
    loginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      hideLoginAlert();

      const email = emailInput ? emailInput.value : "";
      const password = passwordInput ? passwordInput.value : "";
      const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

      // Reset previous error classes
      if (emailInput) clearLoginFieldError(emailInput, "login-email-error");
      if (passwordInput) clearLoginFieldError(passwordInput, "login-password-error");

      // Validation 1: Required Email (Section 6, 24)
      if (!email || !email.trim()) {
        setLoginFieldError(emailInput, "login-email-error", "Please enter your email.");
        showLoginAlert("error", "Please enter your email.");
        if (emailInput) emailInput.focus();
        return;
      }

      // Validation 2: Email Format (Section 6, 24)
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(cleanEmail)) {
        setLoginFieldError(emailInput, "login-email-error", "Please enter a valid email address.");
        showLoginAlert("error", "Please enter a valid email address.");
        if (emailInput) emailInput.focus();
        return;
      }

      // Validation 3: Required Password (Section 6, 24)
      if (!password) {
        setLoginFieldError(passwordInput, "login-password-error", "Please enter your password.");
        showLoginAlert("error", "Please enter your password.");
        if (passwordInput) passwordInput.focus();
        return;
      }

      // Button loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `
          <span class="auth-btn-spinner" aria-hidden="true"></span>
          <span>Authenticating...</span>
        `;
      }

      try {
        const result = await window.PortfolioAuth.login({
          email: cleanEmail,
          password: password,
          rememberMe: rememberMe
        });

        if (result.success) {
          // Success Feedback (Section 30)
          showLoginAlert("success", result.message || "Login successful. Redirecting...");
          if (emailInput) emailInput.classList.add("is-valid");
          if (passwordInput) passwordInput.classList.add("is-valid");

          // Short delay before role-based redirection
          setTimeout(() => {
            window.location.href = result.redirectUrl;
          }, 800);
        } else {
          // Credential or Storage Error (Section 8, 24, 25)
          showLoginAlert("error", result.error || "Invalid email or password.");

          if (result.field === "email" && emailInput) {
            setLoginFieldError(emailInput, "login-email-error", result.error);
            emailInput.focus();
          } else if (result.field === "password" && passwordInput) {
            setLoginFieldError(passwordInput, "login-password-error", result.error);
            passwordInput.focus();
          } else {
            if (emailInput) emailInput.classList.add("is-invalid");
            if (passwordInput) passwordInput.classList.add("is-invalid");
          }

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalText || "<span>Login</span>";
          }
        }
      } catch (err) {
        console.error("[PortfolioAuth] Login error:", err);
        showLoginAlert("error", "An unexpected error occurred during login. Please try again.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalText || "<span>Login</span>";
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Universal Logout Button Handlers (Section 20)
     -------------------------------------------------------------------------- */
  const logoutButtons = document.querySelectorAll(".btn-logout, #logout-btn, #nav-logout-btn");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      const redirectTarget = this.getAttribute("data-redirect") || "../index.html";
      window.PortfolioAuth.logout(redirectTarget);
    });
  });

  /* --------------------------------------------------------------------------
     6. Auth Notice Checker (Section 18: Admin Permission Redirection Notice)
     -------------------------------------------------------------------------- */
  try {
    const authNotice = sessionStorage.getItem("portfolio_auth_notice");
    if (authNotice) {
      sessionStorage.removeItem("portfolio_auth_notice");
      const noticeBanner = document.getElementById("auth-guard-notice") || document.getElementById("auth-alert");
      if (noticeBanner) {
        noticeBanner.className = "auth-alert auth-alert-error";
        noticeBanner.innerHTML = `
          <span class="auth-alert-icon" aria-hidden="true">⚠</span>
          <span class="auth-alert-text">${escapeHtml(authNotice)}</span>
        `;
        noticeBanner.style.display = "flex";
      }
    }
  } catch (e) {}

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
