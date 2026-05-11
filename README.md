# DanceFlow
A modern internal management system built to streamline the daily operations of dance studios.  
Manage students, classes, staff, packages, payments, attendance, and alumni—all from one clean dashboard.

---

## 🌟 Overview
Dance Flow is an internal administrative system designed to simplify and automate studio operations.

---

## 🏗️ Architecture & Tech Stack

### Backend: Next.js API Routes & Edge Functions
- **Framework**: Next.js 16 (App Router)
- **Server Runtime**: Edge Functions (Vercel)
- **Database**: PostgreSQL (via Vercel Postgres)
- **ORM**: Drizzle ORM
- **Authentication**: Vercel Auth

### Frontend: React Components
- **UI Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## 🔐 Authentication & Authorization

### Authentication
- **Provider**: Vercel Auth
- **Supported Methods**:
  - Email & Password
  - Google OAuth
  - Apple OAuth

### Authorization
- **Role-Based Access Control (RBAC)**
- **Roles**:
  - `admin`: Full access to all features
  - `manager`: Studio management, operations
  - `instructor`: Class management, attendance

### Session Management
- **Security**: Secure, HttpOnly cookies
- **Token**: JWT (JSON Web Token)
- **Auto-renewal**: Sessions automatically renew upon valid access

---

## 📊 Database Schema (PostgreSQL)

### 1. Users & Auth
```sql
users
│
├── accounts ( OAuth providers )
├── sessions ( JWT tokens )
│
├── studio_members
│   ├── id ( UUID, PK )
│   ├── user_id ( UUID, FK → users )
│   ├── studio_id ( FK → studios )
│   ├── role ( admin | manager | instructor )
│   └── created_at ( timestamp )
```

### 2. Studios & Departments
```sql
studios
│
├── departments
│   ├── id ( UUID, PK )
│   ├── studio_id ( FK → studios )
│   ├── name ( varchar )
│   ├── description ( text )
│   └── created_at ( timestamp )
```

### 3. Staff Management
```sql
staff
│
├── id ( UUID, PK )
├── user_id ( UUID, FK → users )
├── studio_id ( FK → studios )
├── department_id ( FK → departments )
├── specialization ( varchar )  -- e.g., Ballet, Jazz, Hip Hop
├── hire_date ( date )
├── salary ( decimal )
├── status ( active | inactive | on_leave )
└── created_at ( timestamp )
```

### 4. Class Management
```sql
classes
│
├── id ( UUID, PK )
├── studio_id ( FK → studios )
├── department_id ( FK → departments )
├── class_name ( varchar )  -- e.g., "Ballet Level 1"
├── description ( text )
├── level ( beginner | intermediate | advanced )
├── price_per_session ( decimal )
├── capacity ( int )
├── notes ( text )
└── created_at ( timestamp )

├── class_sessions  -- Individual sessions/classes
│   ├── id ( UUID, PK )
│   ├── class_id ( FK → classes )
│   ├── staff_id ( FK → staff )
│   ├── start_date ( date )
│   ├── end_date ( date )
│   ├── time ( time )
│   ├── duration_minutes ( int )
│   ├── day_of_week ( int )  -- 0-6
│   ├── max_capacity ( int )
│   ├── status ( upcoming | ongoing | completed | cancelled )
│   └── created_at ( timestamp )
```

### 5. Student Management
```sql
students
│
├── id ( UUID, PK )
├── user_id ( UUID, FK → users )  -- Optional for internal tracking
├── first_name ( varchar )
├── last_name ( varchar )
├── email ( varchar )
├── phone ( varchar )
├── emergency_contact_name ( varchar )
├── emergency_contact_phone ( varchar )
├── medical_notes ( text )
├── registration_date ( date )
└── created_at ( timestamp )

├── enrollments  -- Student enrollments in sessions
│   ├── id ( UUID, PK )
│   ├── student_id ( FK → students )
│   ├── session_id ( FK → class_sessions )
│   ├── enrollment_date ( date )
│   ├── status ( active | dropped | waitlisted )
│   └── created_at ( timestamp )
```

### 6. Attendance
```sql
attendance
│
├── id ( UUID, PK )
├── enrollment_id ( FK → enrollments )
├── session_id ( FK → class_sessions )
├── student_id ( FK → students )
├── attendance_date ( date )
├── status ( present | absent | late | excused )
└── notes ( text )
```

### 7. Packages
```sql
packages
│
├── id ( UUID, PK )
├── name ( varchar )  -- e.g., "10-Class Pass"
├── description ( text )
├── price ( decimal )
├── class_count ( int )
├── validity_days ( int )
├── status ( active | expired )
└── created_at ( timestamp )

├── student_packages  -- Student package ownership
│   ├── id ( UUID, PK )
│   ├── student_id ( FK → students )
│   ├── package_id ( FK → packages )
│   ├── credits_remaining ( int )
│   ├── purchased_at ( timestamp )
│   └── expires_at ( timestamp )
```

### 8. Payments
```sql
payments
│
├── id ( UUID, PK )
├── student_id ( FK → students )
├── amount ( decimal )
├── payment_date ( timestamp )
├── method ( card | cash | online | cheque )
├── transaction_id ( varchar )  -- External payment reference
└── notes ( text )
```

### 9. Alumni
```sql
alumni
│
├── id ( UUID, PK )
├── student_id ( FK → students )  -- Denormalized for easy querying
├── last_class_date ( date )
├── status ( graduated | transferred | inactive )
└── created_at ( timestamp )
```

---

## 🔄 Data Flow

### Class Creation Process:
1. Studio admin creates a `class` definition
2. Admin schedules `class_sessions` for the class
3. Staff members are assigned to sessions
4. Students enroll in sessions via `enrollments`
5. Attendance is tracked in `attendance` table

### Package Purchase:
1. Student buys a `package`
2. `student_packages` record created with credits
3. `payments` record created
4. Credits deducted upon session attendance

### Enrollment Management:
1. Student added to `enrollments`
2. Status changes to `active`, `waitlisted`, or `dropped`
3. Payment status tracked separately
4. On graduation/completion, student moved to `alumni`

---

## 🚀 Deployment (Vercel)

### Prerequisites:
- Vercel account with Postgres add-on
- Next.js 16 project configured
- Drizzle ORM set up
- Vercel Auth configured

### Deployment Steps:
```bash
# Deploy to Vercel
vercel 

# Connect to Postgres database
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_TOKEN

# Run database migrations
npx drizzle-kit migrate
```

### Environment Variables:
```env
# Vercel Auth
VITE_AUTH_URL=https://studio-flow-app.vercel.app/api/auth
VITE_AUTH_SECRET=your-secret-key-here

# Database
POSTGRES_URL=postgresql://...:5432/postgres
POSTGRES_PRISMA_URL=postgresql://...:5432/postgres?sslmode=require
POSTGRES_TOKEN=your-token-here

# Next.js
NEXT_PUBLIC_APP_URL=https://studio-flow-app.vercel.app
```

---

##

## 🤝 Contributing
This is an internal tool, but contributions from team members are welcome.  
Feel free to open issues or submit pull requests.

---

## 📄 License
[MIT LICENSE](LICENSE)  
Use and modify freely for internal studio operations.

