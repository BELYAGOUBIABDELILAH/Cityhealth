# 🔄 CityHealth — Data Flow Documentation

This document describes how data flows through the CityHealth system for three key operational scenarios.

---

## Scenario 1: A Patient Finds a Doctor

### User Story
> "Ahmed is in Sidi Bel Abbès and has chest pain. He opens CityHealth and searches for a cardiologist near him."

### Data Flow

```mermaid
sequenceDiagram
    actor Patient as 👤 Ahmed (Patient)
    participant WebApp as 🌐 React Web App
    participant TanStack as TanStack Query Cache
    participant Supabase as ⚙️ Supabase PostgreSQL
    participant Leaflet as 🗺️ Leaflet.js Map

    Patient->>WebApp: Open provider search, grant GPS location
    WebApp->>WebApp: Capture GPS coords (navigator.geolocation)
    WebApp->>TanStack: Check cache for "cardiologist near [lat,lon]"
    TanStack-->>WebApp: Cache MISS — proceed to fetch

    WebApp->>Supabase: SELECT providers WHERE type='cardiologist'\nORDER BY distance(location, [lat,lon])\nLIMIT 20 (PostGIS extension)
    Supabase->>Supabase: Execute RLS policy check (public read for verified providers)
    Supabase-->>WebApp: Array of provider records [{id, name, address, lat, lon, phone, hours, ...}]

    WebApp->>TanStack: Cache result (5 min TTL)
    WebApp->>Leaflet: Plot provider markers on map
    WebApp-->>Patient: Map view + list of cardiologists sorted by distance

    Patient->>WebApp: Tap on "Dr. Kaddouri — 1.2km away"
    WebApp->>Supabase: SELECT * FROM providers WHERE id = 'abc123'
    Supabase-->>WebApp: Full provider profile
    WebApp-->>Patient: Provider detail page (address, phone, hours, specialities, map)

    Patient->>WebApp: Click "Call" button
    WebApp-->>Patient: Opens tel: link → native phone dialer
```

### Key Data Tables Involved

| Table | Purpose |
|---|---|
| `providers` | Main provider records (name, type, location, hours, contact) |
| `provider_specialities` | M2M relationship between providers and speciality tags |
| `verification_records` | Join to only show `verified` providers |

### Performance Notes
- TanStack Query caches results for 5 minutes to avoid redundant DB calls
- PostGIS `ST_DWithin` function enables efficient radius queries on indexed geometry columns
- Only `verified = true` providers are returned (enforced at RLS level, not just in query)

---

## Scenario 2: A Provider Gets Verified via OCR

### User Story
> "Dr. Kaddouri registers on CityHealth and uploads her medical license PDF to be verified."

### Data Flow

```mermaid
sequenceDiagram
    actor Provider as 🏥 Dr. Kaddouri (Provider)
    participant WebApp as 🌐 React Web App
    participant SupaStorage as 📦 Supabase Storage
    participant SupaDB as ⚙️ Supabase PostgreSQL
    participant EdgeFn as ⚡ Edge Function
    participant OCRWorker as 🔍 Railway OCR Worker
    participant Tesseract as 🔤 Tesseract.js
    participant FuseJS as 🎯 fuse.js
    participant Realtime as 📡 Supabase Realtime

    Provider->>WebApp: Complete registration form + upload PDF license
    WebApp->>SupaStorage: PUT document to bucket 'provider-docs/{provider_id}/license.pdf'
    SupaStorage-->>WebApp: Storage URL returned
    WebApp->>SupaDB: INSERT INTO verification_records {provider_id, doc_url, status: 'pending'}
    SupaDB-->>WebApp: Record created, status: 'pending'
    WebApp-->>Provider: "Document submitted. Verification in progress..."
    WebApp->>Realtime: Subscribe to verification_records WHERE id = record_id

    SupaDB->>EdgeFn: TRIGGER on INSERT to verification_records
    EdgeFn->>OCRWorker: POST /process {provider_id, doc_url, registered_data}

    OCRWorker->>SupaStorage: GET document from URL
    SupaStorage-->>OCRWorker: Raw PDF bytes
    OCRWorker->>Tesseract: Convert PDF→image (pdf2pic + sharp), then extract text (AR+FR+EN)
    Tesseract-->>OCRWorker: Raw extracted text string

    OCRWorker->>FuseJS: Run weighted fuzzy match against registered provider data\n• Reg Number: 40%\n• Contact Name: 30%\n• Business Name: 20%\n• Phone: 10%
    FuseJS-->>OCRWorker: Confidence score (e.g., 0.97)

    alt Score >= 0.95
        OCRWorker->>SupaDB: UPDATE verification_records SET status='verified', confidence=0.97
        OCRWorker->>SupaDB: UPDATE providers SET verified=true
    else Score < 0.95
        OCRWorker->>SupaDB: UPDATE verification_records SET status='rejected', confidence=0.82, reason='Low match on registration number'
    end

    SupaDB->>Realtime: Broadcast change on verification_records
    Realtime-->>WebApp: Real-time event: status updated
    WebApp-->>Provider: ✅ "Your profile has been verified!" / ❌ "Verification failed. Please re-upload."
```

### Key Data Tables Involved

| Table | Purpose |
|---|---|
| `providers` | Provider base record, `verified` boolean flag |
| `verification_records` | Per-document OCR job record with status + confidence score |
| `supabase_storage` | File storage for uploaded documents (signed URL access) |

### OCR Confidence Scoring Detail

| Field | Weight | Extraction Method |
|---|---|---|
| Legal Registration Number | 40% | Regex + Tesseract from document |
| Contact Person Name | 30% | NER-style extraction + fuse.js |
| Business/Clinic Name | 20% | Full-text match + fuse.js |
| Contact Phone | 10% | Regex extraction |

If any individual field has 0 confidence, the overall score is penalized significantly. A minimum of 95% overall confidence is required for automatic verification.

---

## Scenario 3: An AI Assistant Queries Health Data via MCP

### User Story
> "A user asks Claude: 'What pharmacies are on duty tonight near Sidi Bel Abbès city center?'"

### Data Flow

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Claude as 🤖 Claude (Anthropic)
    participant MCPServer as 🔗 MCP Server\n(mcp.cityhealthdz.com/mcp)
    participant SupaDB as ⚙️ Supabase PostgreSQL

    User->>Claude: "What pharmacies are on duty tonight near Sidi Bel Abbès center?"

    Claude->>Claude: Analyze query → select MCP tool: get_pharmacy_on_duty
    Claude->>MCPServer: MCP tool call:\nget_pharmacy_on_duty({location: "Sidi Bel Abbes center", date: "2025-01-15"})

    MCPServer->>MCPServer: Validate tool parameters
    MCPServer->>SupaDB: SELECT p.name, p.address, p.phone, p.lat, p.lon\nFROM pharmacies p\nWHERE p.on_duty_tonight = true\nAND ST_DWithin(p.location, ST_Point(lon, lat), 5000)\nORDER BY ST_Distance(p.location, ST_Point(lon, lat))
    SupaDB-->>MCPServer: [{id: "ph_01", name: "Pharmacie Centrale", address: "Rue Larbi Ben Mhidi", phone: "048-...", lat: ..., lon: ...}, ...]

    MCPServer-->>Claude: Structured JSON response:\n{pharmacies: [...], count: 3, query_time: "2025-01-15T22:14:00Z"}

    Claude->>Claude: Format human-readable response
    Claude-->>User: "Tonight, there are 3 pharmacies on duty near you:\n1. Pharmacie Centrale — Rue Larbi Ben Mhidi (0.8km)\n   📞 048-XXX-XXXX\n2. ..."
```

### MCP Tool Specification: `get_pharmacy_on_duty`

**Input parameters:**
```json
{
  "location": "string (city name or coordinates)",
  "date": "ISO 8601 date string (optional, defaults to today)",
  "radius_km": "number (optional, defaults to 5)"
}
```

**Output:**
```json
{
  "pharmacies": [
    {
      "id": "ph_01",
      "name": "Pharmacie Centrale",
      "address": "Rue Larbi Ben Mhidi, Sidi Bel Abbès",
      "phone": "048-123-4567",
      "lat": 35.2018,
      "lon": -0.6316,
      "distance_km": 0.8,
      "on_duty_until": "2025-01-16T08:00:00Z"
    }
  ],
  "count": 3,
  "query_time": "2025-01-15T22:14:00Z",
  "coverage_area": "Sidi Bel Abbès"
}
```

### Why MCP Changes Everything

Traditional health directories require users to visit a website, navigate menus, and manually search. With MCP:

1. AI assistants can **proactively query** healthcare data during conversation
2. Results are **always real-time** — the same data the web app shows
3. AI can **combine tools** — e.g., check if a pharmacy near an emergency provider is open
4. The MCP server is **read-only** — AI assistants can never modify the database
5. Any MCP-compatible AI can integrate **without custom API work**

This positions CityHealth as a **healthcare data infrastructure layer** for the AI era, not just a consumer app.

---

*For architecture overview, see [`system-architecture.md`](system-architecture.md). For MCP server details, see [`../features/mcp-server.md`](../features/mcp-server.md).*
