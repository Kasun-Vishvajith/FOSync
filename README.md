# FOSync — Faculty of Science Calendar

Academic calendar web application for University of Colombo, Faculty of Science (Statistics Department pilot).

## Features

- **Restricted Registration** — Only whitelisted students can sign up using their registration number
- **Degree-Based Courses** — Core courses auto-assigned; elective selection per student
- **Calendar Views** — Weekly and monthly views with color-coded events (lectures, exams, deadlines)
- **Admin Panel** — Course/event management for admins; user & whitelist management for super admins
- **Dark Mode** — Sleek, modern dark UI with glassmorphism design

## Tech Stack

- **Frontend**: React + Tailwind CSS v4
- **Backend**: Firebase (Authentication + Cloud Firestore)
- **Build**: Vite
- **Icons**: Lucide React
- **Dates**: date-fns

## Setup

### 1. Firebase Project

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → **Email/Password** provider
3. Create a **Cloud Firestore** database
4. Copy your Firebase config

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Seed Data

Before anyone can register, add entries to the `allowed_users` collection in Firestore:

| Document ID (reg_no) | Fields |
|---|---|
| `2022s19001` | `reg_no: "2022s19001"`, `degree: "Statistics"` |

To make a user a Super Admin, update their `users` doc in Firestore:
```
role: "super_admin"
```

## Registration Number Format

Pattern: `YYYYsXXXXX` (e.g., `2022s19001`)

- `YYYY` — Year of admission
- `s` — Faculty identifier (lowercase)
- `XXXXX` — 5-digit student number

## Project Structure

```
src/
├── components/
│   ├── ui/            # Button, Input, Select, Modal
│   ├── layout/        # Navbar, AppLayout, ProtectedRoute
│   └── calendar/      # CalendarHeader, MonthView, WeekView, EventDetailModal
├── contexts/          # AuthContext (auth state + role management)
├── lib/               # Firebase config, Firestore CRUD helpers
├── pages/             # Login, Signup, Setup, Dashboard, Admin
└── utils/             # Constants, validation helpers
```

## NLP Chatbot Assistant

FOSync includes a smart conversational chatbot assistant to manage your schedule. It parses natural language inputs and matches them using keyword mapping (with singular/plural normalization and Levenshtein similarity distance <= 1 for keywords of length >= 3).

### Supported Keywords

| Category | Primary Keywords | Typo & Abbreviation Fallbacks |
|---|---|---|
| **View Actions** | `show`, `list`, `find`, `display`, `what`, `view` | `shw`, `lst`, `fnd`, `fid`, `displa`, `displya`, `wat`, `vw`, `viw` |
| **Date Range Filters** | `today`, `tomorrow`, `this week`, `next week`, `upcoming` | `tomorow`, `tommorow`, `todey`, `upcomming`, `upcoing` |
| **Event Types / Categories** | `exam`, `deadline`, `lecture`, `practical` (lab), `tutorial` | See `chatMatcher.js` |
| **Create Actions** | `add`, `create`, `new`, `schedule`, `make` | `ad`, `aad`, `creat`, `crt`, `nw`, `sched`, `shedule`, `mk` |
| **Update Actions** | `edit`, `update`, `change`, `reschedule`, `move`, `modify` | `edt`, `eidt`, `updat`, `updte`, `chang`, `chnge`, `reschedul`, `reschdule`, `mve`, `modfy`, `modyfy` |
| **Delete Actions** | `delete`, `remove`, `cancel`, `clear` | `delet`, `dlete`, `deltee`, `remve`, `rmove`, `cancle`, `cncel`, `cncl`, `clera`, `clr` |
| **Recurrence Triggers** | `every`, `daily`, `weekly`, `recurring`, `repeat` | `evry`, `evey`, `dayli`, `weekl`, `weekley`, `recuring`, `recurrng`, `repeet`, `repeatt` |
| **Location Triggers** | `at`, `in`, `room`, `venue`, `hall`, `lab no`, `located` | `rm`, `vanue`, `venu`, `hal`, `loctaed`, `lcoated` |
| **Confirm (Yes)** | `yes`, `confirm`, `ok`, `okay`, `sure` | `yess`, `ye`, `confrm`, `cofirm`, `okey`, `suree` |
| **Confirm (No)** | `no`, `cancel that`, `nevermind`, `stop`, `abort` | `noo`, `n`, `nevermnd`, `nvm`, `stp`, `abrt` |
| **Greeting / Help** | `help`, `hi`, `hello`, `hey`, `assist`, `commands` | `hlp`, `halp`, `helo`, `hii`, `heyy`, `assit`, `asist`, `comands` |

### Example Commands

- **Add Event**: `"Add DBMS lecture tomorrow at 9am in Room 204"` or `"Schedule OOP lab Friday 2pm for 2 hours"`
- **View Schedule**: `"Show all exams"`, `"What's due this week"`, or `"List my labs tomorrow"`
- **Edit/Reschedule**: `"Reschedule tomorrow's lecture to 3pm"` or `"Change lab duration to 2 hours"`
- **Delete/Cancel**: `"Delete my 9am lecture"`, `"Cancel Friday's exam"`, or `"Remove all deadlines this week"` (supports bulk delete)
- **Recurring Events**: `"Add DBMS lecture every Monday at 9am for 12 weeks"`

## License

See [LICENSE](./LICENSE).

