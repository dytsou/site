var WebMcpBootstrap = (() => {
  // src/data/site-routes.json
  var site_routes_default = [
    {
      path: "/",
      changefreq: "weekly",
      priority: "1.0"
    },
    {
      path: "/about",
      changefreq: "monthly",
      priority: "0.8"
    },
    {
      path: "/experiences",
      changefreq: "monthly",
      priority: "0.8"
    },
    {
      path: "/projects",
      changefreq: "weekly",
      priority: "0.9"
    },
    {
      path: "/contact",
      changefreq: "monthly",
      priority: "0.7"
    }
  ];

  // src/data/site-routes.ts
  var SITE_URL = "https://dy.tsou.me";
  var SITE_ROUTES = site_routes_default;
  var NAV_ROUTES = SITE_ROUTES.filter((r) => r.path !== "/");
  var NAV_LABELS = {
    "/about": "About",
    "/experiences": "Experiences",
    "/projects": "Projects",
    "/contact": "Contact"
  };
  var NAV_LINKS = [
    ...NAV_ROUTES.map((route) => ({
      path: route.path,
      label: NAV_LABELS[route.path] ?? route.path
    })),
    { path: "https://dy.tsou.me/resume", label: "Resume", external: true }
  ];

  // src/data/contact-cards.ts
  var CONTACT_CARDS = [
    {
      platform: "linkedin",
      title: "LinkedIn",
      subtitle: "linkedin.com/in/dytsou/",
      url: "https://www.linkedin.com/in/dytsou/"
    },
    {
      platform: "github",
      title: "GitHub",
      subtitle: "@dytsou",
      url: "https://github.com/dytsou"
    },
    {
      platform: "email",
      title: "Email Me",
      subtitle: "contact@dy.tsou.me",
      url: "mailto:contact@dy.tsou.me"
    }
  ];

  // src/components/contents/Projects.generated.ts
  var PROJECTS_CONTENTS = [
    {
      id: "kore-ji/koreji-frontend",
      title: "Koreji",
      description: "Koreji helps you efficiently collect and accumulate spare time. Easily transform time spent commuting, waiting, or in between tasks into tangible steps forward\u2014whether that's work, learning, or personal projects.",
      technologies: ["TypeScript", "JavaScript"],
      tags: ["time-management", "productivity", "mobile-app"],
      github_url: "https://github.com/kore-ji/koreji-frontend",
      featured: true
    },
    {
      id: "NYCU-SDC/core-system-backend",
      title: "SDC Core System",
      description: "Backend infrastructure for NYCU Software Development Club. Built a robust RESTful API system with Go, featuring Docker containerization and PostgreSQL database management.",
      technologies: ["Go", "Shell", "Makefile", "Dockerfile"],
      tags: ["erp", "golang-system", "rest-api", "docker", "postgresql"],
      github_url: "https://github.com/NYCU-SDC/core-system-backend",
      featured: true
    },
    {
      id: "dytsou/NextMeeting",
      title: "NextMeeting",
      description: "A macOS menu bar app that shows your next meeting at a glance.",
      technologies: ["Swift", "Shell", "Makefile"],
      tags: [
        "calendar",
        "google-meet",
        "macos",
        "meeting",
        "menu-bar-app",
        "microsoft-teams",
        "webex",
        "whereby",
        "zoom"
      ],
      github_url: "https://github.com/dytsou/ProxiMeeting",
      featured: true
    },
    {
      id: "MCHackathon2025/CAIender-frontend",
      title: "CAIender",
      description: "The project, called CAIendar, is designed as an AI Calendar \xD7 Life Designer to enhance workplace experience by providing personalized scheduling and activity recommendations",
      technologies: ["JavaScript", "CSS", "HTML"],
      tags: ["ai", "helper", "hackathon"],
      github_url: "https://github.com/MCHackathon2025/CAIender-frontend",
      featured: true
    },
    {
      id: "dytsou/shorten-url",
      title: "Shorten URL",
      description: "A modern, fast URL shortener built with Cloudflare Workers",
      technologies: ["JavaScript"],
      tags: ["cloudflare-workers", "shorten-urls"],
      github_url: "https://github.com/dytsou/shorten-url",
      featured: false
    },
    {
      id: "dytsou/github-readme-stats",
      title: "GitHub README Stats",
      description: "Dynamically generated stats for GitHub READMEs with Cloudflare worker",
      technologies: ["JavaScript", "TypeScript", "Shell"],
      tags: [
        "cloudflare-workers",
        "github-readme-stats",
        "profile",
        "readme",
        "readme-profile-badge"
      ],
      github_url: "https://github.com/dytsou/github-readme-stats",
      featured: true
    },
    {
      id: "dytsou/raycast-rsync-extension",
      title: "Raycast Rsync Extension",
      description: "Transfer files between local and remote servers using rsync with SSH config integration",
      technologies: ["TypeScript", "JavaScript"],
      tags: ["raycast-extension", "rsync", "transfer-files"],
      github_url: "https://github.com/dytsou/raycast-rsync-extension",
      featured: false
    },
    {
      id: "dytsou/Dungeon",
      title: "Dungeon",
      description: "A text-based dungeon adventure game where players explore rooms, fight monsters, and manage resources to reach the boss room.",
      technologies: ["C++", "Makefile"],
      tags: ["dungeons-and-dragons", "text-based", "game"],
      github_url: "https://github.com/dytsou/Dungeon",
      featured: false
    },
    {
      id: "dytsou/resume",
      title: "Resume Builder",
      description: "A specialized web application that converts LaTeX resume documents to clean, professional HTML and deploys them to GitHub Pages.",
      technologies: ["JavaScript", "TeX", "TypeScript", "CSS"],
      tags: ["html-converter", "node-js", "resume-builder"],
      github_url: "https://github.com/dytsou/resume",
      featured: false
    },
    {
      id: "dytsou/intern-corner-scheduler",
      title: "Intern Corner Scheduler",
      description: "A web interface using OR-Tools CP-SAT to generate round-table seating across rounds with fixed hosts, balanced tables, and pair-wise constraints.",
      technologies: ["Python", "JavaScript", "CSS", "Makefile"],
      tags: ["round-table", "scheduler"],
      github_url: "https://github.com/dytsou/intern-corner-scheduler",
      featured: false
    },
    {
      id: "dytsou/GenAI-Studio",
      title: "GenAI Studio",
      description: "A local-first AI chat workspace built with React + TypeScript + Vite",
      technologies: ["TypeScript", "CSS", "JavaScript", "HTML"],
      tags: ["chat-application", "react", "typescript", "vite"],
      github_url: "https://github.com/dytsou/GenAI-Studio",
      featured: false
    }
  ];

  // src/agent/webmcp.ts
  var PAGE_PATHS = SITE_ROUTES.map((route) => route.path);
  var toolsRegistered = false;
  function getModelContext() {
    const navigatorContext = navigator.modelContext;
    if (typeof navigatorContext?.registerTool === "function") {
      return navigatorContext;
    }
    const documentContext = document.modelContext;
    if (typeof documentContext?.registerTool === "function") {
      return documentContext;
    }
    return void 0;
  }
  function navigateToPage(path) {
    const url = `${SITE_URL}${path === "/" ? "" : path}`;
    globalThis.location.assign(url);
  }
  function buildWebMcpTools() {
    return [
      {
        name: "navigate_to_page",
        description: "Navigate to a page on Dong-You Tsou personal site.",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "string",
              enum: PAGE_PATHS,
              description: "Canonical site path such as /about or /projects."
            }
          },
          required: ["page"]
        },
        execute: async (input) => {
          const page = String(input.page ?? "/");
          if (!PAGE_PATHS.includes(page)) {
            throw new Error(`Unknown page: ${page}`);
          }
          navigateToPage(page);
          return { url: `${SITE_URL}${page === "/" ? "" : page}` };
        }
      },
      {
        name: "get_contact_info",
        description: "Return public contact channels for Dong-You Tsou.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        execute: async () => ({
          contacts: CONTACT_CARDS.map(({ platform, title, subtitle, url }) => ({
            platform,
            title,
            subtitle,
            url
          })),
          calendar: `${SITE_URL}/cal`,
          resume: `${SITE_URL}/resume`
        }),
        annotations: { readOnlyHint: true }
      },
      {
        name: "list_projects",
        description: "List featured projects from the site portfolio.",
        inputSchema: {
          type: "object",
          properties: {
            featuredOnly: {
              type: "boolean",
              description: "When true, return only featured projects."
            }
          }
        },
        execute: async (input) => {
          const featuredOnly = Boolean(input.featuredOnly);
          const projects = featuredOnly ? PROJECTS_CONTENTS.filter((project) => project.featured) : PROJECTS_CONTENTS;
          return {
            projects: projects.map(
              ({ title, description, technologies, github_url, featured }) => ({
                title,
                description,
                technologies,
                github_url,
                featured
              })
            )
          };
        },
        annotations: { readOnlyHint: true }
      },
      {
        name: "list_site_pages",
        description: "Return canonical URLs for all public site pages.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        execute: async () => ({
          pages: SITE_ROUTES.map(({ path }) => ({
            path,
            url: `${SITE_URL}${path === "/" ? "" : path}`
          })),
          discovery: {
            apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
            agentSkills: `${SITE_URL}/.well-known/agent-skills/index.json`,
            sitemap: `${SITE_URL}/sitemap.xml`,
            auth: `${SITE_URL}/auth.md`,
            oauthProtectedResource: `${SITE_URL}/.well-known/oauth-protected-resource`,
            oauthAuthorizationServer: `${SITE_URL}/.well-known/oauth-authorization-server`
          }
        }),
        annotations: { readOnlyHint: true }
      }
    ];
  }
  async function registerWebMcpTools(signal) {
    if (toolsRegistered) return true;
    const modelContext = getModelContext();
    if (!modelContext) return false;
    const options = signal ? { signal } : void 0;
    try {
      for (const tool of buildWebMcpTools()) {
        await modelContext.registerTool(tool, options);
      }
      toolsRegistered = true;
      return true;
    } catch (error) {
      if (signal?.aborted) return false;
      console.warn("WebMCP tool registration failed:", error);
      return false;
    }
  }
  var POLL_MS = 100;
  var REGISTRATION_TIMEOUT_MS = 3e4;
  function waitAndRegisterWebMcpTools(signal) {
    const deadline = Date.now() + REGISTRATION_TIMEOUT_MS;
    const attempt = async () => {
      if (signal?.aborted) return;
      if (await registerWebMcpTools(signal)) return;
      if (Date.now() >= deadline) return;
      setTimeout(attempt, POLL_MS);
    };
    void attempt();
  }

  // src/webmcp-bootstrap.ts
  var controller = new AbortController();
  function bootWebMcp() {
    waitAndRegisterWebMcpTools(controller.signal);
  }
  if (document.readyState === "complete") {
    bootWebMcp();
  } else {
    window.addEventListener("load", bootWebMcp, { once: true });
  }
})();
