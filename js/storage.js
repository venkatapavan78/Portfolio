/**
 * ==========================================================================
 * Local Storage & State Management Utility
 * Portfolio Website - Module 1 (Section 20: Reusable Storage Preparation)
 * ==========================================================================
 * Provides a robust, safe abstraction for persistent client-side data,
 * collection manipulation helpers, schema contracts, and storage keys for
 * future modules (Registered Users, Current User/Session, User Roles, Projects,
 * Skills, Blogs, and Contact Messages).
 *
 * NOTE: This module strictly provides storage utilities. It contains NO fake
 * authentication or dashboard business logic.
 */

window.PortfolioStorage = (function() {
  "use strict";

  /* --------------------------------------------------------------------------
     1. Storage Keys Contract (Single Source of Truth)
     -------------------------------------------------------------------------- */
  const STORAGE_KEYS = {
    THEME: "portfolio_theme_mode",      // UI Theme Preference (dark/light)
    USERS: "portfolio_users",           // Registered users collection
    CURRENT_USER: "portfolio_current_user", // Active logged-in user session
    SESSION: "portfolio_current_user",  // Alias for backward compatibility
    PROJECTS: "portfolio_projects",     // Projects collection (Admin CRUD)
    SKILLS: "portfolio_skills",         // Technical skills collection (Admin CRUD)
    BLOGS: "portfolio_blogs",           // Blog articles collection (Admin CRUD)
    MESSAGES: "portfolio_messages"      // Contact messages inquiries (Admin review)
  };

  /* --------------------------------------------------------------------------
     2. Schema Blueprints (Architectural Reference for Future Modules)
     -------------------------------------------------------------------------- */
  const SCHEMAS = {
    USER: {
      id: "",              // e.g. "usr_1710000000000"
      name: "",
      email: "",
      role: "USER",        // "ADMIN" | "USER"
      createdAt: ""
    },
    SESSION: {
      user: null,          // User profile object or null
      role: "GUEST",       // "ADMIN" | "USER" | "GUEST"
      token: "",
      loginTime: ""
    },
    PROJECT: {
      id: "",
      title: "",
      description: "",
      category: "",        // e.g. "Full Stack", "Frontend", "Backend"
      tags: [],
      liveUrl: "",
      githubUrl: "",
      image: "",
      featured: false,
      createdAt: ""
    },
    SKILL: {
      id: "",
      name: "",
      level: 0,            // 0 - 100 percentage
      category: "",        // "frontend" | "backend" | "devops" | "languages"
      icon: ""
    },
    BLOG: {
      id: "",
      title: "",
      excerpt: "",
      content: "",
      category: "",
      readTime: "",
      date: "",
      published: true
    },
    MESSAGE: {
      id: "",              // e.g. "msg_1710000000000"
      name: "",
      email: "",
      subject: "",
      message: "",
      createdAt: "",
      read: false
    }
  };

  /* --------------------------------------------------------------------------
     3. Availability Check & In-Memory Fallback
     -------------------------------------------------------------------------- */
  let memoryStore = {};

  function isAvailable() {
    try {
      const test = "__portfolio_storage_test__";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  const supported = isAvailable();

  /* --------------------------------------------------------------------------
     4. Generic Key-Value Primitives
     -------------------------------------------------------------------------- */
  function getItem(key, defaultValue = null) {
    if (supported) {
      try {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : defaultValue;
      } catch (e) {
        console.warn(`[PortfolioStorage] getItem error for "${key}":`, e);
        return defaultValue;
      }
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : defaultValue;
  }

  function setItem(key, value) {
    if (supported) {
      try {
        window.localStorage.setItem(key, String(value));
        return true;
      } catch (e) {
        console.error(`[PortfolioStorage] setItem error for "${key}":`, e);
        return false;
      }
    }
    memoryStore[key] = String(value);
    return true;
  }

  function removeItem(key) {
    if (supported) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error(`[PortfolioStorage] removeItem error for "${key}":`, e);
        return false;
      }
    }
    delete memoryStore[key];
    return true;
  }

  function hasItem(key) {
    return getItem(key) !== null;
  }

  function clearPortfolioData(excludeTheme = true) {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(k => {
      if (excludeTheme && k === STORAGE_KEYS.THEME) return;
      removeItem(k);
    });
    return true;
  }

  /* --------------------------------------------------------------------------
     5. Safe JSON Serialization Helpers
     -------------------------------------------------------------------------- */
  function getJSON(key, defaultValue = null) {
    const raw = getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[PortfolioStorage] Failed to parse JSON for "${key}"`, e);
      return defaultValue;
    }
  }

  function setJSON(key, value) {
    try {
      const serialized = JSON.stringify(value);
      return setItem(key, serialized);
    } catch (e) {
      console.error(`[PortfolioStorage] Failed to stringify JSON for "${key}"`, e);
      return false;
    }
  }

  /* --------------------------------------------------------------------------
     6. Collection Helpers (Genuinely Reusable for Future Modules)
     --------------------------------------------------------------------------
     The future application will manage multiple entity arrays:
     - Registered users (`STORAGE_KEYS.USERS`)
     - Projects (`STORAGE_KEYS.PROJECTS`)
     - Skills (`STORAGE_KEYS.SKILLS`)
     - Blogs (`STORAGE_KEYS.BLOGS`)
     - Contact messages (`STORAGE_KEYS.MESSAGES`)
     These helpers eliminate code duplication and provide standard collection CRUD.
     -------------------------------------------------------------------------- */

  /**
   * Retrieve an array collection from storage safely.
   * Always returns an Array (empty array if not found or corrupted).
   * @param {string} key
   * @returns {Array}
   */
  function getCollection(key) {
    const data = getJSON(key, []);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Persist an array collection to storage.
   * @param {string} key
   * @param {Array} items
   * @returns {boolean}
   */
  function saveCollection(key, items) {
    if (!Array.isArray(items)) {
      console.warn(`[PortfolioStorage] saveCollection expected array for "${key}", received:`, typeof items);
      return false;
    }
    return setJSON(key, items);
  }

  /**
   * Append an item to an existing collection and save.
   * Generates a timestamp ID if none is provided.
   * @param {string} key
   * @param {Object} item
   * @returns {Object|null} The stored item or null on failure
   */
  function addToCollection(key, item) {
    if (!item || typeof item !== "object") return null;
    const collection = getCollection(key);
    const itemToStore = Object.assign({}, item);
    if (!itemToStore.id) {
      itemToStore.id = "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    }
    collection.push(itemToStore);
    const success = saveCollection(key, collection);
    return success ? itemToStore : null;
  }

  /**
   * Find an item in a collection by ID string or predicate function.
   * @param {string} key
   * @param {string|Function} predicateOrId
   * @returns {Object|null}
   */
  function findInCollection(key, predicateOrId) {
    const collection = getCollection(key);
    const predicate = typeof predicateOrId === "function"
      ? predicateOrId
      : (item => item && (item.id === predicateOrId || item._id === predicateOrId));

    return collection.find(predicate) || null;
  }

  /**
   * Update an item in a collection by ID or predicate function.
   * Supports partial updates via object merging or functional transforms.
   * @param {string} key
   * @param {string|Function} predicateOrId
   * @param {Object|Function} updaterOrData
   * @returns {boolean}
   */
  function updateInCollection(key, predicateOrId, updaterOrData) {
    const collection = getCollection(key);
    const predicate = typeof predicateOrId === "function"
      ? predicateOrId
      : (item => item && (item.id === predicateOrId || item._id === predicateOrId));

    const index = collection.findIndex(predicate);
    if (index === -1) return false;

    const currentItem = collection[index];
    let updatedItem;

    if (typeof updaterOrData === "function") {
      updatedItem = updaterOrData(currentItem);
    } else if (updaterOrData && typeof updaterOrData === "object") {
      updatedItem = Object.assign({}, currentItem, updaterOrData);
    } else {
      updatedItem = updaterOrData;
    }

    collection[index] = updatedItem;
    return saveCollection(key, collection);
  }

  /**
   * Remove an item from a collection by ID or predicate function.
   * @param {string} key
   * @param {string|Function} predicateOrId
   * @returns {boolean}
   */
  function removeFromCollection(key, predicateOrId) {
    const collection = getCollection(key);
    const predicate = typeof predicateOrId === "function"
      ? predicateOrId
      : (item => item && (item.id === predicateOrId || item._id === predicateOrId));

    const initialLength = collection.length;
    const filtered = collection.filter(item => !predicate(item));

    if (filtered.length === initialLength) return false;
    return saveCollection(key, filtered);
  }

  /**
   * Count total items in a collection.
   * @param {string} key
   * @returns {number}
   */
  function countCollection(key) {
    return getCollection(key).length;
  }

  /* --------------------------------------------------------------------------
     7. Theme Preference API
     -------------------------------------------------------------------------- */
  function getTheme() {
    const saved = getItem(STORAGE_KEYS.THEME);
    if (saved) return saved;

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark"; // Sleek dark mode by default
  }

  function setTheme(theme) {
    setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute("data-theme", theme);

    // Update accessible labels on all theme toggle controls
    const toggles = document.querySelectorAll(".theme-toggle");
    toggles.forEach(btn => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      btn.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
      btn.setAttribute("title", `Switch to ${nextTheme} mode`);
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || getTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
  }

  /* --------------------------------------------------------------------------
     8. User & Session Storage API (Module 2 Authentication Foundation)
     
     SECURITY DEMONSTRATION NOTE:
     "This Local Storage authentication is implemented for educational/demo
     purposes only. Production applications must use secure server-side
     authentication and must never store plaintext passwords in browser Local Storage."
     -------------------------------------------------------------------------- */

  /**
   * Retrieve all registered users array from localStorage (portfolio_users)
   * @returns {Array<Object>}
   */
  function getUsers() {
    return getCollection(STORAGE_KEYS.USERS);
  }

  /**
   * Persist entire registered users array to localStorage (portfolio_users)
   * @param {Array<Object>} users 
   * @returns {boolean}
   */
  function saveUsers(users) {
    return saveCollection(STORAGE_KEYS.USERS, users);
  }

  /**
   * Find an existing user by email (case-insensitive)
   * @param {string} email 
   * @returns {Object|null}
   */
  function findUserByEmail(email) {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    const users = getUsers();
    return users.find(u => u && u.email && u.email.toLowerCase() === normalized) || null;
  }

  /**
   * Add a new user to portfolio_users without overwriting existing users
   * Always reads existing users, parses array, appends user, and saves.
   * @param {Object} user 
   * @returns {Object|null} The stored user object or null if failed
   */
  function addUser(user) {
    if (!user || typeof user !== "object") return null;
    const users = getUsers();
    users.push(user);
    const success = saveUsers(users);
    return success ? user : null;
  }

  /**
   * Get current authenticated user profile
   * @returns {Object|null}
   */
  function getCurrentUser() {
    const raw = getJSON(STORAGE_KEYS.CURRENT_USER, null);
    if (!raw) return null;
    return raw.user ? raw.user : raw;
  }

  /**
   * Set current authenticated session user (Module 3 Login)
   * Stored under 'portfolio_current_user'.
   * Never stores the password.
   * @param {Object} user 
   * @returns {boolean}
   */
  function setCurrentUser(user) {
    if (!user) return false;
    const sessionUser = {
      id: user.id,
      fullName: user.fullName || user.name || "",
      email: user.email,
      role: user.role || "user",
      loginTime: new Date().toISOString()
    };
    return setJSON(STORAGE_KEYS.CURRENT_USER, sessionUser);
  }

  /**
   * Clear current user session
   * @returns {boolean}
   */
  function clearCurrentUser() {
    return removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  /**
   * Check if a user is currently logged in
   * @returns {boolean}
   */
  function isUserLoggedIn() {
    return getCurrentUser() !== null;
  }

  /**
   * Logout current user
   * @returns {boolean}
   */
  function logoutUser() {
    return clearCurrentUser();
  }

  /* --------------------------------------------------------------------------
     9. Projects Storage API (Module 4)
     Local Storage Key: portfolio_projects
     -------------------------------------------------------------------------- */
  function getProjects() {
    return getCollection(STORAGE_KEYS.PROJECTS);
  }

  function saveProjects(projects) {
    return saveCollection(STORAGE_KEYS.PROJECTS, projects);
  }

  function addProject(project) {
    if (!project || typeof project !== "object") return null;
    const item = Object.assign({}, project);
    if (!item.id) {
      item.id = "proj_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
    }
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    if (!Array.isArray(item.technologies)) {
      item.technologies = typeof item.technologies === "string"
        ? item.technologies.split(",").map(t => t.trim()).filter(Boolean)
        : [];
    }
    const projects = getProjects();
    projects.unshift(item); // Add newest first
    const success = saveProjects(projects);
    return success ? item : null;
  }

  function updateProject(id, updatedData) {
    if (!id || !updatedData) return false;
    const dataToUpdate = Object.assign({}, updatedData);
    if (dataToUpdate.technologies && !Array.isArray(dataToUpdate.technologies)) {
      dataToUpdate.technologies = typeof dataToUpdate.technologies === "string"
        ? dataToUpdate.technologies.split(",").map(t => t.trim()).filter(Boolean)
        : [];
    }
    return updateInCollection(STORAGE_KEYS.PROJECTS, id, dataToUpdate);
  }

  function deleteProject(id) {
    return removeFromCollection(STORAGE_KEYS.PROJECTS, id);
  }

  /* --------------------------------------------------------------------------
     10. Skills Storage API (Module 4)
     Local Storage Key: portfolio_skills
     -------------------------------------------------------------------------- */
  function getSkills() {
    return getCollection(STORAGE_KEYS.SKILLS);
  }

  function saveSkills(skills) {
    return saveCollection(STORAGE_KEYS.SKILLS, skills);
  }

  function addSkill(skill) {
    if (!skill || typeof skill !== "object") return null;
    const item = Object.assign({}, skill);
    if (!item.id) {
      item.id = "skill_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
    }
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    item.level = Math.min(100, Math.max(0, parseInt(item.level, 10) || 0));
    const skills = getSkills();
    skills.push(item);
    const success = saveSkills(skills);
    return success ? item : null;
  }

  function updateSkill(id, updatedData) {
    if (!id || !updatedData) return false;
    const dataToUpdate = Object.assign({}, updatedData);
    if (dataToUpdate.level !== undefined) {
      dataToUpdate.level = Math.min(100, Math.max(0, parseInt(dataToUpdate.level, 10) || 0));
    }
    return updateInCollection(STORAGE_KEYS.SKILLS, id, dataToUpdate);
  }

  function deleteSkill(id) {
    return removeFromCollection(STORAGE_KEYS.SKILLS, id);
  }

  /* --------------------------------------------------------------------------
     11. Blogs Storage API (Module 4)
     Local Storage Key: portfolio_blogs
     -------------------------------------------------------------------------- */
  function getBlogs() {
    return getCollection(STORAGE_KEYS.BLOGS);
  }

  function saveBlogs(blogs) {
    return saveCollection(STORAGE_KEYS.BLOGS, blogs);
  }

  function addBlog(blog) {
    if (!blog || typeof blog !== "object") return null;
    const item = Object.assign({}, blog);
    if (!item.id) {
      item.id = "blog_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
    }
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    if (item.published === undefined) {
      item.published = true;
    }
    const blogs = getBlogs();
    blogs.unshift(item); // Add newest first
    const success = saveBlogs(blogs);
    return success ? item : null;
  }

  function updateBlog(id, updatedData) {
    return updateInCollection(STORAGE_KEYS.BLOGS, id, updatedData);
  }

  function deleteBlog(id) {
    return removeFromCollection(STORAGE_KEYS.BLOGS, id);
  }

  /* --------------------------------------------------------------------------
     12. Controlled Sample Data Seeding (Section 39)
     Seeds sample projects, skills, and blogs ONLY IF their respective
     Local Storage arrays are completely empty. Never overwrites Admin data.
     -------------------------------------------------------------------------- */
  function seedInitialData() {
    if (!isAvailable()) return;

    // 1. Seed sample projects if empty (3 items)
    if (getProjects().length === 0) {
      const sampleProjects = [
        {
          id: "proj_demo_01",
          title: "Personal Portfolio Platform",
          description: "A responsive, accessible developer portfolio website built natively with HTML5, CSS3, and Vanilla JavaScript, featuring modular client-side state management.",
          technologies: ["HTML5", "CSS3", "JavaScript", "Local Storage", "WCAG 2.1"],
          image: "assets/images/project-placeholder.jpg",
          projectUrl: "https://example.com/portfolio-demo",
          githubUrl: "https://github.com/venkatapavan78/Portfolio",
          createdAt: "2026-09-20T10:00:00.000Z"
        },
        {
          id: "proj_demo_02",
          title: "Cloud Telemetry & Metrics Console",
          description: "High-performance enterprise monitoring interface displaying latency percentiles, system uptime graphs, and customizable threshold alert indicators.",
          technologies: ["JavaScript", "CSS Grid", "SVG Graphs", "WebSockets"],
          image: "assets/images/project-placeholder.jpg",
          projectUrl: "https://example.com/cloud-metrics",
          githubUrl: "https://github.com/example/cloud-metrics",
          createdAt: "2026-09-22T14:30:00.000Z"
        },
        {
          id: "proj_demo_03",
          title: "Developer Documentation Hub",
          description: "Technical reference catalog with instant client-side full-text search, keyboard accessibility navigation, and synchronized dark/light theming.",
          technologies: ["HTML5", "CSS3", "Vanilla JS", "Accessibility"],
          image: "assets/images/project-placeholder.jpg",
          projectUrl: "https://example.com/docs-hub",
          githubUrl: "https://github.com/example/docs-hub",
          createdAt: "2026-09-23T09:15:00.000Z"
        }
      ];
      saveProjects(sampleProjects);
      console.log("[PortfolioStorage] Sample projects initialized in Local Storage (portfolio_projects).");
    }

    // 2. Seed sample skills if empty (5 items)
    if (getSkills().length === 0) {
      const sampleSkills = [
        { id: "skill_demo_01", name: "JavaScript (ES6+)", category: "Programming", level: 92, createdAt: "2026-09-18T08:00:00.000Z" },
        { id: "skill_demo_02", name: "HTML5 Semantic Architecture", category: "Frontend", level: 95, createdAt: "2026-09-18T08:05:00.000Z" },
        { id: "skill_demo_03", name: "Modern CSS3 & Flexbox/Grid", category: "Frontend", level: 90, createdAt: "2026-09-18T08:10:00.000Z" },
        { id: "skill_demo_04", name: "Client State & Local Storage", category: "Architecture", level: 88, createdAt: "2026-09-18T08:15:00.000Z" },
        { id: "skill_demo_05", name: "Web Accessibility (WAI-ARIA)", category: "Engineering", level: 85, createdAt: "2026-09-18T08:20:00.000Z" }
      ];
      saveSkills(sampleSkills);
      console.log("[PortfolioStorage] Sample skills initialized in Local Storage (portfolio_skills).");
    }

    // 3. Seed sample blogs if empty (2 items)
    if (getBlogs().length === 0) {
      const sampleBlogs = [
        {
          id: "blog_demo_01",
          title: "Mastering Vanilla JavaScript Without Frameworks",
          excerpt: "How modern JavaScript primitives, DOM APIs, and CSS custom properties allow building lightning-fast web applications.",
          content: "In modern web development, frameworks often overshadow the raw capabilities of standard JavaScript. By mastering DOM event delegation, custom events, and persistent client state, software engineers can build maintainable and ultra-lightweight systems with zero compilation overhead.",
          category: "JavaScript",
          author: "Administrator",
          image: "assets/images/blog-placeholder.jpg",
          published: true,
          createdAt: "2026-09-21T11:00:00.000Z"
        },
        {
          id: "blog_demo_02",
          title: "Architecting Accessible Web Applications",
          excerpt: "A practical guide to implementing WAI-ARIA landmarks, keyboard trapping, and contrast compliance.",
          content: "Accessibility is not an afterthought—it is foundational software engineering. This article explores semantic HTML hierarchies, focus management in modal dialogs, and non-color-reliant visual feedback that ensure our web platforms welcome all users.",
          category: "Accessibility",
          author: "Administrator",
          image: "assets/images/blog-placeholder.jpg",
          published: true,
          createdAt: "2026-09-22T16:45:00.000Z"
        }
      ];
      saveBlogs(sampleBlogs);
      console.log("[PortfolioStorage] Sample blogs initialized in Local Storage (portfolio_blogs).");
    }
  }

  /* --------------------------------------------------------------------------
     Public Interface
     -------------------------------------------------------------------------- */
  return {
    STORAGE_KEYS: STORAGE_KEYS,
    SCHEMAS: SCHEMAS,
    isAvailable: isAvailable,
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    hasItem: hasItem,
    clearPortfolioData: clearPortfolioData,
    getJSON: getJSON,
    setJSON: setJSON,
    getCollection: getCollection,
    saveCollection: saveCollection,
    addToCollection: addToCollection,
    findInCollection: findInCollection,
    updateInCollection: updateInCollection,
    removeFromCollection: removeFromCollection,
    countCollection: countCollection,
    getTheme: getTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    // User & Session Storage API
    getUsers: getUsers,
    saveUsers: saveUsers,
    findUserByEmail: findUserByEmail,
    addUser: addUser,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    clearCurrentUser: clearCurrentUser,
    isUserLoggedIn: isUserLoggedIn,
    logoutUser: logoutUser,
    // Module 4: Projects CRUD API
    getProjects: getProjects,
    saveProjects: saveProjects,
    addProject: addProject,
    updateProject: updateProject,
    deleteProject: deleteProject,
    // Module 4: Skills CRUD API
    getSkills: getSkills,
    saveSkills: saveSkills,
    addSkill: addSkill,
    updateSkill: updateSkill,
    deleteSkill: deleteSkill,
    // Module 4: Blogs CRUD API
    getBlogs: getBlogs,
    saveBlogs: saveBlogs,
    addBlog: addBlog,
    updateBlog: updateBlog,
    deleteBlog: deleteBlog,
    // Module 4: Sample Data Seeding
    seedInitialData: seedInitialData
  };
})();

// Automatically seed sample data if collections are empty (Section 39)
if (window.PortfolioStorage && typeof window.PortfolioStorage.seedInitialData === "function") {
  window.PortfolioStorage.seedInitialData();
}
