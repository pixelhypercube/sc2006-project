# sc2006-web: Pawsport & Peer
Website for the Pawsport & Peer Care Coordination Network. 

### 🚀 Current Status
Kai Jie - drafted 1st round of UI layouts (for frontend), will work on standardizing frontend functionalities and logic across the entire web app.

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
* **Authentication:** Firebase Auth (proposed)
* **File Storage:** Firebase Cloud Storage (proposed)

#### DevOps & Collaboration
* **Version Control:** Git & GitHub
* **Design/Prototyping:** Figma