# INVITOR — Complete Code Structure, Features & Workflow

> **INVITOR** is a full-stack Event Invitation & Booking Platform.  
> Users can browse events, book tickets, and pay online. Admins can create/manage events, scan QR gate passes, broadcast emails, and view analytics.

---

## 📁 Project Root Layout

```
INVITOR - Copy/
├── backend/              → Node.js + Express REST API
├── frontend/             → React + Vite SPA
├── package.json          → Root-level concurrently scripts (runs both dev servers)
├── vercel.json           → Deployment config for Vercel
└── Invitor_Postman_collection.json  → API testing collection
```

The root `package.json` uses **concurrently** to run both `backend` and `frontend` dev servers with a single `npm run dev` command.

---

## 🔵 BACKEND — Node.js + Express + MongoDB

### Tech Stack
| Tool | Purpose |
|------|---------|
| Express.js | HTTP server & routing |
| Mongoose | MongoDB ODM (schema + queries) |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth tokens |
| Nodemailer | Email OTP sending |
| Twilio/SMS | SMS OTP sending |
| dotenv | Environment variables |
| cors | Cross-origin requests |

---

### Backend Folder Structure

```
backend/
├── index.js              → Entry point (server setup)
├── .env                  → Secrets (MongoDB URI, JWT secret, SMTP, etc.)
├── routes/
│   ├── auth.js           → /api/auth → register, login, verify-otp
│   ├── invites.js        → /api/invites → CRUD for events
│   ├── booking.js        → /api/bookings → book, pay, cancel, check-in
│   └── admin.js          → /api/admin → QR verify, broadcast, audit logs, payment settings
├── controllers/
│   ├── authController.js     → User registration, login, OTP logic
│   ├── inviteController.js   → Event CRUD logic
│   └── bookingController.js  → Booking + payment logic
├── models/
│   ├── User.js           → User schema
│   ├── Invite.js         → Event/Invite schema
│   ├── Bookings.js       → Booking schema
│   ├── OTP.js            → OTP schema (auto-expires in 5 min)
│   ├── AuditLog.js       → Admin action log schema
│   └── PaymentSettings.js → UPI/Stripe settings schema
├── middleware/
│   └── auth.js           → protect (JWT check) + admin (role check)
├── utils/
│   ├── email.js          → Nodemailer OTP email sender
│   └── sms.js            → Twilio SMS OTP sender
└── seed.js               → Pre-populates DB with sample events
```

---

### 1. `index.js` — Server Entry Point

**What it does:**
- Loads environment variables from `.env`
- Sets up **CORS** and **JSON body parsing**
- Implements **Serverless MongoDB connection caching** (`isConnected` flag) — avoids reconnecting on every Vercel serverless function call
- Runs `connectDB()` immediately if running locally (not on Vercel)
- Adds a **per-request DB middleware** — every API call ensures DB is connected before proceeding
- Mounts 4 route groups:
  - `POST /api/auth` → auth routes
  - `GET/POST/PUT/DELETE /api/invites` → event routes
  - `GET/POST/PUT/DELETE /api/bookings` → booking routes
  - `GET/POST /api/admin` → admin-only routes
- If **not on Vercel**: serves React's built `dist/` folder as static files, and starts `app.listen(PORT)`
- If **on Vercel**: exports `app` as a serverless function

**Key design decision:** `connectDB()` uses a cached `isConnected` flag so on Vercel (where functions restart per request), it doesn't open a new DB connection every time.

---

### 2. Database Models (MongoDB Schemas)

#### `User.js`
```
Fields: name, email (unique+sparse), mobile (unique+sparse), password (hashed), role ('user'|'admin'), isVerified (bool)
```
- Both `email` and `mobile` use **sparse indexes** so either one can be null without breaking the unique constraint
- `isVerified` starts `false` — user must verify via OTP before they can log in

#### `Invite.js` (Events)
```
Fields: title, description, date, location, category, totalSeats, availableSeats, ticketPrice, imageUrl, backgroundType ('default'|'image'|'video'), backgroundImage, backgroundVideo, createdBy (ref: User)
```
- Supports 3 background types per event: **default gradient, custom image, or video**
- `availableSeats` is decremented when a booking is confirmed

#### `Bookings.js`
```
Fields: userId, inviteId, eventId (legacy), status ('pending'|'confirmed'|'cancelled'), paymentStatus ('paid'|'unpaid'|'refunded'|'pending'|'not_paid'), amount, paymentMethod, paymentReference, upiId, paidAt, checkedIn (bool)
```
- `eventId` kept for backward compatibility with old records
- `checkedIn` is flipped to `true` when admin scans the QR code at gate

#### `OTP.js`
```
Fields: email (primary identifier), otp (6-digit string), action ('account_verification'|'invite_booking'), createdAt (TTL: 300 seconds)
```
- Uses **MongoDB TTL index** — OTP documents auto-delete after 5 minutes

#### `AuditLog.js`
```
Fields: adminId, adminName, action (string), targetId, details, timestamp
```
- Records every critical admin action for accountability

#### `PaymentSettings.js`
```
Fields: upiId, merchantName, qrCodeUrl, stripeEnabled (bool), upiEnabled (bool), updatedBy (ref: User)
```
- Single-document collection — stores global payment gateway configuration

---

### 3. Middleware — `middleware/auth.js`

Two exported middleware functions:

#### `protect` — JWT Authentication
**Step-by-step:**
1. Reads `Authorization: Bearer <token>` header
2. Verifies token with `jwt.verify()` using `JWT_SECRET`
3. Looks up the user from DB (`User.findById(decoded.id)`)
4. Attaches `req.user` for downstream handlers
5. Returns `401` if token is missing, invalid, or user not found

#### `admin` — Role Authorization
**Step-by-step:**
1. Checks if `req.user.role === 'admin'`
2. Calls `next()` if admin, returns `403 Forbidden` otherwise

**Usage pattern:**
```
router.post('/', protect, bookInvite)            → any logged-in user
router.put('/:id', protect, admin, updateInvite) → admin only
router.get('/', getAllInvites)                    → public (no auth)
```

---

### 4. `authController.js` — Authentication Logic

#### `registerUser` — POST /api/auth/register
**Step-by-step:**
1. Validates that at least `email` OR `mobile` is provided
2. Checks for duplicate user (searches by email OR mobile using `$or`)
3. Hashes password with `bcrypt.genSalt(10)` + `bcrypt.hash()`
4. Creates user with `isVerified: false`
5. Generates 6-digit random OTP
6. Saves OTP to `OTP` collection
7. Sends OTP via **Email** (if email provided) OR **SMS** (if mobile provided)
8. Returns success message — does **NOT** return a token yet

#### `loginUser` — POST /api/auth/login
**Step-by-step:**
1. Finds user by email OR mobile
2. Compares submitted password with stored hash using `bcrypt.compare()`
3. If user is **not verified** (and role is `user`): sends a fresh OTP, returns `400` error
4. If verified: returns user data + JWT token (expires in `7d`)

#### `verifyOTP` — POST /api/auth/verify-otp
**Step-by-step:**
1. Looks up matching OTP record by email + otp value + action type
2. If found: marks user as `isVerified: true`
3. Deletes all OTP records for that user (cleanup)
4. Returns user data + JWT token — user is now fully logged in

---

### 5. `inviteController.js` — Event CRUD

| Function | Route | Auth | What it does |
|----------|-------|------|--------------|
| `getAllInvites` | GET /api/invites | Public | Returns all events sorted by date |
| `getInviteById` | GET /api/invites/:id | Public | Returns single event details |
| `createInvite` | POST /api/invites | Admin | Creates event, sets `createdBy` to admin's ID |
| `updateInvite` | PUT /api/invites/:id | Admin | Updates event fields |
| `deleteInvite` | DELETE /api/invites/:id | Admin | Deletes event and all associated bookings |

---

### 6. `bookingController.js` — Booking & Payment Logic

#### `bookInvite` — POST /api/bookings
**Step-by-step:**
1. Checks if user already has a booking for this event
2. Checks `availableSeats > 0`
3. Creates booking with `status: 'confirmed'`, `paymentStatus: 'not_paid'`
4. Decrements `availableSeats` on the invite
5. Returns the new booking

#### `sendBookingOTP` — POST /api/bookings/send-otp
- Generates OTP with `action: 'invite_booking'`
- Sends via email or SMS for payment verification

#### `processBookingPayment` — POST /api/bookings/:id/pay
**Step-by-step:**
1. Finds the booking by ID
2. Validates payment method (UPI or Stripe)
3. Updates booking: `paymentStatus: 'paid'`, `paymentMethod`, `paymentReference`, `paidAt`
4. Returns updated booking

#### `getMyBookings` — GET /api/bookings/my
- Returns all bookings for the logged-in user
- Populates event details (title, date, location, imageUrl, etc.)

#### `cancelBooking` — DELETE /api/bookings/:id
**Step-by-step:**
1. Finds booking, ensures it belongs to the current user
2. Sets `status: 'cancelled'`
3. **Increments** `availableSeats` back on the invite

#### `checkInGatePass` — PUT /api/bookings/verify-gatepass
- Verifies a booking by ticket ID
- Sets `checkedIn: true`

#### `getPaymentSettings` / `updatePaymentSettings`
- Fetches or updates the global UPI/Stripe payment settings from `PaymentSettings` collection

---

### 7. `admin.js` Route — Admin-Only Operations

| Route | Purpose |
|-------|---------|
| POST /api/admin/bookings/verify-qr | QR gate scanner — marks ticket as checked in |
| POST /api/admin/broadcast | Sends email broadcast to all confirmed attendees of an event |
| GET /api/admin/audit-logs | Returns last 50 admin action logs |
| GET /api/admin/payment-settings | Fetch payment config |
| PUT /api/admin/payment-settings | Update payment config |

---

### 8. Utils

#### `utils/email.js` — Nodemailer
- Configured with SMTP credentials from `.env`
- `sendOTPEmail(email, otp, action)` → sends HTML-formatted OTP email

#### `utils/sms.js` — Twilio/SMS Gateway
- `sendOTPSMS(mobile, otp)` → sends OTP via SMS to mobile number

---

## 🟢 FRONTEND — React + Vite + TailwindCSS

### Tech Stack
| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool + dev server |
| React Router DOM | Client-side routing |
| TailwindCSS | Utility-first CSS |
| Axios | HTTP client |
| Context API | Global state (Auth + Theme) |

---

### Frontend Folder Structure

```
frontend/src/
├── main.jsx              → App entry point (wraps with context providers)
├── App.jsx               → Root router + layout
├── index.css             → Global styles + Tailwind directives
├── pages/
│   ├── Home.jsx              → Landing page (event listings)
│   ├── InviteDetail.jsx      → Single event detail + booking
│   ├── Login.jsx             → Login form + OTP verification
│   ├── Register.jsx          → Registration form + OTP verification
│   ├── UserDashboard.jsx     → User's booked events + tickets
│   ├── AdminDashboard.jsx    → Admin event management panel
│   ├── AnalyticsDashboard.jsx → Charts + statistics
│   ├── CheckInStation.jsx    → QR scanner gate check-in
│   ├── EventHub.jsx          → Event-specific hub page
│   ├── PaymentSuccess.jsx    → Payment success landing
│   └── PaymentFailed.jsx     → Payment failure landing
├── components/
│   ├── Navbar.jsx                → Top navigation bar
│   ├── BackgroundLayer.jsx       → Global dynamic background (video/image/gradient)
│   ├── FloatingThemeButton.jsx   → Floating button to open theme customizer
│   ├── ThemeCustomizerModal.jsx  → Full theme + background customizer modal
│   ├── PaymentCheckoutModal.jsx  → Payment modal (UPI QR + Stripe)
│   ├── NotificationBell.jsx      → Notification bell icon
│   └── engage/                   → Sub-components for engagement features
├── context/
│   ├── AuthContext.jsx       → Global auth state (user, login, logout, register, verifyOTP)
│   └── ThemeContext.jsx      → Global theme + background state
└── utils/
    └── axios.js              → Axios instance with base URL + auth header interceptor
```

---

### 1. `main.jsx` — Application Entry Point

**What it does:**
```jsx
<ThemeProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</ThemeProvider>
```
- Wraps the entire app in `ThemeProvider` (outermost) and `AuthProvider` (innermost)
- This makes theme and auth state available to every component via `useContext`

---

### 2. `App.jsx` — Root Layout & Router

**What it does:**
- Sets up `BrowserRouter` with all routes
- Renders the **global layout** that appears on every page:
  - `<BackgroundLayer />` — renders behind everything
  - `<Navbar />` — top nav
  - `<Routes>` — page content
  - `<FloatingThemeButton />` — bottom-right floating button
  - `<ThemeCustomizerModal />` — hidden modal, shown when theme button is clicked

**All Routes:**
| Path | Component | Who can access |
|------|-----------|---------------|
| `/` | Home | Everyone |
| `/invites/:id` | InviteDetail | Everyone |
| `/login` | Login | Guest only |
| `/register` | Register | Guest only |
| `/dashboard` | UserDashboard | Logged-in users |
| `/admin` | AdminDashboard | Admin only |
| `/events/:id/hub` | EventHub | Everyone |
| `/admin/checkin` | CheckInStation | Admin |
| `/admin/analytics` | AnalyticsDashboard | Admin |
| `/payment-success` | PaymentSuccess | After payment |
| `/payment-failed` | PaymentFailed | After failed payment |
| `*` | 404 page | Everyone |

---

### 3. Context Providers

#### `AuthContext.jsx` — Auth State
**State:** `user` (object or null), `loading` (bool)

**Functions available globally:**

| Function | What it does |
|----------|-------------|
| `login(email, password)` | Calls POST /api/auth/login, saves user + token to localStorage |
| `register(name, email, mobile, password)` | Calls POST /api/auth/register |
| `verifyOTP(email, otp)` | Calls POST /api/auth/verify-otp, saves user + token |
| `logout()` | Clears user state + localStorage |

**Flow:**
- On app load, reads `userInfo` from `localStorage` to restore session
- `loading` is `true` until the check completes — prevents rendering children until auth is known
- Token is stored in both `userInfo.token` and separate `localStorage['token']` key

#### `ThemeContext.jsx` — Theme State
- Manages color themes, background type (gradient/image/video), video URL, opacity, etc.
- Persists theme preferences to `localStorage`
- Provides theme values to `BackgroundLayer` and `ThemeCustomizerModal`

---

### 4. `utils/axios.js` — HTTP Client

**What it does:**
- Creates an Axios instance with `baseURL: /api` (proxy to backend)
- **Request interceptor**: Automatically reads `token` from `localStorage` and adds `Authorization: Bearer <token>` header to every request
- This means every API call is automatically authenticated if user is logged in

---

### 5. Pages — Detailed Explanation

#### `Home.jsx` — Landing Page
**Features:**
- Hero section with animated headline
- Event cards grid — fetches all invites from GET /api/invites
- Category filter buttons (Music, Tech, Sports, etc.)
- Search bar
- Each card shows: event image, title, date, location, price, available seats
- Clicking a card navigates to `/invites/:id`

#### `InviteDetail.jsx` — Event Detail + Booking
**Features:**
- Full event details (description, date, location, category, seats)
- Dynamic background (image/video/gradient based on event's `backgroundType`)
- **Book Now** button → triggers booking via POST /api/bookings
- Shows `PaymentCheckoutModal` after booking
- Countdown timer to event date
- Share buttons

**Booking Flow on this page:**
1. User clicks "Book Now"
2. API call creates booking record
3. `PaymentCheckoutModal` opens
4. User chooses UPI or Stripe
5. Payment confirmed → booking `paymentStatus` updated to `paid`
6. Redirects to `/payment-success`

#### `Login.jsx` — Login Page
**Two-step flow:**
1. **Step 1:** Email + password form → calls `login()` from AuthContext
2. **Step 2 (if unverified):** OTP input form → calls `verifyOTP()` from AuthContext
- On success: redirects to `/dashboard` or `/admin`

#### `Register.jsx` — Registration Page
**Two-step flow:**
1. **Step 1:** Name + email/mobile + password form → calls `register()`
2. **Step 2:** OTP input → calls `verifyOTP()`
- On success: auto-logs in and redirects to dashboard

#### `UserDashboard.jsx` — User's Dashboard
**Features:**
- Lists all of the user's bookings (GET /api/bookings/my)
- Shows ticket details: event name, date, status, payment status
- **QR Code** for each confirmed booking (used as gate pass)
- Cancel booking button → DELETE /api/bookings/:id
- Download ticket button

#### `AdminDashboard.jsx` — Admin Panel
**Tabs/Sections:**
1. **Events Management** — full CRUD for events
   - Create event form (title, description, date, location, category, seats, price, image, background)
   - Edit existing events
   - Delete events
2. **Bookings Management** — view all bookings across all events
   - Filter by event, status, payment status
   - Confirm or cancel individual bookings
3. **Broadcast** — send email to all confirmed attendees of a selected event
4. **Payment Settings** — configure UPI ID, merchant name, QR code URL, enable/disable Stripe or UPI
5. **Audit Logs** — view last 50 admin actions

#### `AnalyticsDashboard.jsx` — Statistics
**Features:**
- Total events, total bookings, total revenue charts
- Booking trend over time (line chart)
- Revenue by event (bar chart)
- Payment method breakdown (pie chart)
- Attendance rate stats

#### `CheckInStation.jsx` — Gate QR Scanner
**Features:**
- QR Code scanner UI
- Admin scans attendee's ticket QR code
- Calls POST /api/admin/bookings/verify-qr with `ticketId`
- Shows "Gate Pass Authorized!" or "Already Redeemed" message
- Displays attendee name, event name on successful scan

#### `EventHub.jsx` — Event-Specific Hub
**Features:**
- Event-specific page with attendee count, live updates
- Engagement sub-components (from `components/engage/`)

#### `PaymentSuccess.jsx` / `PaymentFailed.jsx`
- Simple landing pages after Stripe/UPI redirect
- Show success/failure message and link back to dashboard

---

### 6. Components — Detailed Explanation

#### `Navbar.jsx`
**What it shows:**
- INVITOR logo/brand
- Navigation links (Home, Events)
- If **logged out**: Login + Register buttons
- If **logged in as user**: Dashboard link + Logout button
- If **logged in as admin**: Admin link + Analytics + Check-In + Logout
- `NotificationBell` component
- Responsive hamburger menu for mobile

#### `BackgroundLayer.jsx`
**What it does:**
- Renders **behind everything** (absolute positioned, z-index: 0)
- Based on `ThemeContext` values:
  - **Gradient mode**: renders CSS gradient background
  - **Image mode**: renders a blurred/faded background image
  - **Video mode**: renders a muted, looping `<video>` element
- Applies opacity/blur overlays for readability

#### `ThemeCustomizerModal.jsx`
**What it does:**
- Full-screen modal opened by `FloatingThemeButton`
- Lets user choose:
  - Color theme (dark, light, purple, blue, etc.)
  - Background type (gradient / image / video)
  - Upload or paste URL for image/video background
  - Adjust opacity and blur
- Saves preferences to `ThemeContext` → persisted to `localStorage`

#### `PaymentCheckoutModal.jsx`
**What it does:**
- Modal triggered after booking is created
- Shows two payment tabs:
  1. **UPI Tab**: Shows UPI QR Code image + UPI ID to scan/copy, then asks user to enter payment reference
  2. **Stripe Tab**: Credit/debit card form (Stripe Elements)
- On submit: calls POST /api/bookings/:id/pay
- Redirects to `/payment-success` or `/payment-failed`

#### `FloatingThemeButton.jsx`
- Small floating circle button, fixed bottom-right
- Clicking it toggles `ThemeCustomizerModal` open/closed

#### `NotificationBell.jsx`
- Bell icon in navbar
- Shows unread notifications count badge
- Dropdown with recent booking confirmations or admin messages

---

## 🔄 Complete End-to-End Workflows

### Workflow 1: User Registration & Login

```
User fills Register form
  → Frontend: AuthContext.register() → POST /api/auth/register
  → Backend: Hash password, create User (isVerified=false), generate OTP, send OTP email/SMS
  → Frontend: Shows OTP input form
  → User enters OTP
  → Frontend: AuthContext.verifyOTP() → POST /api/auth/verify-otp
  → Backend: Find OTP record, mark User isVerified=true, delete OTP, return JWT token
  → Frontend: Stores user + token in localStorage, redirects to /dashboard
```

### Workflow 2: Browse Events & Book a Ticket

```
User visits Home page (/)
  → Frontend: GET /api/invites → renders event cards
  → User clicks an event card → navigates to /invites/:id
  → Frontend: GET /api/invites/:id → renders full event details
  → User clicks "Book Now"
  → Frontend: POST /api/bookings (with JWT token in header)
  → Backend: protect middleware verifies JWT, checks seats, creates Booking (paymentStatus='not_paid')
  → Frontend: PaymentCheckoutModal opens
  → User scans UPI QR or enters card details
  → Frontend: POST /api/bookings/:id/pay
  → Backend: Updates paymentStatus='paid', records paymentReference, paidAt
  → Frontend: Redirects to /payment-success
```

### Workflow 3: Admin Creates an Event

```
Admin logs in → /admin
  → AdminDashboard loads
  → Admin clicks "Create Event"
  → Fills form: title, description, date, location, category, seats, price, image URL, background type
  → POST /api/invites (with admin JWT)
  → Backend: protect + admin middleware validates, createInvite() saves to DB
  → Frontend: Event list refreshes with new event
```

### Workflow 4: Gate Check-In at Event

```
Attendee arrives at event venue
  → Opens UserDashboard → downloads/shows QR code ticket
  → Admin opens /admin/checkin (CheckInStation page)
  → Scans QR code
  → Frontend: POST /api/admin/bookings/verify-qr { ticketId }
  → Backend: Finds booking, checks checkedIn status
    → If not checked in: sets checkedIn=true, returns "Gate Pass Authorized!"
    → If already checked in: returns "Ticket Already Redeemed"
  → Frontend: Shows success/error message with attendee details
```

### Workflow 5: Admin Broadcasts Email

```
Admin → AdminDashboard → Broadcast tab
  → Selects an event, types subject + message
  → POST /api/admin/broadcast { inviteId, subject, message }
  → Backend: Finds all confirmed bookings for that event, collects emails
  → Sends email via Nodemailer to all attendees
  → Returns count of emails sent
```

---

## 🔐 Security Architecture

| Layer | Implementation |
|-------|---------------|
| Password Security | bcryptjs with salt rounds = 10 |
| Authentication | JWT tokens, 7-day expiry, stored in localStorage |
| Route Protection | `protect` middleware on all private routes |
| Admin Authorization | `admin` middleware (role check) on all admin routes |
| OTP Expiry | MongoDB TTL index — auto-deletes after 5 minutes |
| Account Verification | Users must verify OTP before they can login |
| Duplicate Prevention | Sparse unique indexes on email + mobile |

---

## 🌐 Deployment Architecture (Vercel)

```
vercel.json (root) → rewrites /api/* to backend, /* to frontend
frontend/vercel.json → React SPA, serves index.html for all routes
backend/vercel.json → serverless Node.js function

Local Dev:
  npm run dev (root) → runs both frontend (port 5173) and backend (port 5000) via concurrently
  vite.config.js → proxies /api/* from port 5173 to localhost:5000
```

---

## 📊 Data Flow Summary

```
Browser (React SPA)
  ↕ HTTP (Axios with JWT Bearer token)
Express Server (Node.js)
  ↕ (protect/admin middleware filters requests)
Controllers (business logic)
  ↕ (Mongoose ODM)
MongoDB Atlas (cloud database)
  ↑ (email/SMS triggers)
Nodemailer / Twilio
  → User's Email / Mobile
```
