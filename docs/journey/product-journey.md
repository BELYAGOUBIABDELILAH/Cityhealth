# 🗺️ CityHealth — The Product Journey

## From a Thesis Idea to Algeria's First AI-Powered Health Platform

---

## The Problem: Healthcare Fragmentation in Sidi Bel Abbès

In Algeria's second largest region by population, **Sidi Bel Abbès**, finding healthcare information has always been a matter of word-of-mouth. If you needed a cardiologist, you asked a neighbor. If your child had a fever at midnight and you needed the pharmacy on duty (the *pharmacie de garde*), you drove around looking for the one with lights on.

This is not a story of poor healthcare quality — the medical professionals in Sidi Bel Abbès are highly trained and dedicated. The problem is **information infrastructure**. No centralized, reliable, up-to-date directory existed. Phone books are outdated. Facebook groups are chaotic and unverified. Google Maps has partial and often incorrect listings. Official government health portals are sparse and rarely updated.

The consequences are real:
- Patients waste critical time during emergencies
- Patients visit doctors without knowing if they accept their insurance
- Families don't know who is on-call at 2am
- Blood donation requests spread through WhatsApp chains with no matching system
- Foreign-language speakers (French, or Algerian nationals returning from Europe) have no Arabic-first resource

This is the gap that CityHealth was built to close.

---

## The Origin: A Master's Thesis That Refused to Stay Academic

In early **2024**, Abdelilah Belyagoubi, a Master's student in Computer Science (Networks, Systems & Information Security) at **Djillali Liabes University**, began work on his thesis with a deceptively simple premise:

> *"What if every person in Sidi Bel Abbès could find the right doctor, the right pharmacy, or donate blood — in their own language, from their phone, in under 60 seconds?"*

The thesis framework required a functional prototype. Most students deliver a minimal demo. Belyagoubi delivered a production system.

The reason was simple: the problem was real, the community needed this, and the technology to build it was available and affordable. Supabase offered a full backend for free. Railway offered serverless hosting. React had a rich ecosystem. Google Gemini's API was accessible. There was no reason this had to be a proof-of-concept.

---

## 2024 Q2: Building the Foundation

The core web platform launched internally in **Q2 2024**. The priorities were:

1. **Data quality over quantity** — Better to have 50 accurate, verified providers than 500 unverified ones.
2. **GPS-first search** — The single most important feature. Distance from user is the primary sort criterion. Every other filter is secondary.
3. **Multilingual from day one** — Launching Arabic support later is ten times harder than building it in from the start. The entire UI was designed RTL-aware from the first component.

The technical decision that defined everything was **choosing Supabase** over a custom backend. This allowed:
- Instant auth without building a login system
- PostgreSQL with PostGIS for real geospatial queries
- Row Level Security to enforce access control at the database level — not just in application code
- Realtime subscriptions for live updates without polling

A custom Express.js backend would have taken months. Supabase took days.

---

## 2024 Q3: The OCR Verification Challenge

The hardest technical problem in CityHealth's history: **verifying that providers are who they claim to be**, automatically, at scale, in three languages.

Healthcare directories without verification are useless. Worse — they're dangerous. An unverified listing of a "doctor" who is not a doctor could send a patient to an unqualified practitioner.

The solution: **server-side OCR document verification**.

The approach:
1. Providers upload their official registration certificate (PDF or image)
2. `Tesseract.js` extracts text — in Arabic, French, and English (the three languages on Algerian medical documents)
3. `fuse.js` performs weighted fuzzy matching against the data submitted during registration

The hardest part was **Arabic OCR accuracy**. Arabic is a cursive, right-to-left script with complex ligatures and diacritics. Tesseract's Arabic language model (`ara`) required careful image preprocessing (contrast enhancement, deskewing, binarization via `sharp`) to achieve reliable extraction.

After weeks of tuning, the system reached a **95% confidence threshold** for automatic verification, with a manual review queue for borderline cases. This meant admins only needed to review ~5% of submissions — the rest are handled automatically.

This wasn't just a technical achievement. It was the foundation of trust that made the entire platform viable.

---

## 2024 Q4: Blood Donation Module

Algeria has a consistent shortage of blood donors. Requests spread through informal channels — WhatsApp, Facebook, SMS chains — with no structured matching.

CityHealth's blood donation module launched in **Q4 2024** with:
- A structured request form (blood type, urgency level, hospital, contact)
- A donor registry with blood type profiles
- Push notification matching — urgent requests notify registered donors of the same blood type immediately
- Automatic expiry so the directory never shows stale requests

The first week after launch, three successful blood donations were coordinated through the platform. This remains one of the team's proudest achievements — because it wasn't about technology. It was about someone getting blood when they needed it.

---

## 2025 Q1: Making CityHealth AI-Native with MCP

In early **2025**, Anthropic released the **Model Context Protocol (MCP)** — an open standard that allows AI assistants to query external data sources in real time, with structured tools.

The implication was immediate: *if CityHealth built an MCP server, Claude (and any MCP-compatible AI) could answer real healthcare questions about Sidi Bel Abbès using live, verified data.*

The decision to build it was made the day MCP was announced.

The **CityHealth MCP Server** launched on Railway in Q1 2025 with 6 tools exposing the full healthcare dataset. The decision to host on Railway was strategic: Railway provides always-on containers with automatic HTTPS, zero-downtime deployments, and pricing that scales from zero to production without architecture changes.

The first test was visceral. An instance of Claude, configured with the CityHealth MCP, was asked: *"Find me an emergency cardiologist in Sidi Bel Abbès open right now."* It responded with a real doctor, real address, real phone number, pulled live from the database. No hallucination. No outdated data. Real.

This was the moment CityHealth stopped being a web app and became **healthcare data infrastructure**.

---

## 2025 Q2: The Browser Extension

The browser extension emerged from a specific observation: people search for healthcare information *while doing other things*. They're reading an article about symptoms. They're in a WhatsApp chat. They need a doctor but don't want to interrupt their current context.

The **CityHealth Browser Extension** (Chrome + Firefox, Manifest V3) launched in Q2 2025 as a 320px popup that brings the core search and pharmacy duty features to any webpage. The blood donation badge — a red counter on the extension icon — was a particularly impactful addition. Users reported seeing urgent blood requests they would have missed otherwise.

---

## 2025 Q3: Mobile PWA — Healthcare in Every Pocket

By Q3 2025, mobile traffic accounted for over 60% of platform sessions. The PWA launch formalized this into a first-class experience:

- Full installation flow (Add to Home Screen)
- Service Worker pre-caching for offline access to emergency data
- Push notifications for blood donation alerts
- Mobile-first layout with bottom navigation and touch-optimized maps

No app store. No approval process. No update lag. When a new pharmacy registers at 9am and passes verification at 9:15am, mobile users see it when they search at 9:16am — because the PWA queries the same real-time database.

---

## The Vision: All 58 Wilayas

CityHealth is currently operational in **Sidi Bel Abbès** — one wilaya, one region. But the architecture was designed to be **national**.

The database schema is wilaya-aware. The MCP server supports location-based queries across any coordinate. The OCR pipeline processes Arabic, French, and English — the languages on medical documents across all of Algeria.

**The roadmap:**
- **2025 Q4**: Expand to Oran (second major city in the northwest)
- **2026**: Cover the top 10 most populated wilayas
- **2027**: National coverage — all 58 wilayas
- **Long-term**: Partner with the Algerian Ministry of Health for official data integration

The goal is not to be a startup that raises funding and pivots. The goal is to be **the infrastructure layer** for Algerian healthcare data — the source that doctors, patients, AI assistants, and health agencies all query.

---

## What Makes CityHealth Different

Algeria has had healthcare directories before. They failed for predictable reasons:

| Problem | How CityHealth Solves It |
|---|---|
| No Arabic support | Native Arabic RTL UI + Arabic OCR from day one |
| Unverified listings | Mandatory OCR document verification before public listing |
| No geospatial search | PostGIS-powered GPS radius queries |
| Static, outdated data | Real-time updates — providers manage their own profiles |
| No AI integration | MCP server — any AI can query live data |
| No emergency features | Dedicated emergency directory + pharmacy duty + blood matching |
| Desktop-only | PWA-first — installable, offline-capable, push notifications |
| Single language | Arabic + French + English — all three switchable at runtime |

CityHealth is not a better version of what existed. It's a fundamentally different approach — open, verified, real-time, and AI-native.

---

## Technical Decisions: Looking Back

**Supabase over custom backend** — The right call. Saved months of development time while providing production-grade auth, storage, realtime, and security (RLS). The main trade-off is vendor lock-in, which is acceptable for a regional platform without hyperscale ambitions.

**MCP from the start** — Also right. The decision to treat AI queryability as a first-class feature (not an afterthought) has positioned CityHealth uniquely. As more AI assistants adopt MCP, CityHealth becomes more valuable with zero additional engineering.

**OCR with Tesseract.js** — Correct choice for Arabic document processing. The open-source model, when combined with proper preprocessing (sharp, pdf2pic), achieves the accuracy needed for medical verification. A cloud OCR API (Google Vision, AWS Textract) would have been faster to set up but creates API cost dependency and data privacy concerns for medical documents.

**PWA over React Native** — The right first step. A PWA ships to all platforms simultaneously with a single codebase. React Native will come when native-specific capabilities (background GPS, biometrics) justify the added complexity.

---

*CityHealth — Built in Algeria, for Algeria, to last.*
