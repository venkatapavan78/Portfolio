/**
 * ==========================================================================
 * Admin Dashboard Controller
 * Portfolio Website - Module 4: Admin Dashboard + Content Management
 * ==========================================================================
 * Provides complete CRUD management for Projects, Skills, and Blogs,
 * real-time statistics calculation, live search filtering, responsive modals,
 * and strict admin authorization enforcement.
 */

(function() {
  "use strict";

  /* --------------------------------------------------------------------------
     1. Admin Authorization Guard (Module 3 & 4 - Section 6, 43)
     -------------------------------------------------------------------------- */
  let currentAdmin = null;
  if (window.PortfolioAuth) {
    currentAdmin = window.PortfolioAuth.requireRole("admin", "user-dashboard.html", "login.html");
    if (!currentAdmin) {
      return; // Execution stops immediately if unauthorized or unauthenticated
    }
  }

  /* --------------------------------------------------------------------------
     2. Controller State
     -------------------------------------------------------------------------- */
  const state = {
    activeSection: "dashboard",
    editingProjectId: null,
    editingSkillId: null,
    editingBlogId: null,
    deletingType: null, // "project" | "skill" | "blog"
    deletingId: null,
    deletingTitle: ""
  };

  /* --------------------------------------------------------------------------
     3. DOM Ready Initialization
     -------------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function() {
    // Ensure sample data is initialized if collections are empty (Section 39)
    if (window.PortfolioStorage && typeof window.PortfolioStorage.seedInitialData === "function") {
      window.PortfolioStorage.seedInitialData();
    }

    // 1. Populate Admin Header & Profile Banner
    renderAdminProfile();

    // 2. Setup Navigation Section Switching
    setupNavigation();

    // 3. Render Dashboard Summary Statistics
    renderStats();

    // 4. Initialize Projects Management
    initProjectsSection();

    // 5. Initialize Skills Management
    initSkillsSection();

    // 6. Initialize Blogs Management
    initBlogsSection();

    // 7. Setup Modal Handlers & Keyboard Shortcuts
    setupModalSystem();

    // 8. Mobile Sidebar Drawer Toggle
    setupMobileSidebar();

    // 9. Synchronize Theme Toggle
    setupThemeToggle();

    // 10. Check URL Hash (e.g. #projects, #skills, #blogs)
    handleInitialHash();
  });

  /* --------------------------------------------------------------------------
     4. Admin Profile & Header
     -------------------------------------------------------------------------- */
  function renderAdminProfile() {
    const admin = currentAdmin || (window.PortfolioAuth ? window.PortfolioAuth.getCurrentUser() : null);
    if (!admin) return;

    const name = admin.fullName || "Administrator";
    const role = (admin.role || "admin").toUpperCase();

    // Header greeting
    const greetingEl = document.getElementById("admin-header-greeting");
    if (greetingEl) greetingEl.textContent = `Welcome back, ${name}`;

    // Sidebar & Profile chips
    const chipNameEl = document.getElementById("admin-chip-name");
    if (chipNameEl) chipNameEl.textContent = name;

    const chipRoleEl = document.getElementById("admin-chip-role");
    if (chipRoleEl) chipRoleEl.textContent = `ROLE: ${role}`;

    // Avatar initials
    const initials = name
      .split(" ")
      .map(part => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    document.querySelectorAll(".admin-avatar-initials").forEach(el => {
      el.textContent = initials || "AD";
    });
  }

  /* --------------------------------------------------------------------------
     5. Navigation & Single-Dashboard Section Switching (Section 31)
     -------------------------------------------------------------------------- */
  function setupNavigation() {
    const navItems = document.querySelectorAll(".admin-nav-item[data-section]");
    navItems.forEach(item => {
      item.addEventListener("click", function(e) {
        e.preventDefault();
        const targetSection = this.getAttribute("data-section");
        if (targetSection) {
          switchSection(targetSection);
        }
      });
    });

    // Quick action cards in dashboard home
    document.querySelectorAll("[data-navigate]").forEach(btn => {
      btn.addEventListener("click", function(e) {
        e.preventDefault();
        const targetSection = this.getAttribute("data-navigate");
        if (targetSection) switchSection(targetSection);
      });
    });
  }

  function switchSection(sectionId) {
    state.activeSection = sectionId;

    // Update Sidebar Active Class
    document.querySelectorAll(".admin-nav-item").forEach(item => {
      const sec = item.getAttribute("data-section");
      item.classList.toggle("active", sec === sectionId);
    });

    // Show Target Section, Hide Others
    document.querySelectorAll(".admin-section").forEach(sec => {
      sec.classList.remove("active");
    });
    const targetEl = document.getElementById(sectionId + "Section");
    if (targetEl) {
      targetEl.classList.add("active");
    }

    // Update Topbar Breadcrumb
    const breadcrumbEl = document.getElementById("admin-breadcrumb-current");
    if (breadcrumbEl) {
      const titles = {
        dashboard: "Dashboard Overview",
        projects: "Projects Management",
        skills: "Skills Management",
        blogs: "Blog Articles Management",
        messages: "Messages Inbox"
      };
      breadcrumbEl.textContent = titles[sectionId] || "Dashboard";
    }

    // Update URL hash without causing a page jump
    if (history.replaceState) {
      history.replaceState(null, null, `#${sectionId}`);
    }

    // Close mobile sidebar if open
    const sidebar = document.querySelector(".admin-sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");

    // Refresh statistics when returning to dashboard
    if (sectionId === "dashboard") {
      renderStats();
    }
  }

  function handleInitialHash() {
    const hash = window.location.hash.replace("#", "").trim().toLowerCase();
    if (hash && ["dashboard", "projects", "skills", "blogs", "messages"].includes(hash)) {
      switchSection(hash);
    } else {
      switchSection("dashboard");
    }
  }

  /* --------------------------------------------------------------------------
     6. Dynamic Statistics Calculator (Section 5, 41)
     -------------------------------------------------------------------------- */
  function renderStats() {
    if (!window.PortfolioStorage) return;

    const projectsCount = window.PortfolioStorage.getProjects().length;
    const skillsCount = window.PortfolioStorage.getSkills().length;
    const blogsCount = window.PortfolioStorage.getBlogs().length;

    // Update Summary Card Numbers
    const statProjects = document.getElementById("stat-total-projects");
    if (statProjects) statProjects.textContent = projectsCount;

    const statSkills = document.getElementById("stat-total-skills");
    if (statSkills) statSkills.textContent = skillsCount;

    const statBlogs = document.getElementById("stat-total-blogs");
    if (statBlogs) statBlogs.textContent = blogsCount;

    // Update Sidebar Badges
    const badgeProjects = document.getElementById("nav-badge-projects");
    if (badgeProjects) badgeProjects.textContent = projectsCount;

    const badgeSkills = document.getElementById("nav-badge-skills");
    if (badgeSkills) badgeSkills.textContent = skillsCount;

    const badgeBlogs = document.getElementById("nav-badge-blogs");
    if (badgeBlogs) badgeBlogs.textContent = blogsCount;
  }

  /* --------------------------------------------------------------------------
     7. PROJECTS MANAGEMENT (Section 7, 8, 9, 10, 11, 12, 13)
     -------------------------------------------------------------------------- */
  function initProjectsSection() {
    renderProjects();

    // Live Search
    const searchInput = document.getElementById("projects-search-input");
    const clearBtn = document.getElementById("projects-search-clear");

    if (searchInput) {
      searchInput.addEventListener("input", function() {
        const query = this.value.trim();
        renderProjects(query);
        if (clearBtn) clearBtn.classList.toggle("active", query.length > 0);
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", function() {
        searchInput.value = "";
        renderProjects();
        clearBtn.classList.remove("active");
        searchInput.focus();
      });
    }

    // Add Project Modal Trigger
    const addBtn = document.getElementById("btn-add-project");
    if (addBtn) {
      addBtn.addEventListener("click", function() {
        openProjectModal(null);
      });
    }

    // Project Form Submit Handler
    const projectForm = document.getElementById("project-modal-form");
    if (projectForm) {
      projectForm.addEventListener("submit", handleProjectFormSubmit);
    }
  }

  function renderProjects(query = "") {
    const tableBody = document.getElementById("projects-table-body");
    const emptyState = document.getElementById("projects-empty-state");
    const countEl = document.getElementById("projects-count-indicator");
    if (!tableBody || !window.PortfolioStorage) return;

    let projects = window.PortfolioStorage.getProjects();

    // Filter by query (title or technologies)
    if (query) {
      const q = query.toLowerCase();
      projects = projects.filter(p => {
        const titleMatch = p.title && p.title.toLowerCase().includes(q);
        const descMatch = p.description && p.description.toLowerCase().includes(q);
        const techMatch = Array.isArray(p.technologies) && p.technologies.some(t => t.toLowerCase().includes(q));
        return titleMatch || descMatch || techMatch;
      });
    }

    if (countEl) {
      countEl.textContent = `Showing ${projects.length} project${projects.length === 1 ? "" : "s"}`;
    }

    if (projects.length === 0) {
      tableBody.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    let html = "";
    projects.forEach(p => {
      const techs = Array.isArray(p.technologies) ? p.technologies : [];
      const techHtml = techs.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("");
      const dateFormatted = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—";
      const imageSrc = p.image || "assets/images/project-placeholder.jpg";

      html += `
        <tr data-project-id="${escapeHtml(p.id)}">
          <td>
            <img class="table-thumb" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(p.title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%231e293b\\'/><text x=\\'50%\\' y=\\'55%\\' fill=\\'%2364748b\\' text-anchor=\\'middle\\' font-size=\\'12\\'>No Image</text></svg>'">
          </td>
          <td>
            <div class="table-title">${escapeHtml(p.title)}</div>
            <div class="table-desc" title="${escapeHtml(p.description)}">${escapeHtml(p.description)}</div>
          </td>
          <td>
            <div class="tech-tags-list">${techHtml || '<span class="text-muted">—</span>'}</div>
          </td>
          <td>
            <span class="table-date">${dateFormatted}</span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-action btn-action-edit" data-edit-project="${escapeHtml(p.id)}" aria-label="Edit project ${escapeHtml(p.title)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </button>
              <button type="button" class="btn-action btn-action-delete" data-delete-project="${escapeHtml(p.id)}" data-title="${escapeHtml(p.title)}" aria-label="Delete project ${escapeHtml(p.title)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    // Attach Event Listeners to Edit and Delete buttons
    tableBody.querySelectorAll("[data-edit-project]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.getAttribute("data-edit-project");
        openProjectModal(id);
      });
    });

    tableBody.querySelectorAll("[data-delete-project]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.getAttribute("data-delete-project");
        const title = this.getAttribute("data-title") || "Project";
        promptDelete("project", id, title);
      });
    });
  }

  function openProjectModal(projectId = null) {
    state.editingProjectId = projectId;
    const modalTitle = document.getElementById("project-modal-title");
    const form = document.getElementById("project-modal-form");
    if (!form) return;

    form.reset();
    clearModalErrors(form);

    if (projectId) {
      if (modalTitle) modalTitle.textContent = "Edit Project";
      const project = window.PortfolioStorage.findInCollection(
        window.PortfolioStorage.STORAGE_KEYS.PROJECTS,
        projectId
      );
      if (project) {
        document.getElementById("project-title-input").value = project.title || "";
        document.getElementById("project-desc-input").value = project.description || "";
        document.getElementById("project-tech-input").value = Array.isArray(project.technologies) ? project.technologies.join(", ") : "";
        document.getElementById("project-image-input").value = project.image || "";
        document.getElementById("project-live-input").value = project.projectUrl || "";
        document.getElementById("project-github-input").value = project.githubUrl || "";
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Add New Project";
      document.getElementById("project-image-input").value = "assets/images/project-placeholder.jpg";
    }

    openModal("project-modal");
  }

  function handleProjectFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearModalErrors(form);

    const title = document.getElementById("project-title-input").value.trim();
    const description = document.getElementById("project-desc-input").value.trim();
    const techRaw = document.getElementById("project-tech-input").value.trim();
    const image = document.getElementById("project-image-input").value.trim();
    const projectUrl = document.getElementById("project-live-input").value.trim();
    const githubUrl = document.getElementById("project-github-input").value.trim();

    // Validation (Section 10)
    let hasError = false;
    if (!title) {
      showModalFieldError("project-title-input", "Project title is required.");
      hasError = true;
    }
    if (!description) {
      showModalFieldError("project-desc-input", "Project description is required.");
      hasError = true;
    }
    const technologies = techRaw.split(",").map(t => t.trim()).filter(Boolean);
    if (technologies.length === 0) {
      showModalFieldError("project-tech-input", "Please specify at least one technology (e.g. HTML, CSS, JavaScript).");
      hasError = true;
    }

    if (hasError) return;

    const payload = {
      title: title,
      description: description,
      technologies: technologies,
      image: image || "assets/images/project-placeholder.jpg",
      projectUrl: projectUrl || "#",
      githubUrl: githubUrl || "#"
    };

    if (state.editingProjectId) {
      // Edit existing project (Section 12)
      const updated = window.PortfolioStorage.updateProject(state.editingProjectId, payload);
      if (updated) {
        showToast("success", `Project "${title}" updated successfully.`);
      } else {
        showToast("error", "Failed to update project. Please try again.");
      }
    } else {
      // Add new project (Section 9)
      const created = window.PortfolioStorage.addProject(payload);
      if (created) {
        showToast("success", `Project "${title}" added successfully.`);
      } else {
        showToast("error", "Failed to add project. Please try again.");
      }
    }

    closeModal("project-modal");
    renderProjects();
    renderStats();
  }

  /* --------------------------------------------------------------------------
     8. SKILLS MANAGEMENT (Section 14, 15, 16, 17, 18, 19, 20)
     -------------------------------------------------------------------------- */
  function initSkillsSection() {
    renderSkills();

    // Range input live percentage synchronization
    const rangeInput = document.getElementById("skill-level-input");
    const rangeDisplay = document.getElementById("skill-level-display");
    if (rangeInput && rangeDisplay) {
      rangeInput.addEventListener("input", function() {
        rangeDisplay.textContent = `${this.value}%`;
      });
    }

    // Live Search
    const searchInput = document.getElementById("skills-search-input");
    const clearBtn = document.getElementById("skills-search-clear");
    if (searchInput) {
      searchInput.addEventListener("input", function() {
        const query = this.value.trim();
        renderSkills(query);
        if (clearBtn) clearBtn.classList.toggle("active", query.length > 0);
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", function() {
        searchInput.value = "";
        renderSkills();
        clearBtn.classList.remove("active");
        searchInput.focus();
      });
    }

    // Add Skill Trigger
    const addBtn = document.getElementById("btn-add-skill");
    if (addBtn) {
      addBtn.addEventListener("click", function() {
        openSkillModal(null);
      });
    }

    // Skill Form Submit Handler
    const skillForm = document.getElementById("skill-modal-form");
    if (skillForm) {
      skillForm.addEventListener("submit", handleSkillFormSubmit);
    }
  }

  function renderSkills(query = "") {
    const tableBody = document.getElementById("skills-table-body");
    const emptyState = document.getElementById("skills-empty-state");
    const countEl = document.getElementById("skills-count-indicator");
    if (!tableBody || !window.PortfolioStorage) return;

    let skills = window.PortfolioStorage.getSkills();

    if (query) {
      const q = query.toLowerCase();
      skills = skills.filter(s => {
        const nameMatch = s.name && s.name.toLowerCase().includes(q);
        const catMatch = s.category && s.category.toLowerCase().includes(q);
        return nameMatch || catMatch;
      });
    }

    if (countEl) {
      countEl.textContent = `Showing ${skills.length} skill${skills.length === 1 ? "" : "s"}`;
    }

    if (skills.length === 0) {
      tableBody.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    let html = "";
    skills.forEach(s => {
      const lvl = Math.min(100, Math.max(0, parseInt(s.level, 10) || 0));
      const dateFormatted = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—";

      html += `
        <tr data-skill-id="${escapeHtml(s.id)}">
          <td>
            <div class="table-title">${escapeHtml(s.name)}</div>
          </td>
          <td>
            <span class="category-pill">${escapeHtml(s.category || "General")}</span>
          </td>
          <td>
            <div>
              <span class="skill-level-text">${lvl}%</span>
              <div class="skill-bar-compact" aria-label="${escapeHtml(s.name)} level ${lvl}%">
                <div class="skill-bar-fill-compact" style="width: ${lvl}%;"></div>
              </div>
            </div>
          </td>
          <td>
            <span class="table-date">${dateFormatted}</span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-action btn-action-edit" data-edit-skill="${escapeHtml(s.id)}" aria-label="Edit skill ${escapeHtml(s.name)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </button>
              <button type="button" class="btn-action btn-action-delete" data-delete-skill="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" aria-label="Delete skill ${escapeHtml(s.name)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    tableBody.querySelectorAll("[data-edit-skill]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.getAttribute("data-edit-skill");
        openSkillModal(id);
      });
    });

    tableBody.querySelectorAll("[data-delete-skill]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.getAttribute("data-delete-skill");
        const name = this.getAttribute("data-name") || "Skill";
        promptDelete("skill", id, name);
      });
    });
  }

  function openSkillModal(skillId = null) {
    state.editingSkillId = skillId;
    const modalTitle = document.getElementById("skill-modal-title");
    const form = document.getElementById("skill-modal-form");
    const rangeInput = document.getElementById("skill-level-input");
    const rangeDisplay = document.getElementById("skill-level-display");
    if (!form) return;

    form.reset();
    clearModalErrors(form);

    if (skillId) {
      if (modalTitle) modalTitle.textContent = "Edit Skill";
      const skill = window.PortfolioStorage.findInCollection(
        window.PortfolioStorage.STORAGE_KEYS.SKILLS,
        skillId
      );
      if (skill) {
        document.getElementById("skill-name-input").value = skill.name || "";
        document.getElementById("skill-category-input").value = skill.category || "Programming";
        const lvl = parseInt(skill.level, 10) || 50;
        if (rangeInput) rangeInput.value = lvl;
        if (rangeDisplay) rangeDisplay.textContent = `${lvl}%`;
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Add New Skill";
      if (rangeInput) rangeInput.value = 80;
      if (rangeDisplay) rangeDisplay.textContent = "80%";
    }

    openModal("skill-modal");
  }

  function handleSkillFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearModalErrors(form);

    const name = document.getElementById("skill-name-input").value.trim();
    const category = document.getElementById("skill-category-input").value.trim();
    const levelVal = parseInt(document.getElementById("skill-level-input").value, 10) || 0;

    let hasError = false;
    if (!name) {
      showModalFieldError("skill-name-input", "Skill name is required.");
      hasError = true;
    }
    if (!category) {
      showModalFieldError("skill-category-input", "Skill category is required.");
      hasError = true;
    }
    if (isNaN(levelVal) || levelVal < 0 || levelVal > 100) {
      showModalFieldError("skill-level-input", "Skill level must be between 0 and 100.");
      hasError = true;
    }

    if (hasError) return;

    const payload = {
      name: name,
      category: category,
      level: levelVal
    };

    if (state.editingSkillId) {
      const updated = window.PortfolioStorage.updateSkill(state.editingSkillId, payload);
      if (updated) {
        showToast("success", `Skill "${name}" updated successfully.`);
      } else {
        showToast("error", "Failed to update skill.");
      }
    } else {
      const created = window.PortfolioStorage.addSkill(payload);
      if (created) {
        showToast("success", `Skill "${name}" added successfully.`);
      } else {
        showToast("error", "Failed to add skill.");
      }
    }

    closeModal("skill-modal");
    renderSkills();
    renderStats();
  }

  /* --------------------------------------------------------------------------
     9. BLOGS MANAGEMENT (Section 21, 22, 23, 24, 25, 26, 27)
     -------------------------------------------------------------------------- */
  function initBlogsSection() {
    renderBlogs();

    // Live Search
    const searchInput = document.getElementById("blogs-search-input");
    const clearBtn = document.getElementById("blogs-search-clear");
    if (searchInput) {
      searchInput.addEventListener("input", function() {
        const query = this.value.trim();
        renderBlogs(query);
        if (clearBtn) clearBtn.classList.toggle("active", query.length > 0);
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", function() {
        searchInput.value = "";
        renderBlogs();
        clearBtn.classList.remove("active");
        searchInput.focus();
      });
    }

    // Add Blog Trigger
    const addBtn = document.getElementById("btn-add-blog");
    if (addBtn) {
      addBtn.addEventListener("click", function() {
        openBlogModal(null);
      });
    }

    // Blog Form Submit Handler
    const blogForm = document.getElementById("blog-modal-form");
    if (blogForm) {
      blogForm.addEventListener("submit", handleBlogFormSubmit);
    }
  }

  function renderBlogs(query = "") {
    const tableBody = document.getElementById("blogs-table-body");
    const emptyState = document.getElementById("blogs-empty-state");
    const countEl = document.getElementById("blogs-count-indicator");
    if (!tableBody || !window.PortfolioStorage) return;

    let blogs = window.PortfolioStorage.getBlogs();

    if (query) {
      const q = query.toLowerCase();
      blogs = blogs.filter(b => {
        const titleMatch = b.title && b.title.toLowerCase().includes(q);
        const catMatch = b.category && b.category.toLowerCase().includes(q);
        const excerptMatch = b.excerpt && b.excerpt.toLowerCase().includes(q);
        return titleMatch || catMatch || excerptMatch;
      });
    }

    if (countEl) {
      countEl.textContent = `Showing ${blogs.length} article${blogs.length === 1 ? "" : "s"}`;
    }

    if (blogs.length === 0) {
      tableBody.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    let html = "";
    blogs.forEach(b => {
      const isPublished = Boolean(b.published);
      const statusBadge = isPublished
        ? `<span class="status-badge status-published">● Published</span>`
        : `<span class="status-badge status-draft">○ Draft</span>`;
      const dateFormatted = b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—";
      const imageSrc = b.image || "assets/images/blog-placeholder.jpg";

      html += `
        <tr data-blog-id="${escapeHtml(b.id)}">
          <td>
            <img class="table-thumb" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(b.title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%231e293b\\'/><text x=\\'50%\\' y=\\'55%\\' fill=\\'%2364748b\\' text-anchor=\\'middle\\' font-size=\\'12\\'>No Image</text></svg>'">
          </td>
          <td>
            <div class="table-title">${escapeHtml(b.title)}</div>
            <div class="table-desc" title="${escapeHtml(b.excerpt)}">${escapeHtml(b.excerpt)}</div>
          </td>
          <td>
            <span class="category-pill">${escapeHtml(b.category || "Article")}</span>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <span class="table-date">${dateFormatted}</span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-action btn-action-edit" data-edit-blog="${escapeHtml(b.id)}" aria-label="Edit article ${escapeHtml(b.title)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </button>
              <button type="button" class="btn-action btn-action-delete" data-delete-blog="${escapeHtml(b.id)}" data-title="${escapeHtml(b.title)}" aria-label="Delete article ${escapeHtml(b.title)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    tableBody.querySelectorAll("[data-edit-blog]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.getAttribute("data-edit-blog");
        openBlogModal(id);
      });
    });

    tableBody.querySelectorAll("[data-delete-blog]").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.getAttribute("data-delete-blog");
        const title = this.getAttribute("data-title") || "Article";
        promptDelete("blog", id, title);
      });
    });
  }

  function openBlogModal(blogId = null) {
    state.editingBlogId = blogId;
    const modalTitle = document.getElementById("blog-modal-title");
    const form = document.getElementById("blog-modal-form");
    if (!form) return;

    form.reset();
    clearModalErrors(form);

    if (blogId) {
      if (modalTitle) modalTitle.textContent = "Edit Blog Article";
      const blog = window.PortfolioStorage.findInCollection(
        window.PortfolioStorage.STORAGE_KEYS.BLOGS,
        blogId
      );
      if (blog) {
        document.getElementById("blog-title-input").value = blog.title || "";
        document.getElementById("blog-excerpt-input").value = blog.excerpt || "";
        document.getElementById("blog-content-input").value = blog.content || "";
        document.getElementById("blog-category-input").value = blog.category || "JavaScript";
        document.getElementById("blog-image-input").value = blog.image || "";
        document.getElementById("blog-published-input").checked = Boolean(blog.published);
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Add New Blog Article";
      document.getElementById("blog-image-input").value = "assets/images/blog-placeholder.jpg";
      document.getElementById("blog-published-input").checked = true;
    }

    openModal("blog-modal");
  }

  function handleBlogFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    clearModalErrors(form);

    const title = document.getElementById("blog-title-input").value.trim();
    const excerpt = document.getElementById("blog-excerpt-input").value.trim();
    const content = document.getElementById("blog-content-input").value.trim();
    const category = document.getElementById("blog-category-input").value.trim();
    const image = document.getElementById("blog-image-input").value.trim();
    const published = document.getElementById("blog-published-input").checked;

    let hasError = false;
    if (!title) {
      showModalFieldError("blog-title-input", "Blog title is required.");
      hasError = true;
    }
    if (!excerpt) {
      showModalFieldError("blog-excerpt-input", "Short excerpt is required.");
      hasError = true;
    }
    if (!content) {
      showModalFieldError("blog-content-input", "Article content is required.");
      hasError = true;
    }
    if (!category) {
      showModalFieldError("blog-category-input", "Category is required.");
      hasError = true;
    }

    if (hasError) return;

    const payload = {
      title: title,
      excerpt: excerpt,
      content: content,
      category: category,
      author: currentAdmin ? (currentAdmin.fullName || "Admin") : "Admin",
      image: image || "assets/images/blog-placeholder.jpg",
      published: published
    };

    if (state.editingBlogId) {
      const updated = window.PortfolioStorage.updateBlog(state.editingBlogId, payload);
      if (updated) {
        showToast("success", `Blog article "${title}" updated successfully.`);
      } else {
        showToast("error", "Failed to update blog article.");
      }
    } else {
      const created = window.PortfolioStorage.addBlog(payload);
      if (created) {
        showToast("success", `Blog article "${title}" published successfully.`);
      } else {
        showToast("error", "Failed to add blog article.");
      }
    }

    closeModal("blog-modal");
    renderBlogs();
    renderStats();
  }

  /* --------------------------------------------------------------------------
     10. Universal Confirmation Delete Modal (Section 13, 20, 27)
     -------------------------------------------------------------------------- */
  function promptDelete(type, id, title) {
    state.deletingType = type;
    state.deletingId = id;
    state.deletingTitle = title;

    const labelMap = {
      project: "Project",
      skill: "Skill",
      blog: "Blog Article"
    };

    const typeLabel = labelMap[type] || "Item";
    const titleEl = document.getElementById("confirm-delete-title");
    const messageEl = document.getElementById("confirm-delete-message");

    if (titleEl) titleEl.textContent = `Delete ${typeLabel}?`;
    if (messageEl) {
      messageEl.textContent = `Are you sure you want to permanently delete "${title}"? This action cannot be undone.`;
    }

    openModal("confirm-delete-modal");
  }

  function handleConfirmDelete() {
    if (!state.deletingType || !state.deletingId) return;

    let success = false;
    const title = state.deletingTitle || "Item";

    if (state.deletingType === "project") {
      success = window.PortfolioStorage.deleteProject(state.deletingId);
      if (success) {
        showToast("success", `Project "${title}" deleted successfully.`);
        renderProjects();
      }
    } else if (state.deletingType === "skill") {
      success = window.PortfolioStorage.deleteSkill(state.deletingId);
      if (success) {
        showToast("success", `Skill "${title}" deleted successfully.`);
        renderSkills();
      }
    } else if (state.deletingType === "blog") {
      success = window.PortfolioStorage.deleteBlog(state.deletingId);
      if (success) {
        showToast("success", `Blog article "${title}" deleted successfully.`);
        renderBlogs();
      }
    }

    if (!success) {
      showToast("error", `Unable to delete ${title}.`);
    }

    renderStats();
    closeModal("confirm-delete-modal");

    state.deletingType = null;
    state.deletingId = null;
    state.deletingTitle = "";
  }

  /* --------------------------------------------------------------------------
     11. Modal System Controller (Section 35)
     -------------------------------------------------------------------------- */
  function setupModalSystem() {
    // Close buttons inside modals
    document.querySelectorAll("[data-close-modal]").forEach(btn => {
      btn.addEventListener("click", function() {
        const modalId = this.getAttribute("data-close-modal");
        if (modalId) closeModal(modalId);
      });
    });

    // Close on backdrop click (click outside card)
    document.querySelectorAll(".admin-modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", function(e) {
        if (e.target === this) {
          closeModal(this.id);
        }
      });
    });

    // Close on Escape key press (Section 35 accessibility)
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".admin-modal-backdrop.active").forEach(m => {
          closeModal(m.id);
        });
      }
    });

    // Wire Delete Confirm Action button
    const confirmDeleteBtn = document.getElementById("btn-confirm-delete-action");
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
    }
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Focus first interactive input inside modal
    setTimeout(() => {
      const firstInput = modal.querySelector("input:not([type='hidden']), textarea, select");
      if (firstInput) firstInput.focus();
    }, 50);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  function showModalFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(inputId + "-error");
    if (input) {
      input.classList.add("is-invalid");
      input.focus();
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("active");
    }
  }

  function clearModalErrors(form) {
    if (!form) return;
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    form.querySelectorAll(".modal-field-error").forEach(el => {
      el.textContent = "";
      el.classList.remove("active");
    });
  }

  /* --------------------------------------------------------------------------
     12. Toast Notification System (Section 34)
     -------------------------------------------------------------------------- */
  function showToast(type, message) {
    const container = document.getElementById("admin-toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `admin-toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const iconMap = {
      success: "✓",
      error: "✕",
      info: "ℹ"
    };

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${iconMap[type] || "•"}</span>
      <span class="toast-msg">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  /* --------------------------------------------------------------------------
     13. Mobile Sidebar & UI Helpers
     -------------------------------------------------------------------------- */
  function setupMobileSidebar() {
    const toggleBtn = document.getElementById("admin-mobile-toggle-btn");
    const sidebar = document.querySelector(".admin-sidebar");
    const closeBtn = document.getElementById("admin-sidebar-close-btn");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", function() {
        sidebar.classList.toggle("mobile-open");
      });
    }

    if (closeBtn && sidebar) {
      closeBtn.addEventListener("click", function() {
        sidebar.classList.remove("mobile-open");
      });
    }
  }

  function setupThemeToggle() {
    if (window.PortfolioStorage) {
      const toggles = document.querySelectorAll(".theme-toggle");
      toggles.forEach(btn => {
        btn.addEventListener("click", function() {
          window.PortfolioStorage.toggleTheme();
        });
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();
