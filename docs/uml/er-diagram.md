# 🗃️ CityHealth — Entity-Relationship Diagram

## Overview

This document presents the complete Supabase PostgreSQL schema for CityHealth as a Mermaid `erDiagram`, showing all tables, columns, foreign key relationships, and cardinality.

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    PROVIDERS {
        uuid id PK
        uuid auth_user_id FK
        varchar name
        varchar type
        varchar speciality
        text address
        float latitude
        float longitude
        point location
        varchar phone
        varchar email
        varchar website
        jsonb working_hours
        text[] languages
        text[] insurance_accepted
        boolean verified
        boolean emergency_available
        boolean is_24h
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    PATIENTS {
        uuid id PK
        uuid auth_user_id FK
        varchar name
        varchar phone
        varchar email
        varchar blood_type
        varchar preferred_language
        boolean is_donor
        boolean is_active
        timestamp registered_at
        timestamp updated_at
    }

    ADMINS {
        uuid id PK
        uuid auth_user_id FK
        varchar name
        varchar email
        varchar role
        timestamp last_login
        timestamp created_at
    }

    BLOOD_DONATION_REQUESTS {
        uuid id PK
        uuid requester_id FK
        varchar blood_type
        varchar urgency_level
        varchar hospital_name
        text location_description
        float latitude
        float longitude
        varchar contact_phone
        varchar status
        int donor_responses
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    BLOOD_DONOR_RESPONSES {
        uuid id PK
        uuid request_id FK
        uuid donor_id FK
        varchar status
        timestamp responded_at
    }

    PHARMACIES {
        uuid id PK
        uuid provider_id FK
        varchar name
        text address
        float latitude
        float longitude
        point location
        varchar phone
        boolean verified
        timestamp created_at
    }

    PHARMACY_DUTY {
        uuid id PK
        uuid pharmacy_id FK
        date duty_date
        time duty_start
        time duty_end
        boolean is_active
        varchar contact_override
        timestamp created_at
    }

    VERIFICATION_RECORDS {
        uuid id PK
        uuid provider_id FK
        uuid reviewed_by FK
        text document_url
        varchar document_type
        varchar status
        float confidence_score
        text rejection_reason
        jsonb ocr_result
        timestamp submitted_at
        timestamp processed_at
        timestamp reviewed_at
    }

    MCP_QUERY_LOGS {
        uuid id PK
        varchar tool_name
        jsonb input_params
        jsonb response_summary
        int result_count
        int response_time_ms
        varchar source_ip
        varchar user_agent
        timestamp queried_at
    }

    AUTH_USERS {
        uuid id PK
        varchar email
        varchar role
        timestamp created_at
    }

    %% Relationships
    AUTH_USERS ||--o| PROVIDERS : "auth_user_id"
    AUTH_USERS ||--o| PATIENTS : "auth_user_id"
    AUTH_USERS ||--o| ADMINS : "auth_user_id"

    PROVIDERS ||--o{ VERIFICATION_RECORDS : "provider_id"
    PROVIDERS ||--o| PHARMACIES : "provider_id"

    PHARMACIES ||--o{ PHARMACY_DUTY : "pharmacy_id"

    PATIENTS ||--o{ BLOOD_DONATION_REQUESTS : "requester_id"
    BLOOD_DONATION_REQUESTS ||--o{ BLOOD_DONOR_RESPONSES : "request_id"
    PATIENTS ||--o{ BLOOD_DONOR_RESPONSES : "donor_id"

    ADMINS ||--o{ VERIFICATION_RECORDS : "reviewed_by"
```

---

## Table Descriptions

### `providers`
The central table for all healthcare providers. The `location` column is a PostGIS `POINT` type enabling efficient geospatial queries (`ST_DWithin`, `ST_Distance`). Only rows with `verified = true` are returned to public users (enforced via RLS).

**Key constraints:**
- `auth_user_id` → `auth.users.id` (FK, CASCADE on delete)
- `type` → enum: `doctor | clinic | hospital | pharmacy | laboratory | dental | ophthalmology | emergency_services | specialist`
- `status` → enum: `active | suspended | pending`

---

### `patients`
Registered patients. Also used as blood donor profiles when `is_donor = true`. The `blood_type` field is stored as a varchar matching standard ABO+Rh notation (e.g., `A+`, `O-`).

---

### `admins`
Platform administrators. Created manually by super-admins. The `role` field supports `super_admin | moderator | verifier`.

---

### `blood_donation_requests`
Emergency blood requests posted by patients or medical staff. Requests automatically expire based on `expires_at`. The `status` field tracks lifecycle: `active → fulfilled | expired | cancelled`.

**Blood types supported:** A+, A−, B+, B−, AB+, AB−, O+, O−

**Urgency levels:** `critical | urgent | standard`

---

### `blood_donor_responses`
Junction table tracking which donors have responded to which blood requests. Enables the system to prevent duplicate responses and track fulfillment.

---

### `pharmacies`
Pharmacy-specific extension of the providers table. Contains a denormalized copy of location data for faster pharmacy-only queries. Linked to `providers` via `provider_id`.

---

### `pharmacy_duty`
Tracks on-duty schedules for pharmacies. Multiple entries per pharmacy for different dates. The `is_active` boolean is computed nightly by a cron job based on `duty_date`, `duty_start`, and `duty_end`.

**Key query:** `SELECT * FROM pharmacies JOIN pharmacy_duty ON id = pharmacy_id WHERE duty_date = CURRENT_DATE AND is_active = true`

---

### `verification_records`
Full audit trail for provider document verification. The `ocr_result` JSONB column stores the complete Tesseract.js output and fuse.js confidence breakdown for every field.

**Status lifecycle:** `pending → processing → verified | rejected | manual_review`

---

### `mcp_query_logs`
Audit log for all MCP tool calls. Enables:
- Usage analytics (which tools are called most)
- Rate limiting (by `source_ip`)
- Performance monitoring (`response_time_ms`)
- Debugging AI query failures

---

## Row Level Security (RLS) Summary

| Table | Public Read | Auth Read | Provider Write | Admin Write |
|---|---|---|---|---|
| `providers` | verified only | own record | own record | all |
| `patients` | ❌ | own record | ❌ | all |
| `admins` | ❌ | ❌ | ❌ | own record |
| `blood_donation_requests` | active only | own + active | ❌ | all |
| `pharmacies` | verified only | ❌ | own record | all |
| `pharmacy_duty` | active today | own pharmacy | own pharmacy | all |
| `verification_records` | ❌ | own record | own record | all |
| `mcp_query_logs` | ❌ | ❌ | ❌ | read only |

---

*For full data flow, see [`../architecture/data-flow.md`](../architecture/data-flow.md). For class-level model, see [`class-diagram.md`](class-diagram.md).*
