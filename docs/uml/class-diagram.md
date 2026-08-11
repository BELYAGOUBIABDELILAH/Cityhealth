# 🧩 CityHealth — Class Diagram

## Overview

This document presents the Mermaid UML class diagram for the CityHealth domain model, covering all primary entities, their attributes, methods, and relationships.

---

## Class Diagram

```mermaid
classDiagram
    class Provider {
        +String id
        +String name
        +ProviderType type
        +String speciality
        +String address
        +Float latitude
        +Float longitude
        +String phone
        +String email
        +String[] languages
        +String[] insurance_accepted
        +WorkingHours working_hours
        +Boolean verified
        +Boolean emergency_available
        +Boolean is_24h
        +DateTime created_at
        +DateTime updated_at
        +searchNearby(lat, lon, radius) Provider[]
        +getProfile() ProviderProfile
        +updateProfile(data) void
    }

    class Patient {
        +String id
        +String auth_user_id
        +String name
        +String phone
        +String blood_type
        +String preferred_language
        +Boolean is_donor
        +DateTime registered_at
        +searchProviders(query, filters) Provider[]
        +requestBloodDonation(type, urgency) BloodDonationRequest
        +registerAsDonor(blood_type) void
    }

    class Admin {
        +String id
        +String auth_user_id
        +String name
        +String email
        +AdminRole role
        +DateTime last_login
        +reviewVerificationQueue() VerificationRecord[]
        +approveProvider(provider_id) void
        +rejectProvider(provider_id, reason) void
        +manageProviderData(provider_id, data) void
        +viewAnalytics() AnalyticsDashboard
    }

    class BloodDonationRequest {
        +String id
        +String requester_id
        +BloodType blood_type
        +UrgencyLevel urgency
        +String hospital_name
        +String location
        +Float latitude
        +Float longitude
        +String contact_phone
        +RequestStatus status
        +DateTime expires_at
        +DateTime created_at
        +Int donor_responses
        +broadcast() void
        +close() void
        +matchDonors() Patient[]
    }

    class PharmacyDuty {
        +String id
        +String pharmacy_id
        +Date duty_date
        +Time duty_start
        +Time duty_end
        +Boolean is_active_tonight
        +String contact_number
        +isOnDutyNow() Boolean
        +getActiveDuties(date) PharmacyDuty[]
    }

    class VerificationRecord {
        +String id
        +String provider_id
        +String document_url
        +VerificationStatus status
        +Float confidence_score
        +String rejection_reason
        +OCRResult ocr_result
        +DateTime submitted_at
        +DateTime processed_at
        +String processed_by
        +runOCR() OCRResult
        +applyFuzzyMatch(data) Float
        +updateStatus(status) void
    }

    class OCRResult {
        +String raw_text
        +String extracted_registration_number
        +String extracted_contact_name
        +String extracted_business_name
        +String extracted_phone
        +Float registration_confidence
        +Float name_confidence
        +Float business_confidence
        +Float phone_confidence
        +Float overall_score
        +String language_detected
    }

    class MCPTool {
        +String tool_name
        +String description
        +JSONSchema input_schema
        +JSONSchema output_schema
        +String endpoint
        +execute(params) JSONObject
        +validate(params) Boolean
    }

    class AIQuery {
        +String id
        +String session_id
        +String tool_called
        +JSONObject input_params
        +JSONObject response
        +Int response_time_ms
        +DateTime queried_at
        +String source_ip
        +log() void
    }

    class WorkingHours {
        +String monday
        +String tuesday
        +String wednesday
        +String thursday
        +String friday
        +String saturday
        +String sunday
        +isOpenNow() Boolean
        +getNextOpenTime() DateTime
    }

    class ProviderProfile {
        +Provider base
        +VerificationRecord verification
        +PharmacyDuty[] duty_schedule
        +BloodDonationRequest[] active_requests
        +Float average_rating
        +Int total_reviews
    }

    %% Enumerations
    class ProviderType {
        <<enumeration>>
        DOCTOR
        CLINIC
        HOSPITAL
        PHARMACY
        LABORATORY
        DENTAL
        OPHTHALMOLOGY
        EMERGENCY_SERVICES
        SPECIALIST
    }

    class BloodType {
        <<enumeration>>
        A_POSITIVE
        A_NEGATIVE
        B_POSITIVE
        B_NEGATIVE
        AB_POSITIVE
        AB_NEGATIVE
        O_POSITIVE
        O_NEGATIVE
    }

    class VerificationStatus {
        <<enumeration>>
        PENDING
        PROCESSING
        VERIFIED
        REJECTED
        MANUAL_REVIEW
    }

    class UrgencyLevel {
        <<enumeration>>
        CRITICAL
        URGENT
        STANDARD
    }

    class RequestStatus {
        <<enumeration>>
        ACTIVE
        FULFILLED
        EXPIRED
        CANCELLED
    }

    class AdminRole {
        <<enumeration>>
        SUPER_ADMIN
        MODERATOR
        VERIFIER
    }

    %% Relationships
    Provider "1" --> "0..1" VerificationRecord : has
    Provider "1" --> "0..*" PharmacyDuty : schedules
    Provider "1" --> "1" WorkingHours : has
    Provider "1" --> "1" ProviderProfile : composed of
    Patient "1" --> "0..*" BloodDonationRequest : creates
    Admin "1" --> "0..*" VerificationRecord : reviews
    VerificationRecord "1" --> "1" OCRResult : contains
    MCPTool "1" --> "0..*" AIQuery : generates
    ProviderProfile "1" --> "1" Provider : extends
    ProviderProfile "1" --> "0..1" VerificationRecord : includes
    ProviderProfile "1" --> "0..*" PharmacyDuty : includes

    Provider --> ProviderType : type
    BloodDonationRequest --> BloodType : blood_type
    BloodDonationRequest --> UrgencyLevel : urgency
    BloodDonationRequest --> RequestStatus : status
    VerificationRecord --> VerificationStatus : status
    Admin --> AdminRole : role
    Patient --> BloodType : blood_type
```

---

## Entity Descriptions

### `Provider`
Core entity representing any healthcare provider on the platform. Includes doctors, clinics, hospitals, pharmacies, labs, and specialists. The `verified` boolean is set to `true` only after successful OCR document verification.

### `Patient`
Registered user who consumes healthcare services. Patients can also be blood donors — tracked via `is_donor` and `blood_type` fields.

### `Admin`
Platform administrator with elevated privileges. Admins can manually override OCR verification results and manage all platform data.

### `BloodDonationRequest`
An urgent request posted by a patient (or on behalf of one) for a specific blood type. Requests expire after a configured duration and trigger push notifications to registered donors of the matching blood type.

### `PharmacyDuty`
Represents a single on-duty assignment for a pharmacy. The `isOnDutyNow()` method checks if the current datetime falls within the duty window, powering the "pharmacy on duty tonight" feature.

### `VerificationRecord`
Tracks the full lifecycle of a provider's document verification process — from submission through OCR processing to final status. Contains the full `OCRResult` as a JSON field.

### `OCRResult`
The structured output of Tesseract.js text extraction and fuse.js matching. Each field has an individual confidence score, and the `overall_score` is the weighted average used to make the verification decision.

### `MCPTool`
Represents one of the 6 tools exposed by the CityHealth MCP Server. Each tool has a defined input/output JSON schema and logs every invocation as an `AIQuery`.

### `AIQuery`
Audit log entry for every MCP tool call. Used for usage analytics, debugging, and rate limiting.

---

*See [`er-diagram.md`](er-diagram.md) for the database-level entity relationships.*
