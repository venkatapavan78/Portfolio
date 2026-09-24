# Venkata Pavan - Personal Portfolio Website

> **This project is developed using only HTML, CSS, and Vanilla JavaScript.**

---

## 📖 Project Description

This project is a modern, high-performance, and fully responsive personal developer portfolio website designed for software engineers and full-stack developers. It provides an engaging public showcase of professional experience, technical skills, featured engineering projects, articles, and client contact channels.

The project is built with clean architecture, strict separation of concerns, WCAG 2.1 AA/AAA accessibility compliance, and persistent theme customization, serving as the foundational client application for an upcoming modular multi-tier portfolio platform.

---

## ⚡ Technologies Used

This project runs 100% natively in the browser without external frameworks, build tools, libraries, or CDNs:

- **HTML5**: Semantic document layout (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`), ARIA accessibility roles and landmarks, Schema.org JSON-LD structured metadata, and responsive viewport configuration.
- **CSS3 (Vanilla CSS)**: Custom design tokens (CSS variables for theming, typography, spacing, elevations, and radius), responsive layout via Flexbox and CSS Grid, fluid media queries, smooth transitions, glassmorphic backdrop filters, and light/dark theme modes.
- **Vanilla JavaScript (ES6+)**: Pure event-driven DOM manipulation, sticky header scroll detection, mobile navigation drawer with keyboard focus trapping, interactive project category filtering, client-side contact form validation, smooth scrolling, and safe Local Storage state management.

---

## 📦 Modules Status

### **Module 1: Project Foundation + Complete Public Home Page (Completed)**
Module 1 establishes the complete public-facing presentation and foundational architecture:
1. **Fixed / Sticky Navigation Bar**: Responsive navigation with brand monogram, section navigation links, theme toggle, authentication triggers, and mobile drawer with focus trapping.
2. **Hero Section**: Dynamic typewriter role cycling, call-to-actions, social links, and vector profile illustration.
3. **About Me Section**: Professional biography, engineering pillars, and experience/education timeline.
4. **Skills Section**: Categorized technical proficiency matrix with animated percentage indicators.
5. **Projects Section**: Interactive filterable project gallery with tech tags and repository links.
6. **Blog Preview Section**: Technical article cards displaying read times and excerpt previews.
7. **Achievements & Statistics Section**: Key milestone counters and credibility metrics.
8. **Contact Preview Section**: Direct contact channels and interactive validated contact form.
9. **Professional Footer**: Branded footer, quick links, social channels, and back-to-top button.
10. **State Management & Theming**: Local Storage utility (`PortfolioStorage`) with theme persistence.

### **Module 2: Signup + Local Storage Authentication Foundation (Completed)**

Module 2 implements complete client-side user registration, password strength analysis, and Local Storage data persistence:

1. **Signup Functionality (`pages/signup.html`)**:
   - Interactive user registration form featuring Full Name, Email, Password, Confirm Password, and Terms & Conditions checkbox.
   - Dynamic real-time password strength meter (**Weak**, **Medium**, **Strong**) and 4-rule requirements checklist.
   - Accessible keyboard-friendly Show/Hide password toggle buttons for both password inputs.
   - Real-time password confirmation match indicator.
   - Form submission validates input, prevents duplicate emails, persists the user into `localStorage`, and displays an accessible success message before redirecting to `login.html`.

2. **Local Storage Key**:
   - **Key**: `portfolio_users`
   - Stored value is an array of registered user objects.
   - Safe collection CRUD helpers in [`js/storage.js`](file:///c:/Users/pavan/OneDrive/Desktop/Portfolio/js/storage.js): `getUsers()`, `saveUsers()`, `findUserByEmail()`, `addUser()`.

3. **User Object Structure**:
   ```json
   {
     "id": "user_a1b2c3d4e5f6",
     "fullName": "Jane Doe",
     "email": "jane@example.com",
     "password": "Password123",
     "role": "user",
     "createdAt": "2026-09-24T06:30:00.000Z"
   }
   ```
   - `id`: Generated via `crypto.randomUUID()` with fallback.
   - `role`: Strictly assigned `"user"` as the default user role.
   - `email`: Normalized to lowercase before storage.

4. **Validation Rules & Error Messages**:
   - **Full Name**: Required, minimum 2 characters, cannot contain only spaces. Error: *"Please enter your full name."*
   - **Email**: Required, valid email format regex, lowercase normalization. Error: *"Please enter a valid email address."*
   - **Duplicate Email Prevention**: Checks existing `portfolio_users`. Error: *"An account with this email already exists. Please log in instead."*
   - **Password**: Minimum 8 characters, at least one uppercase letter (A-Z), at least one lowercase letter (a-z), and at least one number (0-9). Error: *"Password must contain at least 8 characters, including uppercase, lowercase, and a number."*
   - **Confirm Password**: Strict match (`password === confirmPassword`). Error: *"Passwords do not match."*
   - **Terms & Conditions**: Checkbox must be selected. Error: *"Please accept the Terms & Conditions."*

5. **Security Limitation Note**:
   > **Academic / Demonstration Purpose**: This application is a frontend-only project utilizing browser `localStorage`. Real-world production applications must use secure server-side authentication with cryptographic hashing and salt on a backend server, and must never store credentials directly in client-side Local Storage. Passwords are never transmitted over external networks.

6. **How to Test Registration**:
   - **Step 1**: Open `index.html` or directly open `pages/signup.html` in your web browser.
   - **Step 2**: Enter valid information (e.g. Full Name: `Alex Morgan`, Email: `alex@example.com`, Password: `Password123`, Confirm: `Password123`), check Terms & Conditions, and click **Create Account**.
   - **Step 3**: Verify the success alert appears (*"Account created successfully. Redirecting to login..."*) and redirects to `login.html`.
   - **Step 4**: Open browser DevTools (`F12` → `Application` / `Storage` → `Local Storage`), inspect `portfolio_users`, and verify the stored user array.
   - **Step 5**: Return to `pages/signup.html` and attempt to register again with `alex@example.com` to verify duplicate rejection.

### **Module 3: Login + Authentication Validation + ADMIN vs USER Routing (Completed)**

Module 3 connects registered users and the demonstration administrator to the interactive Login portal, creates authenticated sessions without sensitive data, enforces role-based routing (`ADMIN` vs `USER`), and establishes strict client-side authentication guards:

1. **Authentication Workflow**:
   ```
   START ──► Home Page (index.html)
     │
     ▼
   Login (pages/login.html)
     │
     ▼
   Enter Email + Password
     │
     ▼
   Validate Input (Format & Required fields)
     │
     ▼
   Read Users from Local Storage (`portfolio_users`)
     │
     ▼
   Find Matching User (Email normalized via trim().toLowerCase())
     │
     ▼
   Validate Password
     │
     ├──[Invalid] ──► Display: "Invalid email or password." (No account info leaked)
     │
     └──[Valid]   ──► Create Session (`portfolio_current_user`, strictly NO password)
                         │
                         ▼
                   Check User Role
                         │
                         ├──[role === "admin"] ──► Admin Dashboard (`admin-dashboard.html`)
                         │
                         └──[role === "user"]  ──► User Dashboard (`user-dashboard.html`)
   ```

2. **Login Page (`pages/login.html`)**:
   - Matches visual aesthetic and CSS theme of Signup and Home Page.
   - Proper HTML `<form id="loginForm">` with `#loginEmail` and `#loginPassword` inputs.
   - Fully keyboard-accessible Show/Hide password toggle button.
   - "Remember Me" checkbox (`#rememberMe`).
   - Clear validation messages for empty email (*"Please enter your email."*), invalid email format (*"Please enter a valid email address."*), empty password (*"Please enter your password."*), and invalid credentials (*"Invalid email or password."*).
   - Brief success notice (*"Login successful. Redirecting..."*) before smooth role-based redirection.

3. **Demonstration Admin Account (`initializeAdmin()`)**:
   - Predefined demonstration account seeded idempotently:
     - **Email**: `admin@portfolio.com`
     - **Password**: `Admin123`
     - **Role**: `admin`
     - **Label**: Academic / demonstration credentials only.
   - Stored within `portfolio_users`.
   - Initialized automatically once upon script startup; never creates duplicate admin records.
   - Public registration via `signup.html` strictly restricts all signups to `role: "user"`.

4. **Session / Current-User Object**:
   - **Key**: `portfolio_current_user`
   - **Critical Rule**: Passwords are **never** included in the session object.
   ```json
   {
     "id": "user_admin_01",
     "fullName": "System Administrator",
     "email": "admin@portfolio.com",
     "role": "admin",
     "loginTime": "2026-09-24T06:50:00.000Z"
   }
   ```

5. **Role-Based Routing & Authentication Guards**:
   - **Admin Dashboard (`pages/admin-dashboard.html`)**:
     - Guard: `PortfolioAuth.requireRole("admin")`.
     - If unauthenticated: immediately redirected to `login.html`.
     - If normal user (`role === "user"`): redirected to `user-dashboard.html` with warning (*"You do not have permission to access the Admin Dashboard."*).
     - Displays logged-in admin's name, role badge, email, and working Logout button.
   - **User Dashboard (`pages/user-dashboard.html`)**:
     - Guard: `PortfolioAuth.requireAuthentication()`.
     - If unauthenticated: immediately redirected to `login.html`.
     - Displays logged-in user's name, role badge, email, and working Logout button.

6. **Logout & Browser Back Button Protection**:
   - Logout utility (`PortfolioAuth.logout()`) clears `portfolio_current_user` and redirects to `../index.html`.
   - Protected dashboards verify the session immediately upon page execution, preventing unauthorized access even if navigated to via browser history/back buttons.

7. **Local Storage Keys Summary**:
   - `portfolio_users`: Array of registered accounts (including demo admin).
   - `portfolio_current_user`: Active authenticated session object (strictly no password).
   - `portfolio_theme_mode`: User dark/light UI preference.

8. **Security Limitations Notice**:
   > **Developer Notice**: This Local Storage authentication is for educational/demo purposes only. Browser-side authentication cannot provide production-level security. Real applications should use secure server-side authentication, password hashing, HTTPS, secure sessions/tokens, and appropriate authorization controls.

9. **Testing Instructions (All 12 Verification Scenarios)**:
   - **Test 1 — Valid User Login**: Register a user via `signup.html`. Login with matching credentials. Expected: `user-dashboard.html` opens.
   - **Test 2 — Incorrect Password**: Enter registered email with wrong password. Expected: *"Invalid email or password."*, no access.
   - **Test 3 — Unknown Email**: Enter non-existent email. Expected: *"Invalid email or password."* (email existence not leaked).
   - **Test 4 — Admin Login**: Login using demo admin (`admin@portfolio.com` / `Admin123`). Expected: `admin-dashboard.html` opens.
   - **Test 5 — User Attempts Admin URL**: Login as normal user, navigate directly to `admin-dashboard.html`. Expected: Access denied, redirected to `user-dashboard.html` with permission notice.
   - **Test 6 — Unauthenticated Admin URL**: Logout, navigate directly to `admin-dashboard.html`. Expected: Redirected to `login.html`.
   - **Test 7 — Unauthenticated User URL**: Logout, navigate directly to `user-dashboard.html`. Expected: Redirected to `login.html`.
   - **Test 8 — Logout**: Click Logout on any dashboard. Expected: `portfolio_current_user` is cleared, redirected to `index.html`.
   - **Test 9 — Refresh Dashboard**: Login and refresh page. Expected: Session persists and dashboard remains accessible.
   - **Test 10 — Multiple Users**: Register multiple accounts; each logs in to their respective profile independently.
   - **Test 11 — No Duplicate Admin**: Refresh application multiple times; check `portfolio_users` to confirm only one admin account exists.
   - **Test 12 — Browser Console**: Check DevTools console; zero uncaught JavaScript errors.

### **Module 4: Admin Dashboard + Content Management (Projects, Skills, Blogs CRUD) (Completed)**

Module 4 establishes an administrative console allowing authenticated administrators to create, preview, edit, search, and delete portfolio content stored natively in browser Local Storage:

1. **Admin Authorization Guard**:
   - Enforced via `PortfolioAuth.requireRole("admin")` on page load.
   - Unauthenticated requests are immediately bounced to `login.html`.
   - Normal users (`role: "user"`) attempting to access the Admin URL are redirected to `user-dashboard.html` with an access-denied alert.

2. **Single-Dashboard Navigation with Dynamic Sections**:
   - **Sidebar**: Dashboard, Projects, Skills, Blogs, Messages (Module 5 Reserved), Public Portfolio, and Logout.
   - Switching sections dynamically toggles `#dashboardSection`, `#projectsSection`, `#skillsSection`, `#blogsSection`, and `#messagesSection` without full page reloads.
   - Preserves deep links via URL hash (`#dashboard`, `#projects`, `#skills`, `#blogs`, `#messages`).

3. **Dynamic Dashboard Statistics**:
   - Calculates real-time totals from Local Storage:
     - **Total Projects**: `portfolio_projects.length`
     - **Total Skills**: `portfolio_skills.length`
     - **Total Blogs**: `portfolio_blogs.length`
   - Automatically re-computed whenever items are added, updated, or deleted.

4. **Projects CRUD Management**:
   - **Key**: `portfolio_projects`
   - **Schema**: `{ id, title, description, technologies: [], image, projectUrl, githubUrl, createdAt }`
   - **Form Validation**: Title (required), Description (required), Technologies (comma-separated, at least 1 required).
   - **Table & Card Display**: Shows thumbnail, title, description, technology pills, created date, and Edit/Delete actions.
   - **Live Search**: Real-time filtering by project title or technology tag.

5. **Skills CRUD Management**:
   - **Key**: `portfolio_skills`
   - **Schema**: `{ id, name, category, level: 0-100, createdAt }`
   - **Form Validation**: Name (required), Category (required), Level slider (0–100%) with real-time percentage display.
   - **Visual Progress Bar**: Dynamic progress bar fill calculated directly from the stored level.
   - **Live Search**: Instant filtering by skill name or category.

6. **Blogs CRUD Management**:
   - **Key**: `portfolio_blogs`
   - **Schema**: `{ id, title, excerpt, content, category, author, image, published: true|false, createdAt }`
   - **Form Validation**: Title (required), Excerpt (required), Content (required), Category (required), Published checkbox.
   - **Badges**: Visual status indicators (**Published** in green / **Draft** in amber).
   - **Live Search**: Dynamic filtering by article title, category, or excerpt.

7. **Data Safety & Isolation**:
   - Each collection operates on its own dedicated Local Storage key.
   - Adding, modifying, or deleting a project never touches or overwrites users, current session, skills, or blogs.

8. **Sample Data Seeding (`seedInitialData()`)**:
   - Seeds initial demonstration items (3 projects, 5 skills, 2 blogs) **only if** each respective Local Storage array is empty.
   - Never overwrites or duplicates Admin-created data across page refreshes.

9. **Modals, Toasts & Accessibility**:
   - Keyboard accessible modal dialogs with close buttons, backdrop click dismissal, and <kbd>Escape</kbd> key handlers.
   - Confirmation dialogs for all delete actions to prevent accidental removal.
   - Accessible floating toast notification banner (`aria-live="polite"`) with automatic dismissal.

---

## 📁 Folder Structure

```
portfolio-website/
│
├── index.html                  # Main entry point & comprehensive public Home Page
├── README.md                   # Project documentation, specifications & roadmap
│
├── css/                        # Modular Vanilla CSS stylesheets
│   ├── style.css               # Design system tokens, typography, layout, components, and animations
│   ├── responsive.css          # Responsive breakpoints, media queries, and mobile drawer styles
│   ├── auth.css                # Authentication forms and user portal styles
│   └── dashboard.css           # Admin console layout, sidebar, modals, data tables, and toast notifications
│
├── js/                         # Modular Vanilla JavaScript files
│   ├── main.js                 # UI controllers, typewriter, filter tabs, contact form validation, hydration hooks
│   ├── storage.js              # Centralized Local Storage utility, safe JSON helpers, and collection CRUD
│   ├── auth.js                 # Authentication interfaces, role validation (ADMIN/USER), and routing helpers
│   └── admin.js                # Admin dashboard controller, Projects/Skills/Blogs CRUD, search, and modals
│
├── pages/                      # Multi-page views
│   ├── login.html              # User login interface
│   ├── signup.html             # User registration interface
│   ├── admin-dashboard.html    # Full Admin management console (Projects, Skills, Blogs CRUD)
│   └── user-dashboard.html     # User workspace portal (Profile, Saved Projects, Inquiries)
│
└── assets/                     # Static assets and media placeholders
    ├── images/                 # SVG vector mockups & profile placeholder
    └── icons/                  # Custom icon assets (.gitkeep)
```

---

## 🚀 How to Run the Project

No web servers, package managers, compilers, or build steps are required.

1. Clone or download the repository to your local machine:
   ```bash
   git clone https://github.com/venkatapavan78/Portfolio.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Portfolio
   ```
3. Open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Brave, Opera):
   - **Windows**: Double-click `index.html` or run `start index.html` in PowerShell/Command Prompt.
   - **macOS**: Run `open index.html` in Terminal.
   - **Linux**: Run `xdg-open index.html` in Terminal.

The application loads instantly via the `file:///` protocol.

---

## 🔮 Future Modules Roadmap

The application architecture has been designed so that future features can be integrated sequentially:

```
START
  │
  ▼
Home Page (index.html) ◄── [Module 1: Complete Public Presentation]
  │
  ▼
Signup / Login (pages/signup.html & pages/login.html) ◄── [Module 2]
  │
  ▼
Local Storage Authentication (portfolio_users, portfolio_session) ◄── [Module 2]
  │
  ▼
Role Validation (ADMIN vs USER) ◄── [Module 2]
  │
  ├──► [ADMIN Role] ──► Admin Dashboard (pages/admin-dashboard.html) ◄── [Module 4]
  │                            │
  │                            ├──► Projects CRUD (portfolio_projects)
  │                            ├──► Skills CRUD (portfolio_skills)
  │                            ├──► Blogs CRUD (portfolio_blogs)
  │                            └──► Admin ──► Messages Inbox (portfolio_messages) ◄── [Module 5]
  │                                                  ▲
  │                                                  │ (Contact Inquiries)
  │                                                  │
  └──► [USER Role]  ──► User Dashboard (pages/user-dashboard.html) ◄── [Module 3]
                               │
                               ├──► Bookmarked Projects
                               └──► Collaboration Inquiries
                                      │
                                      ▼
                                Public Portfolio (index.html) ◄── [Dynamic Local Storage Hydration]
                                      │
                                      ▼
                                Contact Form (Submits to portfolio_messages)
                                      │
                                      ▼
                                Admin ──► Messages Review
```

### Completed & Planned Modules Overview:

- **Module 1: Project Foundation + Complete Public Home Page (Completed)**
- **Module 2: Signup + Local Storage Authentication Foundation (Completed)**
- **Module 3: Login + Authentication Validation + ADMIN vs USER Routing (Completed)**
- **Module 4: Admin Dashboard + Content Management (Projects, Skills, Blogs CRUD) (Completed)**
  - Full Create, Read, Update, Delete (CRUD) operations for Featured Projects (`portfolio_projects`).
  - Technical skills catalog and dynamic proficiency level management (`portfolio_skills`).
  - Editorial markdown blog authoring, drafting, and publication (`portfolio_blogs`).
  - Real-time statistics, live search filtering, responsive modal dialogs, and toast notifications.
- **Module 5: Dynamic Public Portfolio Integration (Next Recommended Module)**
  - Automatic dynamic hydration of public portfolio pages (`index.html`) from Local Storage (`portfolio_projects`, `portfolio_skills`, `portfolio_blogs`) with static fallback.
  - Contact form integration syncing client inquiries into `portfolio_messages`.
  - Admin inbox for reviewing, filtering, marking as read, and managing inquiries sent via the Contact Form.
