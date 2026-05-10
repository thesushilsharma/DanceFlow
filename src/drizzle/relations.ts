import { relations } from "drizzle-orm/relations";
import {
  students, enrollments, classes, staff, attendance, payments,
  events, eventParticipants, documents, offers,
  classSessions, offerClasses,
} from "./schema";

export const studentsRelations = relations(students, ({ many }) => ({
  enrollments: many(enrollments),
  payments: many(payments),
  attendance: many(attendance),
  eventParticipants: many(eventParticipants),
  documents: many(documents),
}))

export const staffRelations = relations(staff, ({ many }) => ({
  classes: many(classes),
  documents: many(documents),
}))

export const classesRelations = relations(classes, ({ one, many }) => ({
  instructor: one(staff, {
    fields: [classes.instructorId],
    references: [staff.id],
  }),
  sessions: many(classSessions),
  enrollments: many(enrollments),
  attendance: many(attendance),
  offerClasses: many(offerClasses),
}))

// A Session (Batch) belongs to one class and can have many enrollments
export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  class: one(classes, {
    fields: [classSessions.classId],
    references: [classes.id],
  }),
  enrollments: many(enrollments),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
  // Optional: which specific session/batch this enrollment belongs to
  session: one(classSessions, {
    fields: [enrollments.sessionId],
    references: [classSessions.id],
  }),
}))

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  offer: one(offers, {
    fields: [payments.offerId],
    references: [offers.id],
  }),
}))

export const offersRelations = relations(offers, ({ many }) => ({
  payments: many(payments),
  offerClasses: many(offerClasses),
}))

// Join table: which classes are bundled in an offer
export const offerClassesRelations = relations(offerClasses, ({ one }) => ({
  offer: one(offers, {
    fields: [offerClasses.offerId],
    references: [offers.id],
  }),
  class: one(classes, {
    fields: [offerClasses.classId],
    references: [classes.id],
  }),
}))

export const eventsRelations = relations(events, ({ many }) => ({
  participants: many(eventParticipants),
}))

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  student: one(students, {
    fields: [eventParticipants.studentId],
    references: [students.id],
  }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  student: one(students, {
    fields: [documents.studentId],
    references: [students.id],
  }),
  staff: one(staff, {
    fields: [documents.staffId],
    references: [staff.id],
  }),
}))
