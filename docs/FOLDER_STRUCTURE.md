# 📁 CityHealth Folder Structure

This document provides a complete overview of the repository organization.

## 🎯 Professional Naming Convention

All folders use **clear, professional names** that immediately communicate their purpose:

| Folder Name | Purpose | Status |
|-------------|---------|--------|
| `browser-extension` | Chrome/Firefox extension for real-time alerts | ✅ Full Code |
| `ai-mcp-server` | AI Model Context Protocol server | ✅ Full Code |
| `web-platform` | Main web application | 📄 Docs Only |
| `mobile-application` | Native mobile app (Android/iOS) | 📄 Docs Only |
| `rest-api` | Developer REST API | 📄 Docs Only |
| `docs` | All documentation, diagrams, and thesis | 📚 Complete |

---

## 📂 Complete Directory Tree

```
🏥 Cityhealth/
│
├── 📁 .github/                          # GitHub configuration
│   └── FUNDING.yml
│
├── 📁 docs/                             # Documentation hub
│   ├── 📁 architecture/                # System design
│   │   ├── data-flow.md
│   │   ├── flow.svg
│   │   ├── system-architecture.md
│   │   ├── tech-stack-diagram.md
│   │   └── teck.png
│   ├── 📁 features/                    # Feature specifications
│   │   ├── browser-extension.md
│   │   ├── mcp-server.md
│   │   ├── mobile-app.md
│   │   └── web-platform.md
│   ├── 📁 journey/                     # Development story
│   │   └── product-journey.md
│   ├── 📁 screenshots/                 # Visual documentation
│   │   ├── 📁 apk/                    # Mobile screenshots (8 images)
│   │   ├── 📁 extension/              # Extension screenshots (2 images)
│   │   ├── 📁 website/                # Web screenshots (15 images)
│   │   ├── logo.png
│   │   ├── README.md
│   │   └── FOLDER_STRUCTURE.md        # This file
│   ├── 📁 uml/                         # UML diagrams
│   │   ├── class-diagram.md
│   │   ├── er-diagram.md
│   │   ├── sequence-diagram.md
│   │   └── use-case-diagram.md
│   └── 📄 thesis-report.pdf           # Complete Master's thesis
│
├── 📁 browser-extension/               # ✅ FULL SOURCE CODE
│   ├── 📁 dist/                       # Build output
│   ├── 📁 public/                     # Static assets
│   │   ├── 📁 icons/
│   │   ├── bird.png
│   │   └── manifest.json
│   ├── 📁 src/                        # Source code
│   │   ├── background.ts              # Service worker
│   │   ├── main.tsx                   # Popup entry
│   │   ├── Popup.tsx                  # Main UI
│   │   ├── OptionsPage.tsx            # Settings
│   │   ├── options-main.tsx
│   │   ├── supabaseClient.ts
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── options.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vite.background.config.ts
│   └── README.md                      # Setup guide
│
├── 📁 ai-mcp-server/                   # ✅ FULL SOURCE CODE
│   ├── 📁 src/
│   │   └── index.js                   # MCP server entry
│   ├── 📁 tests/
│   │   └── smoke.test.js              # Smoke tests
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── railway.json                   # Deployment config
│   └── README.md                      # Setup guide
│
├── 📁 web-platform/                    # 📄 DOCUMENTATION
│   └── README.md                      # Complete feature guide
│
├── 📁 mobile-application/              # 📄 DOCUMENTATION
│   └── README.md                      # Complete feature guide
│
├── 📁 rest-api/                        # 📄 DOCUMENTATION
│   └── README.md                      # API documentation
│
├── 📄 .gitignore                       # Git exclusions
├── 📄 CHANGELOG.md                     # Version history
├── 📄 CONTRIBUTING.md                  # How to contribute
├── 📄 QUICK_START.md                   # Fast navigation
└── 📄 README.md                        # Main documentation
```

---

## 🎨 Design Principles

### 1. **Clarity Over Brevity**
- ❌ `ext/` → ✅ `browser-extension/`
- ❌ `mcp/` → ✅ `ai-mcp-server/`
- ❌ `api/` → ✅ `rest-api/`

### 2. **Consistent Naming**
- All folders use kebab-case
- Full descriptive names (no abbreviations)
- Purpose-first naming

### 3. **Logical Grouping**
- Platform folders at root level
- All documentation in `/docs`
- Screenshots organized by platform

### 4. **Professional Structure**
- No temporary files
- No sensitive data (.env files)
- No build artifacts in git

---

## 📊 File Count by Category

| Category | Count | Notes |
|----------|-------|-------|
| **Source Code Files** | 50+ | Extension + MCP Server |
| **Documentation Files** | 25+ | READMEs, guides, specs |
| **Screenshots** | 25 | PNG images across 3 platforms |
| **Architecture Diagrams** | 10+ | UML, flow, system design |
| **Configuration Files** | 15+ | Package.json, tsconfig, etc. |

---

## 🔗 Quick Navigation

### By Role

**Students / Reviewers:**
- Start: [`README.md`](../README.md)
- Thesis: [`docs/thesis-report.pdf`](./thesis-report.pdf)
- Architecture: [`docs/architecture/`](./architecture/)

**Developers:**
- Extension Code: [`browser-extension/src/`](../browser-extension/src/)
- MCP Code: [`ai-mcp-server/src/`](../ai-mcp-server/src/)
- Setup: [`QUICK_START.md`](../QUICK_START.md)

**Researchers:**
- Journey: [`docs/journey/product-journey.md`](./journey/product-journey.md)
- Changelog: [`CHANGELOG.md`](../CHANGELOG.md)

---

## 📝 Maintenance Notes

### Adding New Content

- **Screenshots**: Add to `docs/screenshots/{platform}/`
- **Documentation**: Add to `docs/features/` or `docs/architecture/`
- **Code**: Add to respective platform folder

### Naming Guidelines

- Use kebab-case for all folders and files
- Be descriptive (avoid abbreviations)
- Include file type in name when helpful (e.g., `thesis-report.pdf`)

---

<div align="center">

**Last Updated:** 2025  
**Repository:** [github.com/BELYAGOUBIABDELILAH/Cityhealth](https://github.com/BELYAGOUBIABDELILAH/Cityhealth)

</div>
