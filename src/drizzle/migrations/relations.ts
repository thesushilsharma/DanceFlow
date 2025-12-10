import { relations } from "drizzle-orm/relations";
import { students, enrollments, classes, staff, attendance, payments, events, eventParticipants, documents } from "./schema";

export const enrollmentsRelations = relations(enrollments, ({one}) => ({
	student: one(students, {
		fields: [enrollments.studentId],
		references: [students.id]
	}),
	class: one(classes, {
		fields: [enrollments.classId],
		references: [classes.id]
	}),
}));

export const studentsRelations = relations(students, ({many}) => ({
	enrollments: many(enrollments),
	attendances: many(attendance),
	payments: many(payments),
	eventParticipants: many(eventParticipants),
	documents: many(documents),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
	enrollments: many(enrollments),
	staff: one(staff, {
		fields: [classes.instructorId],
		references: [staff.id]
	}),
	attendances: many(attendance),
}));

export const staffRelations = relations(staff, ({many}) => ({
	classes: many(classes),
	documents: many(documents),
}));

export const attendanceRelations = relations(attendance, ({one}) => ({
	student: one(students, {
		fields: [attendance.studentId],
		references: [students.id]
	}),
	class: one(classes, {
		fields: [attendance.classId],
		references: [classes.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	student: one(students, {
		fields: [payments.studentId],
		references: [students.id]
	}),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({one}) => ({
	event: one(events, {
		fields: [eventParticipants.eventId],
		references: [events.id]
	}),
	student: one(students, {
		fields: [eventParticipants.studentId],
		references: [students.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	eventParticipants: many(eventParticipants),
}));

export const documentsRelations = relations(documents, ({one}) => ({
	student: one(students, {
		fields: [documents.studentId],
		references: [students.id]
	}),
	staff: one(staff, {
		fields: [documents.staffId],
		references: [staff.id]
	}),
}));