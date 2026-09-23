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
    SESSION: "portfolio_session",       // Active session (user profile & role)
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
    toggleTheme: toggleTheme
  };
})();
