# Zero-Trust Firestore Security Specifications

## 1. Core Data Invariants

1. **Lead Verification Integrity:**
   - All leads must have a strictly valid ID matching `^[a-zA-Z0-9_\-]+$`.
   - Contact score must be an integer constrained strictly between `0` and `100`.
   - Pipeline phase must be one of: `Lead`, `Contacted`, `Qualified`, `Proposal`, `Closed Won`, `Closed Lost`.
   - Automated routing `aiStatus` must be one of: `AI Active`, `Human Takeover`, `Closed`.

2. **Message Flow Authenticity:**
   - Any message in `/leads/{leadId}/messages/{messageId}` must have a sender matching `lead`, `agent`, or `ai`.
   - Message payloads must not exceed size limits (e.g., text length <= 2000 characters) to prevent Denial of Wallet attacks.

3. **Campaign Broadcast Rigor:**
   - Broadcast status must be safe: `Draft`, `Scheduled`, `Sending`, `Completed`, `Failed`.
   - Campaigns and campaign template metrics (ROI, spent, revenue) cannot be arbitrary negative numbers.

4. **Temporal Consistency:**
   - `createdAt` and `updatedAt` timestamps must strictly equal the Firestore server-side time `request.time`.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following specific payloads represent attacks designed to bypass application controls, bypass schemas, or spoof states. Our fortress rules will block all of them.

### [Pillar 1: Schema Integrity]
1. **Payload #1: Ghost Keys (Extra Fields)**
   - Target: `create` on `/leads/bad-lead-1`
   - Content: `{ "id": "bad-lead-1", "name": "Hack", "phone": "+12", "email": "a@a.com", "score": 50, "stage": "Lead", "aiStatus": "AI Active", "ghost_verified_flag": true }`

2. **Payload #2: Unbounded Resource Exhaustion (String Poisoning)**
   - Target: `create` on `/leads/leak-2`
   - Content: `{ "id": "leak-2", "name": "[10000 character string...]", "phone": "+1", "email": "a@a.com", "score": 50, "stage": "Lead", "aiStatus": "AI Active" }`

3. **Payload #3: Scoring Value Out of Bounds**
   - Target: `create` on `/leads/leak-3`
   - Content: `{ "id": "leak-3", "name": "Sarah", "phone": "+123", "email": "s@s.com", "score": 9999, "stage": "Lead", "aiStatus": "AI Active" }`

### [Pillar 2: Identity & Roles]
4. **Payload #4: Identity Spoofing (Owner Forgery)**
   - Target: `create` on `/leads/fake-user`
   - Content: Trying to register a lead with an ID representing another user or hijacking user auth mapping.

5. **Payload #5: Admin Promotion Escalation**
   - Target: `create` on `/admins/attacker-uid`
   - Content: `{ "role": "admin" }` (Self-assigning to admin collection)

### [Pillar 3: State Mechanics]
6. **Payload #6: State Shortcutting / Illegal Transitions**
   - Target: `update` on `/leads/lead-1`
   - Content: `{ "stage": "Closed Won", "ghostField": "bad" }` (Updating stage without using a legitimate action/hasOnly)

7. **Payload #7: Terminal State Lock Bypass**
   - Target: `update` on `/leads/closed-lost-lead`
   - Content: `{ "score": 99 }` where existing status is already `Closed Lost` (a terminal value).

### [Pillar 4: Temporal Constraints]
8. **Payload #8: Client Timestamp Spoofing**
   - Target: `create` on `/leads/time-spoof`
   - Content: `{ "createdAt": "1999-01-01T00:00:00Z" }` (Providing back-dated client timestamps instead of `request.time`).

### [Pillar 5: PII Guards & Query Scraping]
9. **Payload #9: PII Blanket Read Harvester**
   - Target: List query on `/leads` by anonymous or non-authenticated scraper requesting full CRM tags and personal phone numbers without restrictions.

10. **Payload #10: Unauthenticated Message Injection**
    - Target: `create` on `/leads/lead-1/messages/msg-99` by non-signed-in user.

### [Pillar 6: Master Gate & Relationships]
11. **Payload #11: Sibling/Parent Orphans ID Spoofing**
    - Target: Creating a sub-collection message without the parent Lead existing.

12. **Payload #12: Sibling Value Poisoning**
    - Target: Attacking `update` on `/leads/{id}/messages` and modifying `sender` from `ai` to `lead` to pretend the client was saying things they didn't.

---

## 3. Test Runner Design

Our tests verify that each unauthorized or unvalidated request fails at the security-rules layer with dynamic permission rejections.
