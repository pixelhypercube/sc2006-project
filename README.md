# sc2006-web: Pawsport & Peer
Website for the Pawsport & Peer Care Coordination Network. 

### 🛠️ Getting Started
To set up the development environment and install all necessary dependencies, run the following command in your terminal:

```Bash
npm install
```

To start the local development server:
```Bash
npm run dev
```

### ⚙️ Testing the UI (Debug Mode)
Since the backend APIs and authentication states are still being wired up, we use a global debug switch to seamlessly test the different views (Navbar, Dashboards, routing) without needing to log in and out.

1. Open `/lib/debugConfig.ts`
2. Ensure `export const DEBUG_MODE = true;`
3. Change `MOCK_ROLE` to switch the application state:
   * `"GUEST"` - Simulates an unauthenticated user (clean navbar).
   * `"OWNER"` - Grants access to Pet Profiles, Searching, and Booking.
   * `"CAREGIVER"` - Grants access to the Console, Requests, and 5% Earnings tracking.
   * `"ADMIN"` - Grants access to System Controls and HR Incidents.

### 📂 Page Structure
```text
app                             // CORE NEXT.JS ROOT
│   favicon.ico
│   globals.css
│   layout.tsx
│   not-found.tsx               // CUSTOM 404 ERROR PAGE
│   page.tsx                    // PUBLIC LANDING PAGE
│
├───admin                       // ROLE: ADMINISTRATOR (ROOT)
│   │   page.tsx                // ADMIN OVERVIEW/DASHBOARD
│   │
│   ├───incidents               // DISPUTE RESOLUTION
│   │       page.tsx
│   │
│   └───verified                // CAREGIVER VETTING QUEUE
│           page.tsx
│
├───api                         // BACKEND API ROUTES
├───caregiver                   // ROLE: CAREGIVER (ROOT)
│   │   page.tsx                // CAREGIVER CONSOLE
│   │
│   ├───blueprint               // BEHAVIORAL BLUEPRINT MANAGEMENT
│   │       page.tsx
│   │
│   ├───messages
│   │       page.tsx
│   │
│   ├───profile
│   │   │   page.tsx
│   │   │
│   │   └───edit
│   │           page.tsx
│   │
│   ├───requests                // INCOMING CARE REQUESTS
│   │       page.tsx
│   │
│   ├───transactions            // 5% FEE & EARNINGS TRACKING
│   │       page.tsx
│   │
│   └───upload                  // EVIDENCE UPLOAD PORTAL
│           page.tsx
│
├───components                  // SHARED UI COMPONENTS
│       CaretakerCard.tsx
│       ChatUI.tsx
│       Navbar.tsx
│
├───fonts                       // STATIC ASSETS
│       Nunito.ttf
│
├───forgot_password
│       page.tsx
│
├───lib                         // SYSTEM UTILITIES & CONFIG
│       debugConfig.ts          // GLOBAL ROLE SWITCHER
│
├───logout
│       page.tsx
│
├───owner                       // ROLE: PET OWNER (ROOT)
│   │   page.tsx                // OWNER DASHBOARD
│   │   DatePickerModal.tsx     // COLOCATED DASHBOARD COMPONENT
│   │   FiltersModal.tsx        // COLOCATED DASHBOARD COMPONENT
│   │   PetCategoryButton.tsx   // COLOCATED DASHBOARD COMPONENT
│   │
│   ├───active_care             // LIVE CARE MONITORING HUB
│   │       IncidentModal.tsx
│   │       page.tsx
│   │
│   ├───caretaker_profile       // PUBLIC CAREGIVER VIEW
│   │       BookingConfirmationModal.tsx
│   │       BookingModal.tsx
│   │       page.tsx
│   │
│   ├───messages
│   │       page.tsx
│   │
│   ├───my_bookings             // BOOKING HISTORY & REVIEWS
│   │       page.tsx
│   │       ReviewModal.tsx
│   │
│   ├───my_pets                 // PET LISTING (CRUD)
│   │       page.tsx
│   │
│   ├───pet_profile             // BEHAVIORAL BLUEPRINT VIEW
│   │       page.tsx
│   │
│   ├───profile                 // IDENTITY & INCIDENT TRACKING
│   │       page.tsx
│   │
│   ├───review                  // EVIDENCE REVIEW PORTAL
│   │       page.tsx
│   │
│   ├───search_caregivers       // DISCOVERY PAGE
│   │       page.tsx
│   │
│   └───transactions            // PAYMENT RECORDS
│           page.tsx
│
├───signin
│       page.tsx
│
└───signup
        page.tsx
```

### 🛠️ Tech Stack
#### Frontend Architecture
* **Framework:** Next.js (React) via 'app' Router
* **Styling:** Tailwind CSS
* **Icons/UI:** Lucide

#### Backend & Databases
* **Server/API:** Next.js API Routes (Node.js)
* **Database:** PostgreSQL
* **Authentication:** Prisma ORM
<!-- * **File Storage:** Firebase Cloud Storage (proposed) -->

#### DevOps & Collaboration
* **Version Control:** Git & GitHub
* **Design/Prototyping:** Figma

## Changelogs

### Kai Jie (frontend)

##### (4/4/2026)

### Admin System

- **Pagination** - Added to all admin pages (caretakers, incidents, verified queue, refunds)
- **Search & Filters** - Search functionality with status, priority, and amount filters
- **Incident Management** - Complete system with evidence viewing and resolution
- **Caretaker Verification** - Approval/rejection system with status tracking
- **Refund Processing** - New UC-22 implementation with admin approval workflow

### Payment System

- **Payment Requests** - Caretakers can request custom payment amounts
- **Payment Integration** - Pay buttons in booking pages and chat messages
- **Status Tracking** - Real-time Pending/Paid status across all pages
- **Refund System** - Complete refund request and processing workflow
- **Multiple Payment Methods** - Mock PayNow and Credit Card support (especially from payment dialogs in 'Messages')

### User Features

- **Caretaker Application** - Complete form for clients to become caretakers
- **Availability Management** - Caretakers can update their available dates
- **Verified Badges** - Display verified status for approved caregivers
- **Real-time Chat** - Messaging with integrated payment requests
- **Refund Requests** - Owners can request refunds for completed bookings

### UI/UX

- **Consistent Pagination** - Uniform navigation across all admin pages
- **Enhanced Date Display** - Added time information to all dates
- **Status Indicators** - Visual badges for payment, verification, and booking status
- **Improved Layout** - Enhanced My Bookings page with better visual design
- **Confirmation Modals** - Added confirmation dialogs for critical actions

### Mock Data Used (Admin)

#### Caretaker Profile Example
```json
{
  "id": "user-002",
  "name": "Mike Tan",
  "email": "mike.tan@example.com",
  "location": "Tampines",
  "petPreferences": ["BIRD", "SMALL_ANIMAL"],
  "dailyRate": 55.00,
  "experienceYears": 3,
  "verified": false,
  "verificationStatus": "Pending",
  "status": "ACTIVE",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
  "verificationDoc": null,
  "averageRating": 4.5,
  "totalReviews": 18,
  "completedBookings": 24,
  "biography": "Specialized in exotic pets and small mammals. Have experience with birds, hamsters, and guinea pigs.",
  "createdAt": "2025-02-20T10:30:00"
}
```

#### Payment Request Example
```json
{
  "id": "TRX-112",
  "client": "Linda Ong",
  "caretaker": "Rachel Goh",
  "pet": "Snowball (Cat)",
  "startDate": "2026-03-01",
  "endDate": "2026-03-05",
  "amount": 200.00,
  "status": "Completed",
  "method": "PayNow",
  "datetime": "2026-03-01T15:00:00"
}
```

#### Incident Report Example
```json
{
  "id": "INC-442",
  "reporter": "jane.teo@gmail.com",
  "title": "Did not feed the dog",
  "description": "Caretaker failed to feed my dog or refill water bowl during 3-day sitting. Pet camera confirmed food bowl untouched.",
  "caretaker": "Sarah Chen",
  "priority": "High",
  "status": "Pending",
  "datetime": "2026-02-15T14:30:00"
}
```

#### Refund Request Example
```json
{
  "id": "REF-001",
  "bookingId": "BKG-442",
  "owner": "jane.teo@gmail.com",
  "ownerName": "Jane Teo",
  "caretaker": "Sarah Chen",
  "amount": 195.00,
  "reason": "Caretaker failed to feed my dog or refill water bowl during 3-day sitting.",
  "status": "Pending",
  "datetime": "2026-02-15T14:30:00",
  "transactionId": "TXN-442-001"
}
```
