# 🔀 CityHealth — Sequence Diagrams

This document contains three complete UML sequence diagrams for the CityHealth platform's most critical user flows.

---

## Diagram 1: Patient Searches for a Provider

### Scenario
> A patient opens the CityHealth web app, grants GPS access, and searches for a nearby general practitioner. They view the full profile and find the doctor's phone number.

```mermaid
sequenceDiagram
    actor Patient as 👤 Patient
    participant Browser as 🌐 Browser (React App)
    participant Cache as TanStack Query Cache
    participant SupabaseAuth as 🔐 Supabase Auth
    participant SupabaseDB as ⚙️ Supabase PostgreSQL
    participant LeafletMap as 🗺️ Leaflet.js Map
    participant GeoAPI as 📍 navigator.geolocation

    Patient->>Browser: Open cityhealthdz.com
    Browser->>SupabaseAuth: Check session (JWT token in localStorage)
    SupabaseAuth-->>Browser: Session valid (or anonymous)

    Patient->>Browser: Click "Search Providers" → select "General Practitioner"
    Browser->>GeoAPI: getCurrentPosition()
    GeoAPI-->>Browser: {lat: 35.2018, lon: -0.6316}

    Browser->>Cache: Check cache for key: "providers:gp:35.20:-0.63"
    Cache-->>Browser: Cache MISS

    Browser->>SupabaseDB: RPC: search_providers_nearby(\n  type: 'doctor',\n  speciality: 'general',\n  lat: 35.2018, lon: -0.6316,\n  radius_km: 10\n)
    Note over SupabaseDB: RLS checks:\n- verified = true\n- No admin-only fields returned

    SupabaseDB-->>Browser: [{id, name, address, lat, lon, phone, speciality, distance_km, is_open_now, ...}]

    Browser->>Cache: Store result (TTL: 5 minutes)
    Browser->>LeafletMap: Add markers for each provider\n(lat/lon + popup info)
    LeafletMap-->>Browser: Map rendered with markers
    Browser-->>Patient: Provider list + map view

    Patient->>Browser: Click on "Dr. Amira Belhadj — 2.1km away"
    Browser->>Cache: Check cache for "provider:dr_001"
    Cache-->>Browser: Cache MISS

    Browser->>SupabaseDB: SELECT * FROM providers\nJOIN verification_records ON ...\nWHERE providers.id = 'dr_001'
    SupabaseDB-->>Browser: Full provider object + verification badge

    Browser-->>Patient: Provider detail page:\n- Name, photo, speciality\n- Address + map pin\n- Phone number\n- Working hours\n- Languages spoken\n- ✅ Verified badge

    Patient->>Browser: Click "📞 Call"
    Browser-->>Patient: Opens tel:+213-048-XXX-XXXX\n(native phone dialer)
```

---

## Diagram 2: Provider Submits Documents → OCR Verification Pipeline

### Scenario
> A new pharmacy registers on CityHealth and uploads its official registration certificate PDF. The OCR worker processes it and updates the provider's verification status in real time.

```mermaid
sequenceDiagram
    actor Provider as 🏥 Provider (Pharmacist)
    participant Browser as 🌐 React Web App
    participant SupaAuth as 🔐 Supabase Auth
    participant SupaStorage as 📦 Supabase Storage
    participant SupaDB as ⚙️ Supabase PostgreSQL
    participant Realtime as 📡 Supabase Realtime
    participant EdgeFn as ⚡ Edge Function
    participant OCRWorker as 🔍 Railway OCR Worker
    participant Tesseract as 🔤 Tesseract.js (AR/FR/EN)
    participant FuseJS as 🎯 fuse.js

    Provider->>Browser: Fill registration form + Upload "license.pdf"
    Browser->>SupaAuth: signUp(email, password, role: 'provider')
    SupaAuth-->>Browser: JWT token + user_id

    Browser->>SupaDB: INSERT INTO providers {name, type, address, lat, lon, phone, ...}
    SupaDB-->>Browser: provider_id: "prv_abc123"

    Browser->>SupaStorage: PUT providers/prv_abc123/license.pdf
    SupaStorage-->>Browser: Signed storage URL

    Browser->>SupaDB: INSERT INTO verification_records {\n  provider_id: 'prv_abc123',\n  document_url: 'https://...',\n  status: 'pending'\n}
    SupaDB-->>Browser: record_id: "vrf_xyz789"

    Browser->>Realtime: SUBSCRIBE to verification_records\nWHERE id = 'vrf_xyz789'
    Browser-->>Provider: "📄 Document submitted. We are verifying it..."

    Note over SupaDB: TRIGGER fires on INSERT to verification_records

    SupaDB->>EdgeFn: on_new_verification_record({record_id, provider_id, doc_url})
    EdgeFn->>OCRWorker: POST https://ocr.railway.internal/process\n{provider_id, doc_url, registered_data}
    OCRWorker->>SupaDB: UPDATE verification_records SET status='processing'
    SupaDB->>Realtime: Broadcast status change → 'processing'
    Realtime-->>Browser: Status: "🔄 Processing..."

    OCRWorker->>SupaStorage: GET document bytes from signed URL
    SupaStorage-->>OCRWorker: Raw PDF bytes

    OCRWorker->>Tesseract: convertPDFToImage(bytes)\nthen recognize(image, langs: ['ara', 'fra', 'eng'])
    Tesseract-->>OCRWorker: Raw text: "رقم التسجيل: 2024/SBA/PH/047\nاسم المؤسسة: صيدلية المركز\n..."

    OCRWorker->>FuseJS: fuzzyMatch(\n  extracted: {reg_num, name, business, phone},\n  registered: {reg_num, name, business, phone},\n  weights: {reg_num: 0.4, name: 0.3, business: 0.2, phone: 0.1}\n)
    FuseJS-->>OCRWorker: confidence_score: 0.97

    alt confidence >= 0.95
        OCRWorker->>SupaDB: UPDATE verification_records SET\n  status='verified',\n  confidence_score=0.97,\n  processed_at=NOW()
        OCRWorker->>SupaDB: UPDATE providers SET verified=true
        SupaDB->>Realtime: Broadcast: status='verified'
        Realtime-->>Browser: ✅ Verification complete!
        Browser-->>Provider: "✅ Your pharmacy is now verified and listed!"
    else confidence < 0.95
        OCRWorker->>SupaDB: UPDATE verification_records SET\n  status='rejected',\n  confidence_score=0.73,\n  rejection_reason='Registration number mismatch'
        SupaDB->>Realtime: Broadcast: status='rejected'
        Realtime-->>Browser: ❌ Verification failed
        Browser-->>Provider: "❌ Verification failed: Registration number mismatch.\nPlease re-upload a clearer document."
    end
```

---

## Diagram 3: AI Assistant Calls MCP → Supabase → Structured Response

### Scenario
> A user asks Claude (with CityHealth MCP configured): *"Is there a cardiologist available for emergency near Sidi Bel Abbès right now?"*

```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Claude as 🤖 Claude (Anthropic)
    participant MCPClient as MCP Client Layer
    participant MCPServer as 🔗 CityHealth MCP Server\n(mcp.cityhealthdz.com/mcp)
    participant SupaDB as ⚙️ Supabase PostgreSQL
    participant MCPLogger as 📊 AIQuery Logger

    User->>Claude: "Is there a cardiologist available for emergency near Sidi Bel Abbès right now?"

    Claude->>Claude: Analyze intent:\n- Need: emergency cardiologist\n- Location: Sidi Bel Abbès\n- Constraint: available now

    Claude->>MCPClient: Select tool: get_emergency_providers\nwith params: {speciality: "cardiologist", location: "Sidi Bel Abbes"}

    MCPClient->>MCPServer: MCP protocol request:\n{\n  "tool": "get_emergency_providers",\n  "params": {\n    "speciality": "cardiologist",\n    "location": "Sidi Bel Abbes",\n    "available_now": true\n  }\n}

    MCPServer->>MCPServer: Validate input against JSON schema\nGeocode "Sidi Bel Abbes" → {lat: 35.2018, lon: -0.6316}

    MCPServer->>SupaDB: SELECT p.id, p.name, p.address, p.phone,\n  p.lat, p.lon, p.is_24h, p.emergency_available,\n  ST_Distance(p.location, point) as dist_km\nFROM providers p\nWHERE p.verified = true\n  AND p.type = 'doctor'\n  AND p.speciality ILIKE '%cardiolog%'\n  AND (p.is_24h = true OR p.emergency_available = true)\n  AND ST_DWithin(p.location, ST_Point(-0.6316, 35.2018), 20000)\nORDER BY dist_km\nLIMIT 5

    Note over SupaDB: RLS: read-only service role\nNo patient data accessible

    SupaDB-->>MCPServer: [\n  {\n    id: "prv_001",\n    name: "Dr. Youcef Belkacem",\n    speciality: "Cardiologist",\n    address: "12 Rue de la Paix, Sidi Bel Abbès",\n    phone: "048-123-4567",\n    is_24h: true,\n    emergency_available: true,\n    dist_km: 1.4\n  }\n]

    MCPServer->>MCPLogger: INSERT INTO ai_query_logs {\n  tool: "get_emergency_providers",\n  params: {...},\n  result_count: 1,\n  response_time_ms: 142\n}

    MCPServer-->>MCPClient: {\n  "providers": [\n    {\n      "id": "prv_001",\n      "name": "Dr. Youcef Belkacem",\n      "speciality": "Cardiologist",\n      "address": "12 Rue de la Paix, Sidi Bel Abbès",\n      "phone": "048-123-4567",\n      "available_24h": true,\n      "emergency": true,\n      "distance_km": 1.4\n    }\n  ],\n  "count": 1,\n  "coverage": "20km radius around Sidi Bel Abbès"\n}

    MCPClient-->>Claude: Structured JSON response

    Claude->>Claude: Format natural language response\nwith all provider details

    Claude-->>User: "Yes! I found a cardiologist available for emergency near you:\n\n🏥 **Dr. Youcef Belkacem** — Cardiologist\n📍 12 Rue de la Paix, Sidi Bel Abbès (1.4km away)\n📞 048-123-4567\n🚨 24/7 Emergency: ✅\n\nI recommend calling ahead to confirm availability. Would you like me to also find the nearest emergency room?"
```

---

## Summary

| Diagram | Key System Interaction | Critical Path |
|---|---|---|
| **1. Patient Search** | React → Supabase PostgreSQL → Leaflet Map | Cache miss → DB query → Map render |
| **2. OCR Verification** | Storage → Edge Function → Railway Worker → Realtime | PDF upload → Tesseract → fuse.js → DB update → WebSocket push |
| **3. MCP AI Query** | AI → MCP Server → Supabase → Structured JSON | Tool call → PostGIS query → Formatted response |

---

*For the full system architecture, see [`../architecture/system-architecture.md`](../architecture/system-architecture.md).*
