DOYA Training Platform – Functional Prototype (Trainer-Only)


⸻

Scope Statement
	•	Primary user: Dog Trainer (owner of the business).
	•	Single-pane cockpit: One dashboard for operations, notes, scheduling, billing, documents, and media.
	•	Client access: Not part of this dashboard. A separate, minimal portal (or share links) may expose videos only later.
	•	Data model: Trainer is the source of truth. All records (dogs, clients, sessions, invoices) are owned by the trainer.

⸻

Dashboard (Home)

Your “what matters right now” screen. It must answer: What’s next? What’s blocked? What needs my attention?

Contents
	•	Today at a Glance: upcoming sessions (time, dog, location), travel buffers, “Start Session” shortcuts.
	•	Action Queue: unsent invoices, unsigned waivers, booking requests, overdue notes, media to review.
	•	Quick Capture: one-click “New Session,” “Add Dog,” “Add Client,” “New Booking,” “Upload Media,” “Create Invoice.”
	•	KPI Tiles: booked hours vs. capacity this week, cancellations, revenue MTD, outstanding invoices count/value.
	•	Recent Activity: last 10 events (session logged, document signed, payment recorded).
	•	Watchlist: pinned dogs/clients (e.g., reactivity cases, medical flags) with fast links.

Outcomes
	•	Start the next session in ≤2 clicks.
	•	See blockers without searching.
	•	Log a note or upload media without leaving.

⸻

Sidebar (Trainer Modules)
	•	Dashboard
	•	Sessions
	•	Dogs
	•	Clients
	•	Calendar
	•	Docs
	•	Media
	•	Billing
	•	Settings

Below is what each module must do.

⸻

Sessions

Purpose: Plan, run, and record sessions quickly and consistently.

Views
	•	List: filter by date range, dog, client, status (scheduled/completed), location (home/field/remote).
	•	Detail / Live Mode: timer, structured notes (objective → exercises → outcome), quick tags, homework field, attachments.

Core Flows
	•	Create from calendar or ad-hoc.
	•	Start timer, record exercises, attach photos/video, mark outcome.
	•	Assign homework (simple text + optional checklist).
	•	Conclude: finalize notes, auto-summary for your records.

Automations
	•	Flag incomplete notes after N hours.
	•	Suggest “copy last session template” for recurring dogs.
	•	Add “review homework” to Action Queue X days later.

⸻

Dogs

Purpose: The canonical record for each dog.

Views
	•	List: search + tags (reactive, puppy, medical).
	•	Profile: identity (breed, DOB, sex, weight), owner link, medical flags, training plan overview, sessions history, media timeline, documents.

Core Flows
	•	Create/update profile with photo and flags.
	•	Maintain a Training Plan (goals, milestones, tasks, status).
	•	Add Progress Logs outside sessions (quick note + media).
	•	Pin to Watchlist.

Signals
	•	Stagnant plan (no progress in N days).
	•	Medical review due (custom reminders you configure).

⸻

Clients

Purpose: Minimal CRM for owners.

Views
	•	List: filter by status (lead/active/lapsed).
	•	Profile: contacts, dogs, notes, sessions, invoices, documents.

Core Flows
	•	Capture lead → convert to client.
	•	Add internal notes and follow-up reminders (only visible to you).
	•	See account health (unpaid invoices, cancellations, attendance).

Non-Goals (for prototype)
	•	No client messaging inbox.
	•	No client login here.

⸻

Calendar

Purpose: Your schedule and availability.

Views
	•	Week/Month calendar with color-coded service types.
	•	Availability editor (recurring hours, exceptions, blackout dates).

Core Flows
	•	Create bookings (select client/dog/service/time).
	•	Reschedule/cancel with conflict guard.
	•	Generate suggested slots based on availability + service duration + buffers.

Optional Later
	•	Two-way sync with Google Calendar (not required for prototype, but design should allow it).

⸻

Docs

Purpose: Your legal and intake paperwork (trainer-side only).

Views
	•	Templates (waiver, intake, training plan PDF wrappers).
	•	Library attached to dogs/clients.

Core Flows
	•	Generate from template with variables filled from record data.
	•	Track status (draft/sent/signed) — trainer records of consent.
	•	Store scans or uploaded PDFs.

Non-Goals (for prototype)
	•	No e-signature pipeline required; you can attach signed files manually.
	•	No client-facing document viewer here.

⸻

Media

Purpose: Centralize photos/videos you record.

Views
	•	Library with filters (by dog, session, tag) and timeline view.
	•	Item detail with note/caption and linked entities (dog/session).

Core Flows
	•	Upload from session flow or standalone.
	•	Tag (behavior, drill, milestone).
	•	Generate a share link (read-only) for a curated set — this is the minimal client touchpoint later.

Retention
	•	Keep forever by default; allow archive after N months.

⸻

Billing

Purpose: Track money with minimal friction.

Views
	•	Invoices by status (draft/open/overdue/paid).
	•	Payments log.
	•	Products/Services list with pricing.

Core Flows
	•	Create invoice (from session or manual).
	•	Mark as paid (cash/transfer) or record reference (card/SEPA outside).
	•	Issue credit/discount manually when needed.

Non-Goals (for prototype)
	•	No Stripe checkout flows required yet.
	•	No tax exports beyond a simple CSV later.

⸻

Settings

Purpose: Your business controls.

Areas
	•	Business Profile: name, logo (for documents), preferred currency.
	•	Services: names, durations, price, buffers, on-site vs. remote.
	•	Availability: recurring hours, travel buffers, blackout days.
	•	Templates: session note skeleton, homework text presets, document boilerplates.
	•	Policies: cancellation window notes for your reference.
	•	Data Tools: export CSVs (clients, dogs, sessions, invoices).

Non-Goals (for prototype)
	•	No multi-user roles.
	•	No branding theming for public pages (since none exist yet).

⸻

Minimal Data Model (Trainer-only semantics)
	•	Client (owner) ↔ Dog(s)
	•	Dog ↔ TrainingPlan ↔ PlanTasks
	•	Booking ↔ Session (1:1)
	•	Invoice ↔ InvoiceItems ↔ Payments (manual status updates allowed)
	•	Document attached to Client or Dog
	•	Media attached to Dog and/or Session
	•	Availability defines slot suggestions

(You own all records; there are no external user accounts.)

⸻

Core Workflows (End-to-End)
	1.	Lead → Client (internal)
	•	Add lead with basic info → convert to client when ready.
	2.	Client/Dog Setup
	•	Create client → add dog → set flags → optional plan scaffold.
	3.	Booking → Session
	•	Create booking from Calendar → run session in Live Mode → finish notes, assign homework.
	4.	Post-Session
	•	Upload media (optional), write quick Progress Log, add follow-up reminder if needed.
	5.	Billing
	•	Create invoice → mark status (paid/unpaid/overdue).
	•	Dashboard shows unpaid count/value.
	6.	Docs
	•	Attach intake/waiver (scanned or generated) to client/dog records.

⸻

KPIs & Signals (Trainer view only)
	•	Booked hours vs. capacity (week).
	•	No-shows and cancellations (week/month).
	•	Unpaid invoices (count/value).
	•	Dogs with stagnant plans (no progress in N days).
	•	Action Queue aging (items older than N days).

⸻

Quality Bar (Prototype Definition of Done)
	•	Dashboard reflects live data: sessions today, Action Queue, KPIs.
	•	Sessions can be created, run with timer and structured notes, and closed with homework saved.
	•	Dogs/Clients are fully CRUD-able; plans and tasks can be added/updated.
	•	Calendar supports booking, rescheduling, cancellation with availability rules.
	•	Docs can be attached and organized by client/dog.
	•	Media can be uploaded, tagged, linked, and curated into share sets.
	•	Billing can issue invoices and record payment status.
	•	Settings allow configuration of services, availability, templates, and business profile.
	•	Everything is trainer-private; no external logins required.

⸻

Non-Goals (Prototype)
	•	No client portal/login.
	•	No e-signature or payment gateways.
	•	No multi-trainer roles or permissions.
	•	No Google/Stripe integrations.
	•	No automated emails/SMS.
	•	No analytics beyond basic KPI tiles.

⸻
IGNORE FOR NOW : 
Future: Minimal Client Media Portal (Read-Only)

When you’re ready, add a separate, simple portal:
	•	Access: per-share link or PIN (no full accounts).
	•	Content: assigned videos only; short captions.
	•	No messaging, no booking, no billing.
	•	Audit: trainer can revoke links anytime.
