# 🏗️ CityHealth — Tech Stack Diagram

This document provides a full visual overview of the CityHealth technology ecosystem — from user devices to AI integration layers — using both ASCII art and Mermaid diagrams.

---

## 🎨 ASCII Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            🌍 USER DEVICES                                      │
│                                                                                  │
│   ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────────────────┐ │
│   │  🖥️ Desktop / PC │   │  📱 Mobile (PWA)  │   │  🔌 Browser Extension        │ │
│   │  Chrome/Firefox  │   │  Android / iOS   │   │  Chrome / Firefox MV3       │ │
│   └────────┬────────┘   └────────┬─────────┘   └─────────────┬───────────────┘ │
└────────────┼────────────────────┼──────────────────────────── ┼────────────────┘
             │                    │                              │
             ▼                    ▼                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🌐 FRONTEND LAYER                                        │
│                                                                                  │
│              ┌────────────────────────────────────────────┐                     │
│              │   React 18 + TypeScript (Vite Build)        │                    │
│              │   • TanStack Query (server state)           │                    │
│              │   • Zustand (client state)                  │                    │
│              │   • Tailwind CSS (design system)            │                    │
│              │   • Leaflet.js + OpenStreetMap (maps)       │                    │
│              │   • i18n: Arabic RTL / French / English     │                    │
│              └───────────────────┬────────────────────────┘                     │
└─────────────────────────────────┼───────────────────────────────────────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
┌────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐
│  ⚙️ SUPABASE BACKEND │  │  🧠 AI LAYER          │  │  🔍 OCR WORKER (Railway)    │
│                     │  │                      │  │                             │
│  • PostgreSQL DB    │  │  Google Gemini 1.5   │  │  Node.js Cron Service       │
│  • Row Level Sec.   │  │  Flash (Chat/AI)     │  │  • Tesseract.js (AR/FR/EN)  │
│  • Supabase Auth    │  │                      │  │  • pdf2pic + sharp          │
│  • Storage Buckets  │  │                      │  │  • fuse.js fuzzy matching   │
│  • Edge Functions   │  │                      │  │  • 95% confidence threshold │
│  • Realtime         │  │                      │  │                             │
└────────┬───────────┘  └──────────────────────┘  └──────────────┬──────────────┘
         │                                                         │
         │◄────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      🤖 MCP SERVER (Railway — Always On)                         │
│                                                                                  │
│              ┌────────────────────────────────────────────┐                     │
│              │   Node.js MCP Server                        │                    │
│              │   mcp.cityhealthdz.com/mcp                  │                    │
│              │                                             │                    │
│              │   Tools exposed:                            │                    │
│              │   • find_nearby_providers                   │                    │
│              │   • get_emergency_providers                 │                    │
│              │   • get_pharmacy_on_duty                    │                    │
│              │   • search_providers                        │                    │
│              │   • find_blood_donors                       │                    │
│              │   • get_provider_details                    │                    │
│              └─────────────────────┬───────────────────────┘                   │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      🤖 MCP CLIENTS (AI Assistants)                              │
│                                                                                  │
│     ┌──────────────────┐   ┌──────────────────┐   ┌────────────────────────┐   │
│     │  Claude (Anthropic) │   │  Any MCP-Compatible │   │  Future AI Integrations │ │
│     │                  │   │  Assistant        │   │                        │   │
│     └──────────────────┘   └──────────────────┘   └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Mermaid — Full Layer Diagram

```mermaid
graph TB
    subgraph UserDevices["👤 User Devices"]
        Desktop["🖥️ Desktop Browser\nChrome / Firefox"]
        MobileDevice["📱 Mobile (PWA)\nAndroid / iOS"]
        BrowserExt["🔌 Browser Extension\nManifest V3"]
    end

    subgraph CDN["🌐 Hosting & CDN"]
        ViteBuild["Vite Build Output\nStatic Files"]
        CloudHosting["Cloud Hosting\n(Production)"]
    end

    subgraph Frontend["⚛️ React Frontend"]
        ReactApp["React 18 + TypeScript"]
        TanStackQ["TanStack Query\nServer State Cache"]
        Zustand["Zustand\nClient State"]
        Leaflet["Leaflet.js\nInteractive Maps"]
        I18n["i18n\nAR / FR / EN"]
        TailwindCSS["Tailwind CSS\nDesign System"]
    end

    subgraph SupabaseLayer["⚙️ Supabase Backend"]
        PostgreSQL["PostgreSQL\nMain Database"]
        RLS["Row Level Security\nJWT Auth Guard"]
        SupaAuth["Supabase Auth\nUser Management"]
        SupaStorage["Supabase Storage\nDocument Buckets"]
        EdgeFunctions["Edge Functions\nServerless Workers"]
        Realtime["Realtime\nWebSocket Subscriptions"]
    end

    subgraph AILayer["🧠 AI Layer"]
        Gemini["Google Gemini 1.5 Flash\nHealth AI Assistant"]
    end

    subgraph OCRWorker["🔍 OCR Worker — Railway"]
        NodeOCR["Node.js Cron Job"]
        Tesseract["Tesseract.js\nArabic + French + English"]
        FuseJS["fuse.js\nWeighted Fuzzy Matching"]
        PDFProc["pdf2pic + sharp\nDocument Processing"]
    end

    subgraph MCPLayer["🤖 MCP Server — Railway"]
        MCPNode["Node.js MCP Server\nmcp.cityhealthdz.com/mcp"]
        Tool1["find_nearby_providers"]
        Tool2["get_emergency_providers"]
        Tool3["get_pharmacy_on_duty"]
        Tool4["search_providers"]
        Tool5["find_blood_donors"]
        Tool6["get_provider_details"]
    end

    subgraph MCPClients["🤖 AI Assistants (MCP Clients)"]
        Claude["Claude (Anthropic)"]
        OtherAI["Other MCP-Compatible\nAssistants"]
    end

    Desktop --> CloudHosting
    MobileDevice --> CloudHosting
    BrowserExt --> ReactApp
    CloudHosting --> ViteBuild
    ViteBuild --> ReactApp

    ReactApp --> TanStackQ
    ReactApp --> Zustand
    ReactApp --> Leaflet
    ReactApp --> I18n
    ReactApp --> TailwindCSS

    ReactApp --> PostgreSQL
    ReactApp --> SupaAuth
    ReactApp --> SupaStorage
    ReactApp --> Gemini

    PostgreSQL --> RLS
    SupaAuth --> RLS
    SupaStorage --> EdgeFunctions
    EdgeFunctions --> NodeOCR

    NodeOCR --> Tesseract
    Tesseract --> PDFProc
    Tesseract --> FuseJS
    FuseJS --> PostgreSQL
    NodeOCR --> Realtime

    MCPNode --> PostgreSQL
    MCPNode --> Tool1
    MCPNode --> Tool2
    MCPNode --> Tool3
    MCPNode --> Tool4
    MCPNode --> Tool5
    MCPNode --> Tool6

    Claude --> MCPNode
    OtherAI --> MCPNode
```

---

## 📊 Technology Inventory

| Layer | Component | Technology | Hosting |
|---|---|---|---|
| User Interface | Web App | React 18, TypeScript, Vite | Cloud CDN |
| User Interface | Mobile | PWA, Service Worker | Self-hosted |
| User Interface | Extension | Manifest V3, Vanilla JS | Chrome/Firefox Store |
| Frontend State | Server Cache | TanStack Query | Client |
| Frontend State | UI State | Zustand | Client |
| Maps | Interactive Maps | Leaflet.js + OpenStreetMap | Client |
| Internationalization | i18n | Custom i18n setup | Client |
| Styling | Design System | Tailwind CSS | Client |
| Database | Main DB | Supabase PostgreSQL | Supabase Cloud |
| Security | Auth + RLS | Supabase Auth, JWT | Supabase Cloud |
| Storage | Documents | Supabase Storage | Supabase Cloud |
| Real-time | WebSockets | Supabase Realtime | Supabase Cloud |
| AI Chat | Health Assistant | Google Gemini 1.5 Flash | Google Cloud |
| OCR | Document Processing | Tesseract.js (AR/FR/EN) | Railway |
| PDF | PDF to Image | pdf2pic + sharp | Railway |
| Matching | Fuzzy Verification | fuse.js | Railway |
| MCP | AI Data API | Node.js MCP Server | Railway |
| CI/CD | Automation | GitHub Actions | GitHub |

---

*Last updated: 2025 — CityHealth v1.0*
