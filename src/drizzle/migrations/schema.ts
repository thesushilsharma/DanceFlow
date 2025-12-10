import { pgTable, index, check, uuid, varchar, date, text, timestamp, foreignKey, unique, time, integer, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const students = pgTable("students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	dateOfBirth: date("date_of_birth").notNull(),
	gender: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
	address: text(),
	enrollmentDate: date("enrollment_date").default(sql`CURRENT_DATE`).notNull(),
	status: varchar({ length: 20 }).default('active'),
	level: varchar({ length: 50 }),
	notes: text(),
	medicalConditions: text("medical_conditions"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_students_name").using("btree", table.lastName.asc().nullsLast().op("text_ops"), table.firstName.asc().nullsLast().op("text_ops")),
	index("idx_students_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("students_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'on-hold'::character varying, 'graduated'::character varying])::text[])`),
]);

export const enrollments = pgTable("enrollments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	classId: uuid("class_id").notNull(),
	enrollmentDate: date("enrollment_date").default(sql`CURRENT_DATE`).notNull(),
	status: varchar({ length: 20 }).default('active'),
	paymentStatus: varchar("payment_status", { length: 20 }).default('pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_enrollments_class").using("btree", table.classId.asc().nullsLast().op("uuid_ops")),
	index("idx_enrollments_student").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "enrollments_student_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "enrollments_class_id_fkey"
		}).onDelete("cascade"),
	unique("enrollments_student_id_class_id_key").on(table.studentId, table.classId),
	check("enrollments_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'dropped'::character varying, 'completed'::character varying])::text[])`),
	check("enrollments_payment_status_check", sql`(payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'partial'::character varying, 'overdue'::character varying])::text[])`),
]);

export const classes = pgTable("classes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	classType: varchar("class_type", { length: 100 }).notNull(),
	level: varchar({ length: 50 }),
	dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	room: varchar({ length: 100 }),
	maxCapacity: integer("max_capacity").default(20).notNull(),
	currentEnrollment: integer("current_enrollment").default(0),
	instructorId: uuid("instructor_id"),
	tuitionFee: numeric("tuition_fee", { precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('active'),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_classes_day_time").using("btree", table.dayOfWeek.asc().nullsLast().op("text_ops"), table.startTime.asc().nullsLast().op("text_ops")),
	index("idx_classes_instructor").using("btree", table.instructorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.instructorId],
			foreignColumns: [staff.id],
			name: "fk_instructor"
		}).onDelete("set null"),
	check("classes_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'full'::character varying])::text[])`),
]);

export const attendance = pgTable("attendance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	classId: uuid("class_id").notNull(),
	attendanceDate: date("attendance_date").notNull(),
	status: varchar({ length: 20 }).default('present'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_attendance_date").using("btree", table.attendanceDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "attendance_student_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "attendance_class_id_fkey"
		}).onDelete("cascade"),
	unique("attendance_student_id_class_id_attendance_date_key").on(table.studentId, table.classId, table.attendanceDate),
	check("attendance_status_check", sql`(status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'excused'::character varying])::text[])`),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentDate: date("payment_date").default(sql`CURRENT_DATE`).notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentType: varchar("payment_type", { length: 50 }),
	referenceNumber: varchar("reference_number", { length: 100 }),
	status: varchar({ length: 20 }).default('completed'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payments_date").using("btree", table.paymentDate.asc().nullsLast().op("date_ops")),
	index("idx_payments_student").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "payments_student_id_fkey"
		}).onDelete("cascade"),
	check("payments_payment_method_check", sql`(payment_method)::text = ANY ((ARRAY['cash'::character varying, 'credit-card'::character varying, 'debit-card'::character varying, 'check'::character varying, 'bank-transfer'::character varying, 'online'::character varying])::text[])`),
	check("payments_payment_type_check", sql`(payment_type)::text = ANY ((ARRAY['tuition'::character varying, 'registration'::character varying, 'costume'::character varying, 'competition'::character varying, 'other'::character varying])::text[])`),
	check("payments_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])`),
]);

export const expenses = pgTable("expenses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	expenseDate: date("expense_date").default(sql`CURRENT_DATE`).notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	vendor: varchar({ length: 200 }),
	receiptUrl: text("receipt_url"),
	status: varchar({ length: 20 }).default('paid'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_expenses_date").using("btree", table.expenseDate.asc().nullsLast().op("date_ops")),
	check("expenses_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'reimbursed'::character varying])::text[])`),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	eventType: varchar("event_type", { length: 50 }),
	eventDate: date("event_date").notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	location: varchar({ length: 200 }),
	cost: numeric({ precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('scheduled'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_events_date").using("btree", table.eventDate.asc().nullsLast().op("date_ops")),
	check("events_event_type_check", sql`(event_type)::text = ANY ((ARRAY['recital'::character varying, 'competition'::character varying, 'workshop'::character varying, 'performance'::character varying, 'other'::character varying])::text[])`),
	check("events_status_check", sql`(status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])`),
]);

export const eventParticipants = pgTable("event_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	studentId: uuid("student_id").notNull(),
	participationStatus: varchar("participation_status", { length: 20 }).default('registered'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_participants_event_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "event_participants_student_id_fkey"
		}).onDelete("cascade"),
	unique("event_participants_event_id_student_id_key").on(table.eventId, table.studentId),
	check("event_participants_participation_status_check", sql`(participation_status)::text = ANY ((ARRAY['registered'::character varying, 'confirmed'::character varying, 'attended'::character varying, 'no-show'::character varying])::text[])`),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	documentType: varchar("document_type", { length: 50 }),
	fileUrl: text("file_url").notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileSize: integer("file_size"),
	studentId: uuid("student_id"),
	staffId: uuid("staff_id"),
	uploadedBy: varchar("uploaded_by", { length: 100 }),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_documents_staff").using("btree", table.staffId.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_student").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "documents_student_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [staff.id],
			name: "documents_staff_id_fkey"
		}).onDelete("cascade"),
	check("documents_document_type_check", sql`(document_type)::text = ANY ((ARRAY['contract'::character varying, 'waiver'::character varying, 'policy'::character varying, 'form'::character varying, 'certificate'::character varying, 'other'::character varying])::text[])`),
]);

export const staff = pgTable("staff", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	role: varchar({ length: 50 }).notNull(),
	hireDate: date("hire_date").notNull(),
	salary: numeric({ precision: 10, scale:  2 }),
	certifications: text().array(),
	specializations: text().array(),
	status: varchar({ length: 20 }).default('active'),
	address: text(),
	emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("staff_email_key").on(table.email),
	check("staff_role_check", sql`(role)::text = ANY ((ARRAY['instructor'::character varying, 'admin'::character varying, 'assistant'::character varying, 'owner'::character varying])::text[])`),
	check("staff_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'on-leave'::character varying])::text[])`),
]);
