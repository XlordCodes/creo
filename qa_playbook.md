# Creo — Manual QA Playbook

## Overview

This playbook provides step-by-step manual testing scripts for the 7 core user journeys in the Creo platform. Each journey includes prerequisites, explicit testing steps, expected results, edge cases, and pass/fail criteria.

**Testing Environment Requirements:**
- Local or staging deployment of both frontend (localhost:3000) and backend (localhost:8000)
- Supabase project with test data seeded
- Razorpay/Stripe in **test mode** (sandbox keys)
- MSG91 with test OTP enabled
- At least one test user per role: client, team_member, team_lead, admin, super_admin
- Browser: Chrome (latest) + Safari (latest) for cross-browser check
- Mobile: Chrome DevTools responsive mode or real device

**Pass/Fail Criteria:**
- PASS: All expected results match actual behavior
- FAIL: Any deviation from expected behavior — log in `bugs.md`
- BLOCKED: Cannot proceed due to environment or dependency issue

---

## Journey 1: Acquisition — Public Site Browsing → Sign Up → Auth

**Role:** Unauthenticated visitor
**Objective:** Verify the complete acquisition funnel from landing on the public site through account creation with both Google Auth and Phone OTP.

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 1.1 | Navigate to homepage | Open `creo.app` or `localhost:3000` | Homepage loads within 3 seconds. Hero section visible with "See Our Plans" and "Book a Call" CTAs. | |
| 1.2 | Verify nav bar | Check top navigation | Logo (left), center links (About Us, Our Work, Our Clients, Pricing, FAQ), right side (Log In + Get Started button). All links functional. | |
| 1.3 | Sticky CTA bar | Scroll down on desktop/tablet | Sticky bottom CTA bar appears: "Creo — Start growing in 7 days. [Get Started →]". Disappears at footer. Hidden on mobile. | |
| 1.4 | Exit intent popup | Move cursor to browser close (desktop only) | Exit intent popup appears once per session: "Before you go — see what we've done for businesses like yours." Dismissable via X or outside click. | |
| 1.5 | Navigate to /about | Click "About Us" in nav | About page loads with mission statement, team section, differentiators, bottom CTA ("Ready to grow your brand?" → /signup). | |
| 1.6 | Navigate to /portfolio | Click "Our Work" in nav | Portfolio page loads with case studies and filterable creative gallery (Posters / Creatives / Reels tabs). | |
| 1.7 | Navigate to /clients | Click "Our Clients" in nav | Client page loads with logo wall, testimonials with results, success stats, team profiles. | |
| 1.8 | Navigate to /pricing | Click "Pricing" in nav | Pricing page loads with 3 plan cards (Starter, Growth ★ Popular, Pro). Growth highlighted. Urgency triggers visible (scarcity counter, social proof). | |
| 1.9 | Plan pre-selection from pricing | Click "Start Growing" on Growth plan | Redirects to `/signup?plan=growth`. Growth plan pre-selected and shown on Step 2. | |
| 1.10 | Navigate to /faq | Click "FAQ" in nav | FAQ page loads with accordion items. Objection-handling copy present. Bottom CTA links to /signup. | |
| 1.11 | Begin sign-up | Click "Get Started" in nav | Navigates to `/signup` — Step 1 (Account Creation). Fields: Full Name, Email, Phone (optional with Google), Business Name. | |
| 1.12 | Sign-up — Google Auth | Enter all required fields, click "Continue with Google" | Google OAuth popup opens. Select test Google account. Redirects to `/auth/callback`. JWT issued. Account created with status "pending_payment". Redirected to `/onboarding/verify`. Email verification step skipped (Google = pre-verified). | |
| 1.13 | Sign-up — Phone OTP (fresh browser) | Clear cookies. Enter all required fields, click "Continue with Phone" | Phone number input with numeric keyboard on mobile. OTP sent via MSG91. Enter 6-digit code. JWT issued. Account created. Redirected to `/onboarding/verify`. | |
| 1.14 | OTP edge cases | Request OTP, wait for expiry (10 min) | Expired OTP shows: "Your code has expired. Request a new one." Resend button available. | |
| 1.15 | OTP resend limit | Request OTP 3 times without verifying | After 3 resends, resend button disabled. Session must be restarted. | |
| 1.16 | Duplicate account | Sign up with existing email/phone | Inline error: duplicate email/phone detected. Submission blocked. | |
| 1.17 | Already logged in | Visit /signup while authenticated | Redirected to role-appropriate home (client → /portal, team → /dashboard). | |
| 1.18 | Already logged in | Visit /login while authenticated | Redirected to role-appropriate home. | |
| 1.19 | Role-based redirect — client | Log in as completed-onboarding client | Redirected to `/portal`. | |
| 1.20 | Role-based redirect — team_member | Log in as team_member | Redirected to `/dashboard`. | |
| 1.21 | Role-based redirect — admin | Log in as admin/super_admin | Redirected to `/admin`. | |
| 1.22 | Role-based redirect — sales | Log in as sales | Redirected to `/sales`. | |
| 1.23 | Role-based redirect — investor_relations | Log in as investor_relations | Redirected to `/admin/reports`. | |
| 1.24 | Wrong-role access — client | Authenticated client visits `/dashboard/*` | Silent redirect to `/portal`. No 403 page shown. | |
| 1.25 | Wrong-role access — team_member | Authenticated team member visits `/portal/*` | Silent redirect to `/dashboard`. No 403 page shown. | |
| 1.26 | Unauthenticated access — protected route | Visit `/portal` without login | Redirected to `/login`. After login, redirected back to `/portal`. | |
| 1.27 | Logout | Click logout in sidebar | JWT invalidated, Supabase session cleared, redirected to `/login`. | |
| 1.28 | Session expiry (team) | Wait 8 hours (or mock) for internal role | Redirected to `/login` with "Session expired" message. | |
| 1.29 | Session expiry (admin) | Wait 4 hours (or mock) for admin role | Redirected to `/login` with "Session expired" message. | |
| 1.30 | Session expiry (client) | Wait 30 days (or mock) for client role | Redirected to `/login` with "Session expired" message. | |
| 1.31 | 404 page | Navigate to `/nonexistent-page` | Custom 404 page with Creo branding and link back to home. | |
| 1.32 | Mobile responsiveness | Repeat 1.1–1.10 on mobile viewport | Hamburger menu collapses center links. Plan cards stack vertically. Sticky CTA bar hidden. All pages responsive. | |
| 1.33 | Performance | Run Lighthouse on all public pages | Page load under 3 seconds on standard mobile. All images lazy-loaded. | |

---

## Journey 2: Onboarding — T&C → Payment → Questionnaire → AI Polling → Portal

**Role:** Authenticated client (post sign-up, onboarding incomplete)
**Objective:** Verify the complete 4-step onboarding gate: email verification → T&C → payment → questionnaire → portal access.

### Prerequisites
- Fresh client account created via Journey 1 (or manually seeded)
- Razorpay/Stripe test mode enabled
- OpenAI API key configured for AI analysis

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 2.1 | Visit /portal (incomplete) | Log in as client with incomplete onboarding | Redirected to first pending onboarding step (e.g., `/onboarding/verify` for phone-OTP users). | |
| 2.2 | Onboarding gate — verify step | Visit `/portal` directly | Redirected to `/onboarding/verify`. | |
| 2.3 | Onboarding gate — terms step | Skip to `/onboarding/payment` without accepting T&C | Redirected to `/onboarding/terms`. Check order enforced: verify → terms → payment → questionnaire. | |
| 2.4 | Step 1 — Email Verification | View `/onboarding/verify` | Verification email dispatched automatically. Resend button visible but disabled for 60 seconds. | |
| 2.5 | Click verification link | Open verification email, click link | Redirected to `/onboarding/terms`. Email verified status updated in DB. | |
| 2.6 | Resend verification | Click resend after 60 seconds | New verification email sent. Timer resets. | |
| 2.7 | Google OAuth skip | Log in via Google | Email verification step skipped automatically. Landed directly on `/onboarding/terms`. | |
| 2.8 | Step 2 — T&C view | View `/onboarding/terms` | Full T&C displayed in scrollable panel. "I Agree" button visible but disabled/greyed out. | |
| 2.9 | Scroll gate | Scroll to bottom of T&C panel | "I Agree" button activates (becomes clickable). | |
| 2.10 | Scroll gate bypass | Click "I Agree" without scrolling | Button remains disabled. Cannot proceed. | |
| 2.11 | Accept T&C | Scroll and click "I Agree" | T&C acceptance timestamped. Redirected to `/onboarding/payment`. | |
| 2.12 | T&C PDF download | Click download PDF link (if available) | T&C PDF downloads successfully. | |
| 2.13 | Step 3 — Payment page | View `/onboarding/payment` | Payment modal displayed. Gateway auto-detected based on country: Razorpay (India) or Stripe (international). Plan name and price shown. | |
| 2.14 | Razorpay payment | Complete payment via Razorpay (UPI test) | Payment modal processes. On success: status → Active. Redirected to `/onboarding/questionnaire`. | |
| 2.15 | Stripe payment (international) | Complete payment via Stripe (test card 4242 4242 4242 4242) | Payment modal processes. On success: status → Active. Redirected to `/onboarding/questionnaire`. | |
| 2.16 | Payment failure | Use declined test card | Error shown inline: "Payment failed." Retry button and "Try a different method" link available. Subscription status remains pending. | |
| 2.17 | Payment double-click protection | Submit payment, then rapidly click again | "Processing..." overlay shown. Double submission prevented. | |
| 2.18 | "Not satisfied with pricing?" | Click link on payment screen | Sales team notified with client details and selected plan. Client sees confirmation message. | |
| 2.19 | Step 4 — Questionnaire view | View `/onboarding/questionnaire` | 3-step form with step indicator: (1) Business Info → (2) Social Presence → (3) Content Goals. Business name pre-filled from sign-up. | |
| 2.20 | Questionnaire step 1 | Fill business info: industry, description, target audience | Fields validated inline. Can navigate to next step. | |
| 2.21 | Questionnaire step 2 | Fill social presence: Instagram, Facebook, posting frequency | All fields optional except Instagram handle. | |
| 2.22 | Questionnaire step 3 | Fill content goals: primary goal, tone (multi-select), competitors | Primary goal single-select. Tone is multi-select. Competitors optional. | |
| 2.23 | Submit questionnaire | Click submit on step 3 | Redirected to `/onboarding/complete`. AI brand analysis begins generating. | |
| 2.24 | AI polling | View `/onboarding/complete` | Animated progress indicator shown while AI analysis is generated (typically 3–8 seconds). | |
| 2.25 | AI completion | Wait for AI analysis to finish | Confirmation: "Your brand profile is ready — your team will be in touch within 7 days." "Go to your dashboard" CTA visible. | |
| 2.26 | Navigate to portal | Click "Go to your dashboard" | Redirected to `/portal`. Portal access unlocked. Dashboard shows brand summary card with one-line summary: "[Tone] voice, targeting [audience], focused on [goal]". | |
| 2.27 | Onboarding tracker | View portal dashboard | Onboarding progress tracker visible (first 7 days only). Steps: Account created (green) → Payment completed (green) → Content plan received (grey) → Content plan approved (grey). | |
| 2.28 | Questionnaire edit (within 7 days) | Go to Account → Business Profile within 7 days | Questionnaire answers editable. Changes saved. | |
| 2.29 | Questionnaire edit (after 7 days) | Attempt to edit after 7 days | Edit fields locked. Message: "Updates require a support ticket." | |
| 2.30 | Webhook — Razorpay | Razorpay sends `payment.captured` webhook | Account status → Active in DB. Webhook signature validated. | |
| 2.31 | Webhook — Stripe | Stripe sends `payment_intent.succeeded` webhook | Account status → Active in DB. Webhook signature validated. | |
| 2.32 | Payment receipt | After successful payment | Payment receipt emailed automatically. | |

---

## Journey 3: Client Operations — Dashboard → Download → Approve/Reject

**Role:** Authenticated client (onboarding complete)
**Objective:** Verify client can view the dashboard, access deliverables, download approved content, and approve or reject with comment.

### Prerequisites
- Client account with onboarding complete and subscription active
- At least one deliverable in "Pending Approval" status assigned to this client
- Supabase Storage bucket populated with test deliverable files

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 3.1 | Client dashboard | Log in and view `/portal` | Dashboard loads. Activity summary strip shows: Posters X/Y, Reels X/Y, Stories X/Y, Open tickets. Brand summary card with one-line summary. Quick access buttons: "Review Deliverables", "View Calendar", "Buy Add-ons", "Raise a Ticket". | |
| 3.2 | Pending actions | View dashboard pending card | Deliverables awaiting approval shown with count and "Review Now" link. Tickets awaiting response shown. Payment due reminder (if within 3 days). | |
| 3.3 | Recent notifications | View dashboard notifications | Last 5 system notifications displayed. "View all" link to full history. | |
| 3.4 | Navigate to deliverables | Click "Review Deliverables" or sidebar link | `/portal/deliverables` loads. Card grid view with deliverables. Filter bar (type, status). Default: pending-approval first, sorted by submission date. | |
| 3.5 | Deliverable — pending status | View a deliverable with "Pending Approval" status | Card shows type icon, title, status badge "Pending Approval", submitted date. Click to open detail. | |
| 3.6 | Deliverable detail — poster | Open a poster deliverable | Full-size image displayed. "Approve" and "Reject" buttons visible. Download button visible but LOCKED (greyed out). | |
| 3.7 | Deliverable detail — reel | Open a reel deliverable | Inline video player with play/pause/seek controls. "Approve" and "Reject" buttons visible. Download button LOCKED. | |
| 3.8 | Approve deliverable | Click "Approve" on a poster | Status → Approved. Download button becomes active (clickable). Creative team notified. Optional comment box available. | |
| 3.9 | Download approved deliverable | Click "Download" on approved deliverable | Signed Supabase Storage URL generated. File downloads successfully. File format correct (JPG/PNG for poster). | |
| 3.10 | Reject deliverable | Click "Reject" on a deliverable | Mandatory comment box slides open below Reject button. Cannot submit rejection without a comment. | |
| 3.11 | Reject — empty comment | Click "Reject", leave comment empty, click submit | Submission blocked. Validation error: "Please provide a reason for rejection." | |
| 3.12 | Reject — with comment | Enter comment, submit rejection | Status → Rejected. Revision task auto-created internally. 24-business-hour clock starts. Client sees "Revision In Progress" status. | |
| 3.13 | Revised deliverable arrives | Team submits revision | Client receives notification: "Your revised [type] is ready for review." Deliverable card shows status "Revised — Pending Approval". New version shown in detail view. | |
| 3.14 | Approve revised deliverable | Approve the revised version | Status → Approved. Download unlocked. Revision count incremented. | |
| 3.15 | Revision limit — Starter plan | Starter client rejects after 1 round | Admin intervenes. Notification sent to admin. Client sees status update. | |
| 3.16 | Revision limit — Growth plan | Growth client rejects after 2 rounds | Admin intervenes. Escalation created. | |
| 3.17 | Revision limit — Pro plan | Pro client rejects after 3 rounds | Admin intervenes. Escalation created. | |
| 3.18 | Empty deliverables state | Filter delivers with no matches | Message: "No [type] deliverables match your filter." Link to clear filter. | |
| 3.19 | No deliverables yet | View deliverables with none assigned | Message: "No content yet — your team is working on your first batch." Expected delivery date shown if within 7-day window. | |
| 3.20 | File size limit — image | Attempt upload > 10MB image (if team workflow) | Frontend validation: "File exceeds maximum size (10MB for images)." Upload blocked. | |
| 3.21 | File size limit — video | Attempt upload > 500MB video (if team workflow) | Frontend validation: "File exceeds maximum size (500MB for videos)." Upload blocked. | |
| 3.22 | Content calendar view | Navigate to `/portal/calendar` | Monthly grid view and list/agenda view toggle. Entries show type icon, title, scheduled date, status. Read-only for clients. | |
| 3.23 | Click calendar entry | Click an entry with linked deliverable | Opens linked deliverable detail page. | |
| 3.24 | Empty calendar state | View calendar with no entries | Message: "Your content calendar is being set up — check back after your content plan is approved." | |
| 3.25 | Payments page | Navigate to `/portal/payments` | Current plan card: name, price, deliverables, next billing date, "Change Plan" button. Payment history table with "Download Receipt" per row. | |
| 3.26 | Plan upgrade | Click "Change Plan" → select higher plan | Upgrade prorated charge for remaining days. Payment modal opens. On success: plan updated, confirmation email sent, toast shown. | |
| 3.27 | Plan downgrade | Click "Change Plan" → select lower plan | Confirmation modal: "Are you sure? Your deliverable quota will reduce from next billing cycle." Confirm / Cancel. | |
| 3.28 | Lapsed subscription | View portal with expired/lapsed subscription | Portal loads in read-only mode. Banner: "Your subscription has lapsed. Renew to restore full access." CTA → `/portal/payments`. | |
| 3.29 | Notifications — deliverable ready | Team submits deliverable | In-portal alert + email: "Your [type] is ready for review." | |
| 3.30 | Notifications — payment due | 3 days before renewal | Portal + Email: "Your subscription renews in 3 days." | |
| 3.31 | Account settings | Navigate to `/portal/account` | Business profile, password change, Instagram connection, 2FA toggle visible. | |

---

## Journey 4: Client Support & Upsell — Support Ticket → Add-on Purchase

**Role:** Authenticated client (onboarding complete)
**Objective:** Verify client can submit a support ticket with different types, participate in chat thread, and purchase add-on deliverables.

### Prerequisites
- Authenticated client with active subscription
- At least one deliverable approved (for add-on upsell context)
- Test payment gateway configured

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 4.1 | Support page — empty | Navigate to `/portal/support` with no tickets | Message: "No tickets yet. Need help?" with "Raise a Ticket" button. | |
| 4.2 | Raise a ticket | Click "Raise a Ticket" | New ticket form opens (drawer on desktop, full-screen on mobile). | |
| 4.3 | Ticket type selector | View dropdown options | Types: Deliverable Revision, General Support, Billing Issue, Content Brief Update. | |
| 4.4 | Submit — Deliverable Revision | Select type, fill subject + description, link specific deliverable, submit | Ticket created with status "Open". Confirmation shown. Unique ticket ID generated. Creative team + admin notified. | |
| 4.5 | Submit — General Support | Select type, fill form, submit | Routed to chatbot first, then admin. | |
| 4.6 | Submit — Billing Issue | Select type, fill form, submit | Routed to chatbot first, then admin → sales team. | |
| 4.7 | Submit — Content Brief Update | Select type, fill form, submit | Routed to admin → assigned creative team. | |
| 4.8 | Submit — with attachment | Attach a file (under 25MB) | File uploaded and visible in ticket. Attachment limit respected. | |
| 4.9 | Submit — attachment too large | Attach file > 25MB | Validation error: "File exceeds maximum size (25MB)." Upload blocked. | |
| 4.10 | Ticket detail — chat thread | Open `/portal/support/[id]` | Ticket detail page. Chat thread with messages. Client can send messages and attach files. | |
| 4.11 | Send message in thread | Type message, click send | Message appears in thread. Real-time update if Supabase Realtime active. | |
| 4.12 | Team reply | Team member replies in thread (or mock) | Client notified: "New message on ticket #[ID]." Message appears in thread. Email notification sent. | |
| 4.13 | Ticket status update | Team updates ticket status | Client sees status change. Notification: "Update on ticket #[ID]." Email sent. | |
| 4.14 | Resolve ticket | Team marks ticket resolved | Status → Resolved. Client can reopen within 7 days. | |
| 4.15 | Reopen ticket | Click "Reopen" on resolved ticket (within 7 days) | Ticket status → Open. Thread reactivated. | |
| 4.16 | Reopen — after 7 days | Attempt reopen after 7 days | Reopen button unavailable or disabled. | |
| 4.17 | Support — from dashboard | Click "Raise a Ticket" from dashboard quick-access | Same new ticket form opens. | |
| 4.18 | Add-on page — no orders | Navigate to `/portal/addons` | Message: "No add-on orders yet." Add-on type cards shown to encourage purchase. | |
| 4.19 | Add-on — view types | View available add-ons | 3 types: Poster, Reel, Story. Unit prices displayed. Quantity selector. | |
| 4.20 | Add-on — select quantity | Set quantity to 2 for reels | Quantity updated. Optional content brief field. | |
| 4.21 | Add-on — purchase | Click "Buy Now" | Order summary: "2 x Reel = [total]." Payment modal opens. | |
| 4.22 | Add-on — payment success | Complete add-on payment | Receipt emailed. In-portal: "Your add-on order has been received — delivery within 3 business days." | |
| 4.23 | Add-on — tasks auto-created | After successful add-on purchase | 2 reel tasks auto-created internally and assigned to video editor. | |
| 4.24 | Add-on — deliverables appear | View `/portal/deliverables` | Two new reel cards tagged "Add-on" with status "Pending Approval". | |
| 4.25 | Add-on — payment failure | Decline add-on payment | Error shown with retry option. | |
| 4.26 | Upsell prompt | Approve a poster deliverable | Prompt appears: "Love this? Get more this month — add extra posters from [price]." Links to `/portal/addons`. | |
| 4.27 | Add-on notification | Add-on deliverable submitted by team | Client notified: "Your add-on [type] is ready for review." Portal + email. | |
| 4.28 | Previous orders | View add-on purchase history | Past orders listed with delivery status. | |

---

## Journey 5: Internal Execution — Calendar → Task Request → Upload → Submit

**Role:** team_member
**Objective:** Verify team member can view their pre-assignment calendar, request a task, upload a deliverable to Supabase, and mark the task as submitted.

### Prerequisites
- team_member account with assigned tasks in the system
- Supabase Storage accessible for file uploads
- At least one task in "Pending" or "In Progress" status

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| 5.1 | Login | Log in as team_member | Redirected to `/dashboard`. Dashboard loads with daily goal metrics and today's tasks. | |
| 5.2 | Dashboard metrics | View dashboard | Daily goal metrics: Posters today / 6, Stories today / 3 (graphics) or Reels today / 4 (video). Today's tasks listed, sorted by client priority tier (Pro → Growth → Starter). | |
| 5.3 | View task list | Navigate to `/dashboard/tasks` | Tasks page with tabs: Today (default) / Upcoming / All. Tasks sorted by priority. | |
| 5.4 | Today's tasks tab | View "Today" tab | Tasks due today or overdue shown. Priority-sorted. Overdue tasks flagged red. | |
| 5.5 | Upcoming tasks tab | View "Upcoming" tab | Tasks for next 7 days shown. | |
| 5.6 | All tasks tab | View "All" tab | Full list with filters available. | |
| 5.7 | Open task detail | Click a task | `/dashboard/tasks/[id]` loads. Task card shows: client name, deliverable type, content brief (from AI analysis + content plan), due date, assignment date, status, linked calendar entry. | |
| 5.8 | Mark "In Progress" | Click "In Progress" on a pending task | Status updated to "In Progress". Task clock noted internally. | |
| 5.9 | My Calendar — 1-day pre-assignment | Navigate to `/dashboard/calendar` | Calendar view shows entries one day before the client's scheduled date. Team must submit deliverable the day before it appears on client calendar. Colour-coded: grey (pending), blue (in progress), green (submitted), red (overdue). | |
| 5.10 | Upload deliverable | On task detail, click file upload | File picker opens. Select file (JPG/PNG for posters, MP4 for reels). | |
| 5.11 | Upload — poster | Upload JPG/PNG file under 10MB | File uploads to Supabase Storage. Upload progress shown. File appears in task card preview. | |
| 5.12 | Upload — reel | Upload MP4 file under 500MB | File uploads to Supabase Storage. Video preview available. | |
| 5.13 | Upload — file too large | Attempt upload exceeding limits | Validation error before upload: "File exceeds maximum size." | |
| 5.14 | Submit deliverable | Click "Submit Deliverable" after upload | File sent to Supabase Storage. Status → "Submitted". Client receives notification: "Your [type] is ready for review." Deliverable appears in client portal as "Pending Approval". | |
| 5.15 | Submit without file | Click "Submit Deliverable" without uploading | Submission blocked. Validation error: "Please upload a deliverable before submitting." | |
| 5.16 | Client approves | (Simulate client approval) | Task status → Approved. Team member sees confirmation on task card. | |
| 5.17 | Client rejects | (Simulate client rejection with comment) | Task status → Revision. Team member sees rejection comment. 24-hour clock shown on task card. | |
| 5.18 | Revision resubmission | Upload revised file and submit | Revised deliverable pushed to client portal. Status → "Revised — Pending Approval". | |
| 5.19 | Self-assignment | View pending queue, click "Request Assignment" | Request sent to team lead for approval. | |
| 5.20 | Self-assignment — approved | (Team lead approves) | Task assigned to this team member. Appears in their task list. | |
| 5.21 | No tasks today | View tasks on day with none due | Message: "No tasks due today." with "View Upcoming Tasks" link. | |
| 5.22 | Live chat | Navigate to `/dashboard/chat/[client_id]` | Chat thread with assigned client. Real-time messaging. File/image attachments supported (max 25MB). | |
| 5.23 | Leave request | Navigate to `/dashboard/leave` | Leave request list + new request form. | |
| 5.24 | Submit leave request | Fill dates + reason, submit | Request created. Admin notified for approval. 7-day advance notice enforced. | |
| 5.25 | Capacity adjustment on leave | (Admin approves leave) | Team member marked inactive for leave dates. Capacity calculations auto-updated. Tasks on leave days flagged. | |

---

## Journey 6: Team Oversight — KPI Capacity Bars → Task Approval → Custom Pricing

**Role:** team_lead / sales
**Objective:** Verify team leads can view KPI capacity metrics, approve task assignments, and the sales pipeline handles custom pricing requests.

### Prerequisites
- team_lead account with team members assigned
- sales account with client pipeline access
- At least one pending task assignment request
- At least one pending custom pricing request

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **Team Lead — KPI & Task Approval** | | | | |
| 6.1 | Login as team_lead | Log in | Redirected to `/dashboard`. Team Overview link visible in sidebar (team_lead only). | |
| 6.2 | KPI Dashboard | Navigate to `/kpi` | KPI Dashboard loads. Live metric cards visible. Delivery rate metric. Capacity bars showing per-team-member workload vs daily cap. Role-filtered view. | |
| 6.3 | Capacity bars detail | Inspect capacity bars | Each team member's bar shows: tasks assigned / daily cap. Colour-coded: green (under capacity), amber (at capacity), red (over capacity). | |
| 6.4 | Team Overview | Navigate to `/dashboard/team` | Per-member metrics: tasks completed, pending, on-time rate. Individual performance view. | |
| 6.5 | Approve self-assignment | View pending assignment requests | Self-assignment requests from team members listed. Click "Approve" on a request. Task reassigned to requesting member. | |
| 6.6 | Reject self-assignment | Click "Reject" on a request | Request denied. Task remains in pending queue or with original assignee. | |
| 6.7 | Reassign task | Open a task, click "Reassign" | Team member selector shown. Select new assignee. Task reassigned. Reassignment logged with timestamp and reason. | |
| 6.8 | Reassignment log | View task after reassignment | Task card shows reassignment history: who reassigned, to whom, timestamp, reason. | |
| **Sales — Custom Pricing Pipeline** | | | | |
| 6.9 | Login as sales | Log in | Redirected to `/sales`. Sales dashboard loads. | |
| 6.10 | Client pipeline | Navigate to `/sales/clients` | Client pipeline view. List of clients with status (lead, in-negotiation, converted, lost). | |
| 6.11 | "Not satisfied with pricing?" trigger | (Client clicks link on payment page) | Sales notified with client details and selected plan. New entry in pipeline. | |
| 6.12 | Review client details | Open a client in pipeline | Client account details, selected plan, AI brand analysis (read-only), interaction history. | |
| 6.13 | Offer standard discount | Submit discount ≤ 10% | Discount applied without admin approval. Custom pricing generated. Payment link auto-created. | |
| 6.14 | Submit discount > 10% | Submit discount above 10% | Requires admin approval. Request submitted to admin panel. Status: "Pending Admin Approval." | |
| 6.15 | Custom pricing form | Navigate to `/sales/pricing` | Custom pricing requests listed. Form for new request. | |
| 6.16 | Lost — No Response | No client response for 7 days | Status → "Lost — No Response." Client account retained 30 days. | |
| 6.17 | Lost — Declined | Client declines all offers | Status → "Lost — Declined." | |
| 6.18 | Convert client | Client accepts offer | Status → "Converted." Payment link used. Subscription activated. | |

---

## Journey 7: Admin Platform — MRR Dashboard → Custom Pricing → Reports → Escalation

**Role:** admin / super_admin
**Objective:** Verify admin can view MRR and platform health metrics, approve custom pricing requests, generate PDF/Excel reports, and resolve escalations.

### Prerequisites
- admin or super_admin account
- At least one pending custom pricing request (from Journey 6)
- At least one active escalation
- Celery worker running for report generation
- Test data: clients, tasks, deliverables, tickets, escalations

### Test Cases

| # | Step | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **Admin Dashboard & Client Management** | | | | |
| 7.1 | Login as admin | Log in | Redirected to `/admin`. Admin panel loads with Deep Navy sidebar. | |
| 7.2 | Admin Dashboard | View `/admin` | Platform health overview: total clients, active subscriptions, MRR, team capacity, recent activity. | |
| 7.3 | Client Management | Navigate to `/admin/clients` | Full client list with search and filter (by plan, status, onboarding stage). Pagination if > 20 clients. | |
| 7.4 | Empty clients state | View with no clients | Message: "No clients yet. Share your pricing page to get started." | |
| 7.5 | Client Profile | Click a client name | `/admin/clients/[id]` loads. Two-panel layout. Left: client details, plan, subscription status. Right: AI analysis (full), onboarding status, task history, deliverables, tickets. | |
| 7.6 | Team Management | Navigate to `/admin/teams` | Departments listed. Employee list with roles, daily caps, current workload. | |
| 7.7 | Leave Approvals | Navigate to `/admin/leave` (or section within teams) | Pending leave requests shown. Approve / Reject buttons. | |
| 7.8 | Approve leave | Click "Approve" on a leave request | Leave approved. Team member marked inactive for leave dates. Capacity auto-adjusted. | |
| 7.9 | Reject leave | Click "Reject" with reason | Leave rejected. Team member notified. | |
| **Custom Pricing Approval** | | | | |
| 7.10 | View custom pricing requests | Navigate to `/admin/sales` | Pending requests from sales team listed. Each shows: client, proposed discount, requested plan, sales notes. | |
| 7.11 | Approve custom pricing | Click "Approve" on a request | Pricing approved. System auto-generates payment link for custom amount. Sales notified. Custom pricing valid for max 3 months. | |
| 7.12 | Reject custom pricing | Click "Reject" with reason | Request rejected. Sales notified. | |
| 7.13 | Counter-propose | Edit discount amount, submit | Counter-proposal sent to sales. Sales can accept or negotiate. | |
| **Escalation Management** | | | | |
| 7.14 | View escalations | Navigate to `/admin/escalations` | Active and historical escalations listed. Severity, client, team member, SLA breach time shown. | |
| 7.15 | Empty escalations state | View with no active escalations | Green banner: "All clear — no active escalations." Count of resolved escalations this week shown. | |
| 7.16 | Escalation — SLA breach | (Task not submitted within 3 business days) | Escalation auto-created. Shows task details, delivery history, client context. | |
| 7.17 | Review escalation detail | Click an escalation | Full context: task info, team member, client, timeline, delivery history. | |
| 7.18 | Resolve — reassign | Reassign task to another team member | Task reassigned. Escalation status → Resolved. Timestamp logged. | |
| 7.19 | Resolve — contact client | Contact client via WhatsApp about delay | Action logged. Escalation status → Resolved. | |
| 7.20 | Revision escalation | Revision not resubmitted in 24 business hours | Admin escalated immediately. Must intervene. | |
| **Reports & Exports** | | | | |
| 7.21 | Admin Reports | Navigate to `/admin/reports` | Reports page loads with options: Weekly, Monthly, Financial. | |
| 7.22 | Generate weekly report | Click "Generate Weekly Report" | Celery task triggered. Report generates (may take a few seconds). | |
| 7.23 | View weekly report | Open generated report | Report displays: tasks completed, SLA adherence, team performance, escalations. | |
| 7.24 | Export PDF | Click "Export PDF" | PDF file downloads. Content matches report view. ReportLab/WeasyPrint generated. | |
| 7.25 | Export Excel | Click "Export Excel" | Excel file downloads. Data in structured columns. openpyxl generated. | |
| 7.26 | Generate monthly report | Click "Generate Monthly Report" | Monthly report generated with broader metrics. | |
| 7.27 | Generate financial report | Click "Generate Financial Report" | Financial report: MRR, revenue by plan, payment failures, refunds. | |
| 7.28 | Investor Relations access | Log in as investor_relations | Redirected to `/admin/reports`. Can view reports and KPI. Cannot access other `/admin/*` routes. | |
| **KPI Dashboard** | | | | |
| 7.29 | KPI Dashboard — admin view | Navigate to `/kpi` | Live metric cards: total clients, active tasks, delivery rate, SLA adherence. Capacity bars for all teams. | |
| 7.30 | KPI — investor_relations view | Log in as investor_relations, navigate to `/kpi` | KPI dashboard accessible. Role-filtered metrics shown. | |
| **Announcements & Settings** | | | | |
| 7.31 | Announcements | Navigate to `/admin/announcements` | Announcements list (MoM, newsletter, general). New announcement button. | |
| 7.32 | Create announcement | Fill title, content, target departments, upload attachment | Announcement posted. Targeted teams notified. | |
| 7.33 | Platform Settings | Navigate to `/admin/settings` | Pricing editors (per-plan prices), SLA thresholds (business days/hours), scarcity counter editor. | |
| 7.34 | Edit scarcity counter | Change scarcity number, save | Pricing page updated immediately. Counter reflects new value. | |
| 7.35 | Edit SLA thresholds | Change SLA values, save | System uses new thresholds for escalation logic. | |
| **Cross-cutting Admin** | | | | |
| 7.36 | Consolidated calendar | Navigate to `/admin/calendar` | All client calendars in one view. Filterable by client, team member, type, status. Admin can edit entries. | |
| 7.37 | Add-on orders | Navigate to `/admin/addons` | All add-on orders listed with status. | |
| 7.38 | Notifications | Bell icon in admin panel | Unread notification count. Dropdown with recent notifications. | |
| 7.39 | Session timeout — admin | Wait 4 hours (or mock) | Redirected to `/login` with "Session expired" message. | |
| 7.40 | Role — admin can access /dashboard | Admin visits `/dashboard/*` | Access granted. Admin has access to all routes. | |
| 7.41 | Role — investor_relations restricted | investor_relations visits `/admin/clients` | Redirected to `/admin/reports`. Access only to reports + KPI. | |

---

## Appendix A: Cross-cutting Tests

These tests apply across multiple journeys.

| # | Test | Steps | Expected | Journey |
|---|---|---|---|---|
| A.1 | Skeleton loaders | Navigate to any data-fetching page | Skeleton loaders shown (not spinners) while content loads. | 3, 4, 5, 6, 7 |
| A.2 | Toast notifications | Trigger any success/error action | Toast notification appears with appropriate message and auto-dismisses. | All |
| A.3 | Network error | Disconnect network, trigger API call | Toast: "Something went wrong. Please try again." With retry button. | All |
| A.4 | Loading overlay — payment | Submit payment | "Processing..." overlay shown to prevent double-clicks. | 2, 4 |
| A.5 | Meta tags — public pages | View source of all public pages | Unique meta title and description per page. OpenGraph tags present. | 1 |
| A.6 | LocalBusiness schema | View home page source | LocalBusiness JSON-LD schema markup present. | 1 |
| A.7 | Image optimization | Check all images on public pages | Next.js Image component used. Images lazy-loaded. Proper alt text. | 1 |
| A.8 | Keyboard navigation | Tab through all interactive elements on each page | All interactive elements focusable and operable via keyboard. | All |
| A.9 | Colour contrast | Run automated contrast check on all pages | WCAG 2.1 AA minimum contrast ratios met. | 1, 3 |
| A.10 | Mobile responsiveness | Test all pages at 375px, 768px, 1024px widths | All pages responsive. No horizontal scroll. Touch targets ≥ 44px. | All |

## Appendix B: Role Access Matrix Quick Reference

| Route Pattern | client | team_member | team_lead | sales | admin | super_admin | investor_relations |
|---|---|---|---|---|---|---|---|
| /portal/* | ✅ | ❌ → /dashboard | ❌ → /dashboard | ❌ → /sales | ✅ | ✅ | ❌ → /admin/reports |
| /dashboard/* | ❌ → /portal | ✅ | ✅ | ❌ → /sales | ✅ | ✅ | ❌ → /admin/reports |
| /sales/* | ❌ → /portal | ❌ → /dashboard | ❌ → /dashboard | ✅ | ✅ | ✅ | ❌ → /admin/reports |
| /admin/* (not /reports) | ❌ → /portal | ❌ → /dashboard | ❌ → /dashboard | ❌ → /sales | ✅ | ✅ | ❌ → /admin/reports |
| /admin/reports | ❌ → /portal | ❌ → /dashboard | ❌ → /dashboard | ❌ → /sales | ✅ | ✅ | ✅ |
| /kpi | ❌ → /portal | ❌ → /dashboard | ✅ | ❌ → /sales | ✅ | ✅ | ✅ |
