<h1 align="center">CityHealth Quick Start Guide</h1>

Welcome to the CityHealth repository! This guide will help you navigate and understand the project quickly.

<h2 align="center">What is CityHealth?</h2>

CityHealth is Algeria's first verified healthcare infrastructure platform, built as a Master's thesis project. It provides:
- 🔍 GPS-aware healthcare provider search
- 📱 Mobile and web access
- 🩸 Blood donation coordination
- 🤖 AI-powered health assistance
- 🔌 Developer API for third-party integration

<h2 align="center">Repository Overview</h2>

```
📦 Cityhealth/
├── 📄 README.md                    ← Start here for project overview
├── 📄 docs/thesis-report.pdf      ← Complete thesis documentation
├── 📁 browser-extension/          ← Browser Extension (full code)
├── 📁 ai-mcp-server/              ← AI/MCP Server (full code)
├── 📁 web-platform/               ← Web platform (documentation)
├── 📁 mobile-application/         ← Mobile app (documentation)
├── 📁 rest-api/                   ← REST API (documentation)
└── 📁 docs/                       ← Architecture & screenshots
```

<h2 align="center">Quick Navigation</h2>

### For Reviewers & Evaluators
1. **Project Overview**: Read [`README.md`](README.md)
2. **Complete Thesis**: Open [`docs/thesis-report.pdf`](docs/thesis-report.pdf)
3. **Architecture**: Browse [`docs/architecture/`](docs/architecture/)
4. **Visual Demos**: Check [`docs/screenshots/`](docs/screenshots/)

### For Developers
1. **Code - Extension**: [`browser-extension/`](browser-extension/)
2. **Code - MCP Server**: [`ai-mcp-server/`](ai-mcp-server/)
3. **API Docs**: [`rest-api/README.md`](rest-api/README.md)
4. **Project Structure**: [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md)

### For Students & Researchers
1. **Development Journey**: [`docs/journey/product-journey.md`](docs/journey/product-journey.md)
2. **Tech Stack Decisions**: [`docs/architecture/system-architecture.md`](docs/architecture/system-architecture.md)
3. **Changelog**: [`CHANGELOG.md`](CHANGELOG.md)

<h2 align="center">Run Locally</h2>

### Browser Extension
```bash
cd browser-extension
npm install
npm run dev
# Load unpacked extension from browser-extension/dist in Chrome
```

### AI MCP Server
```bash
cd ai-mcp-server
npm install
cp .env.example .env
# Configure .env with Supabase credentials
npm start
```

## 🌐 Live Platforms

- **Web Portal**: https://cityhealthdz.com
- **Developer API**: https://cityhealthdz.com/api
- **MCP Server**: https://mcp.cityhealthdz.com/mcp

<h2 align="center">Key Features by Platform</h2>

| Platform | Key Features |
|----------|-------------|
| **Web Platform** | GPS search, provider profiles, blood donation, OCR verification |
| **Mobile Application** | Native geolocation, offline maps, emergency routing |
| **Browser Extension** | Real-time blood alerts, quick search, duty pharmacies |
| **AI MCP Server** | AI agent tools, Claude/ChatGPT integration |
| **REST API** | REST endpoints, rate limiting, SHA-256 auth |

<h2 align="center">Screenshots</h2>

All visual documentation is in [`docs/screenshots/`](docs/screenshots/):
- `apk/` - Mobile app interfaces
- `extension/` - Browser extension UI
- `website/` - Web portal pages

<h2 align="center">Tech Stack</h2>

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), PostgREST
- **Mobile**: React Native, Leaflet.js
- **AI/MCP**: Node.js, Express, Model Context Protocol
- **Browser Extension**: Manifest V3, WebSockets
- **Infrastructure**: Railway, Vercel, Supabase Cloud

<h2 align="center">Documentation Files</h2>

| File | Description |
|------|-------------|
| `README.md` | Main project documentation |
| `docs/thesis-report.pdf` | Complete thesis report |
| `docs/FOLDER_STRUCTURE.md` | Repository organization |
| `CHANGELOG.md` | Version history |
| `CONTRIBUTING.md` | How to contribute |
| `QUICK_START.md` | This file |

<h2 align="center">Important Links</h2>

- **GitHub**: https://github.com/BELYAGOUBIABDELILAH/Cityhealth
- **Live Website**: https://cityhealthdz.com
- **Contact**: belyagoubiabdillah@gmail.com

<h2 align="center">Authors</h2>

- **Abdelilah Belyagoubi** - [GitHub](https://github.com/BELYAGOUBIABDELILAH)
- **Naimi Abdeljalil** - [GitHub](https://github.com/Abdeljalil) · Naimi.abdeljalil22@gmail.com

<h2 align="center">Academic Citation</h2>

```bibtex
@mastersthesis{cityhealth2025,
  author = {Belyagoubi, Abdelilah and Naimi, Abdeljalil},
  title = {CityHealth: A Verified Healthcare Infrastructure Platform for Algeria},
  school = {Djilali Liabès University, Sidi Bel Abbès},
  year = {2026},
  url = {https://github.com/BELYAGOUBIABDELILAH/Cityhealth}
}
```

---

<div align="center">

**Built by [Abdelilah Belyagoubi](https://github.com/BELYAGOUBIABDELILAH) & [Naim Abdeljalil](https://github.com/Abdeljalil)**

</div>
