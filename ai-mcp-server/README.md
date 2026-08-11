<h1 align="center">AI MCP Server</h1>

<div align="center">

**Expose Algeria's verified health directory as native tools for AI agents.**

![Status](https://img.shields.io/badge/Status-Production-success?style=flat-square)
![Runtime](https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Deployment](https://img.shields.io/badge/Railway-Persistent_Container-blueviolet?style=flat-square)
![Protocol](https://img.shields.io/badge/MCP_1.0-orange?style=flat-square)

Live: [mcp.cityhealthdz.com/mcp](https://mcp.cityhealthdz.com/mcp)

</div>

---

<h2 align="center">Overview</h2>

The CityHealth MCP Server implements the [Model Context Protocol](https://modelcontextprotocol.io/) — the open standard that lets AI clients call external tools natively. Any MCP-compatible client (Claude Desktop, custom agents built on the Anthropic or OpenAI SDK) can point to this server and query Algeria's healthcare directory as if the data were part of its own context.

The server runs as a persistent Docker container on Railway. Serverless platforms were evaluated and ruled out — Vercel's function timeout terminates SSE connections, which the MCP protocol requires to stay open for the full duration of a query session.

---

<h2 align="center">Available Tools</h2>

| Tool | Description | Key Parameters |
|:---|:---|:---|
| `search_providers` | Search by specialty, type, and wilaya | `specialty`, `wilaya`, `provider_type` |
| `find_nearby_providers` | PostGIS radius search from coordinates | `latitude`, `longitude`, `radius_km` |
| `get_emergency_providers` | List 24/7 facilities currently operational | — |
| `get_pharmacy_on_duty` | Tonight's on-duty pharmacy for a wilaya | `wilaya` |
| `find_blood_donors` | Registered donors by blood type and wilaya | `blood_type`, `wilaya` |
| `get_provider_details` | Full verified profile for a provider | `provider_id` |

---

<h2 align="center">Architecture</h2>

```
AI Client (Claude / ChatGPT / custom agent)
    ↓  JSON-RPC 2.0 over SSE
Express.js + MCP SDK
    ↓  Tool invocation → SQL query
Supabase (PostgreSQL + PostGIS)
    ↓  Row-Level Security · read-only service role
Structured JSON response → AI client
```

The server uses a dedicated read-only Supabase service role. AI clients can read any verified provider record — they cannot write, update, or access unverified or private data.

---

<h2 align="center">Quick Start</h2>

### Local development

```bash
git clone https://github.com/BELYAGOUBIABDELILAH/Cityhealth.git
cd ai-mcp-server
npm install
cp .env.example .env
# Add SUPABASE_URL and SUPABASE_ANON_KEY to .env
npm start
```

### Claude Desktop integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cityhealth": {
      "command": "node",
      "args": ["/absolute/path/to/ai-mcp-server/src/index.js", "--stdio"],
      "env": {
        "SUPABASE_URL": "your-project-url",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

Or connect directly to the hosted server at `https://mcp.cityhealthdz.com/mcp` — no local installation required.

---

<h2 align="center">Example</h2>

```javascript
// AI agent calls the MCP tool
const result = await mcp.useTool('find_nearby_providers', {
  latitude: 35.6976,
  longitude: -0.6337,
  radius_km: 3
});

// Returns structured, verified data
{
  "providers": [
    {
      "id": "uuid",
      "name": "Cabinet Dr. Benali",
      "specialty": "Cardiology",
      "address": "12 Rue des Martyrs, Oran",
      "phone": "+213 41 ...",
      "distance_km": 1.4,
      "verified": true,
      "on_duty": false
    }
  ]
}
```

---

<h2 align="center">Related Platforms</h2>

- [Web Platform](../web-platform)
- [Browser Extension](../browser-extension)
- [REST API](../rest-api)
- [Mobile Application](../mobile-application)

---

<div align="center">

**Built by [Abdelilah Belyagoubi](https://github.com/BELYAGOUBIABDELILAH) & [Naimi Abdeljalil](https://github.com/Abdeljalil)**  
*Part of the CityHealth Master's Thesis · 2025–2026*

</div>
