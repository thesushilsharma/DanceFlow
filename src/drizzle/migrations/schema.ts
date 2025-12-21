import { pgTable, text, integer, timestamp, decimal, date, pgEnum, uuid } from "drizzle-orm/pg-core"

// Enums
export const studentStatusEnum = pgEnum("student_status", ["active", "inactive", "on-hold", "graduated"])
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "overdue", "cancelled"])
export const classStatusEnum = pgEnum("class_status", ["active", "inactive", "full", "cancelled"])
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"])
export const staffRoleEnum = pgEnum("staff_role", ["instructor", "admin", "assistant"])
export const eventTypeEnum = pgEnum("event_type", ["recital", "competition", "workshop", "showcase", "other"])
export const eventStatusEnum = pgEnum("event_status", ["upcoming", "ongoing", "completed", "cancelled"])
export const documentTypeEnum = pgEnum("document_type", ["contract", "medical", "waiver", "certificate", "other"])

// Students table
export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  level: text("level").notNull(),
  status: studentStatusEnum("status").default("active").notNull(),
  enrollmentDate: date("enrollment_date").notNull(),
  medicalNotes: text("medical_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  classId: uuid("class_id")
    .references(() => classes.id)
    .notNull(),
  enrollmentDate: date("enrollment_date").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Classes table
export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  level: text("level").notNull(),
  instructorId: uuid("instructor_id").references(() => staff.id),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  capacity: integer("capacity").notNull(),
  tuition: decimal("tuition", { precision: 10, scale: 2 }).notNull(),
  status: classStatusEnum("status").default("active").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Attendance table
export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  classId: uuid("class_id")
    .references(() => classes.id)
    .notNull(),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  method: text("method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Expenses table
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  vendor: text("vendor"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: eventTypeEnum("type").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  status: eventStatusEnum("status").default("upcoming").notNull(),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Event Participants table
export const eventParticipants = pgTable("event_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id)
    .notNull(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  registrationDate: date("registration_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").references(() => students.id),
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Staff table
export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: staffRoleEnum("role").notNull(),
  specialization: text("specialization"),
  hireDate: date("hire_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
