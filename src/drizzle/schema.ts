import { pgTable, text, integer, timestamp, decimal, date, pgEnum, uuid, time } from "drizzle-orm/pg-core"

export const studentStatusEnum = pgEnum("student_status", ["active", "inactive", "on-hold", "graduated"])
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"])
export const classStatusEnum = pgEnum("class_status", ["active", "inactive", "full"])
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"])
export const staffRoleEnum = pgEnum("staff_role", ["instructor", "admin", "assistant", "owner"])
export const eventTypeEnum = pgEnum("event_type", ["recital", "competition", "workshop", "performance", "other"])
export const eventStatusEnum = pgEnum("event_status", ["scheduled", "in-progress", "completed", "cancelled"])
export const documentTypeEnum = pgEnum("document_type", [
  "contract",
  "waiver",
  "policy",
  "form",
  "certificate",
  "other",
])
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "dropped", "completed"])
export const enrollmentPaymentStatusEnum = pgEnum("enrollment_payment_status", [
  "pending",
  "paid",
  "partial",
  "overdue",
])

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender"),
  email: text("email"),
  phone: text("phone"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  address: text("address"),
  enrollmentDate: date("enrollment_date").notNull(),
  status: text("status").default("active").notNull(),
  level: text("level"),
  notes: text("notes"),
  medicalConditions: text("medical_conditions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull(),
  hireDate: date("hire_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  certifications: text("certifications").array(),
  specializations: text("specializations").array(),
  status: text("status").default("active").notNull(),
  address: text("address"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  classType: text("class_type").notNull(),
  level: text("level"),
  instructorId: uuid("instructor_id").references(() => staff.id),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  room: text("room"),
  maxCapacity: integer("max_capacity").notNull().default(20),
  currentEnrollment: integer("current_enrollment").default(0),
  tuitionFee: decimal("tuition_fee", { precision: 10, scale: 2 }),
  status: text("status").default("active").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

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
  paymentStatus: text("payment_status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  classId: uuid("class_id")
    .references(() => classes.id)
    .notNull(),
  attendanceDate: date("attendance_date").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method"),
  paymentType: text("payment_type"),
  referenceNumber: text("reference_number"),
  status: text("status").default("completed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  vendor: text("vendor"),
  paymentMethod: text("payment_method"),
  receiptUrl: text("receipt_url"),
  status: text("status").default("paid").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(),
  eventDate: date("event_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  location: text("location"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  status: text("status").default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const eventParticipants = pgTable("event_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id)
    .notNull(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  participationStatus: text("participation_status").default("registered").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  documentType: text("document_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  studentId: uuid("student_id").references(() => students.id),
  staffId: uuid("staff_id").references(() => staff.id),
  uploadedBy: text("uploaded_by"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})