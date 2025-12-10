-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" varchar(20),
	"email" varchar(255),
	"phone" varchar(20),
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(20),
	"address" text,
	"enrollment_date" date DEFAULT CURRENT_DATE NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"level" varchar(50),
	"notes" text,
	"medical_conditions" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "students_status_check" CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'on-hold'::character varying, 'graduated'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"enrollment_date" date DEFAULT CURRENT_DATE NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"payment_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "enrollments_student_id_class_id_key" UNIQUE("student_id","class_id"),
	CONSTRAINT "enrollments_status_check" CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'dropped'::character varying, 'completed'::character varying])::text[])),
	CONSTRAINT "enrollments_payment_status_check" CHECK ((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'partial'::character varying, 'overdue'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"class_type" varchar(100) NOT NULL,
	"level" varchar(50),
	"day_of_week" varchar(20) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"room" varchar(100),
	"max_capacity" integer DEFAULT 20 NOT NULL,
	"current_enrollment" integer DEFAULT 0,
	"instructor_id" uuid,
	"tuition_fee" numeric(10, 2),
	"status" varchar(20) DEFAULT 'active',
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "classes_status_check" CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'full'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'present',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "attendance_student_id_class_id_attendance_date_key" UNIQUE("student_id","class_id","attendance_date"),
	CONSTRAINT "attendance_status_check" CHECK ((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'excused'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date DEFAULT CURRENT_DATE NOT NULL,
	"payment_method" varchar(50),
	"payment_type" varchar(50),
	"reference_number" varchar(100),
	"status" varchar(20) DEFAULT 'completed',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_payment_method_check" CHECK ((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'credit-card'::character varying, 'debit-card'::character varying, 'check'::character varying, 'bank-transfer'::character varying, 'online'::character varying])::text[])),
	CONSTRAINT "payments_payment_type_check" CHECK ((payment_type)::text = ANY ((ARRAY['tuition'::character varying, 'registration'::character varying, 'costume'::character varying, 'competition'::character varying, 'other'::character varying])::text[])),
	CONSTRAINT "payments_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"expense_date" date DEFAULT CURRENT_DATE NOT NULL,
	"payment_method" varchar(50),
	"vendor" varchar(200),
	"receipt_url" text,
	"status" varchar(20) DEFAULT 'paid',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "expenses_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'reimbursed'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"event_type" varchar(50),
	"event_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"location" varchar(200),
	"cost" numeric(10, 2),
	"status" varchar(20) DEFAULT 'scheduled',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "events_event_type_check" CHECK ((event_type)::text = ANY ((ARRAY['recital'::character varying, 'competition'::character varying, 'workshop'::character varying, 'performance'::character varying, 'other'::character varying])::text[])),
	CONSTRAINT "events_status_check" CHECK ((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"participation_status" varchar(20) DEFAULT 'registered',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "event_participants_event_id_student_id_key" UNIQUE("event_id","student_id"),
	CONSTRAINT "event_participants_participation_status_check" CHECK ((participation_status)::text = ANY ((ARRAY['registered'::character varying, 'confirmed'::character varying, 'attended'::character varying, 'no-show'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"document_type" varchar(50),
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"student_id" uuid,
	"staff_id" uuid,
	"uploaded_by" varchar(100),
	"uploaded_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "documents_document_type_check" CHECK ((document_type)::text = ANY ((ARRAY['contract'::character varying, 'waiver'::character varying, 'policy'::character varying, 'form'::character varying, 'certificate'::character varying, 'other'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" varchar(50) NOT NULL,
	"hire_date" date NOT NULL,
	"salary" numeric(10, 2),
	"certifications" text[],
	"specializations" text[],
	"status" varchar(20) DEFAULT 'active',
	"address" text,
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(20),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_email_key" UNIQUE("email"),
	CONSTRAINT "staff_role_check" CHECK ((role)::text = ANY ((ARRAY['instructor'::character varying, 'admin'::character varying, 'assistant'::character varying, 'owner'::character varying])::text[])),
	CONSTRAINT "staff_status_check" CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'on-leave'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "fk_instructor" FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_students_name" ON "students" USING btree ("last_name" text_ops,"first_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_students_status" ON "students" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_enrollments_class" ON "enrollments" USING btree ("class_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_enrollments_student" ON "enrollments" USING btree ("student_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_classes_day_time" ON "classes" USING btree ("day_of_week" text_ops,"start_time" text_ops);--> statement-breakpoint
CREATE INDEX "idx_classes_instructor" ON "classes" USING btree ("instructor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attendance_date" ON "attendance" USING btree ("attendance_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_date" ON "payments" USING btree ("payment_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_student" ON "payments" USING btree ("student_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_expenses_date" ON "expenses" USING btree ("expense_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "events" USING btree ("event_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_staff" ON "documents" USING btree ("staff_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_student" ON "documents" USING btree ("student_id" uuid_ops);
*/