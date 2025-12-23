"use server"

import { db } from "@/drizzle/db"
import { students, classes, payments, attendance, enrollments, events } from "@/drizzle/migrations/schema"
import { eq, gte, sql, desc, and } from "drizzle-orm"

export async function getDashboardStats() {
  try {
    // Get total students count
    const studentCount = await db.select({ count: sql<number>`count(*)` }).from(students)

    // Get active classes count
    const classCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.status, "active"))

    // Get current month's revenue
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const revenue = await db
      .select({ total: sql<string>`COALESCE(sum(CAST(${payments.amount} AS DECIMAL)), 0)` })
      .from(payments)
      .where(and(gte(payments.paidDate, firstDayOfMonth), eq(payments.status, "paid")))

    // Get attendance rate for current month
    const totalAttendance = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(gte(attendance.date, firstDayOfMonth))

    const presentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(and(gte(attendance.date, firstDayOfMonth), eq(attendance.status, "present")))

    const attendanceRate =
      totalAttendance[0]?.count > 0 ? Math.round(((presentCount[0]?.count || 0) / totalAttendance[0].count) * 100) : 0

    return {
      totalStudents: studentCount[0]?.count || 0,
      activeClasses: classCount[0]?.count || 0,
      monthlyRevenue: Number.parseFloat(revenue[0]?.total || "0"),
      attendanceRate,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch dashboard stats:", error)
    return {
      totalStudents: 0,
      activeClasses: 0,
      monthlyRevenue: 0,
      attendanceRate: 0,
    }
  }
}

export async function getRecentEnrollments() {
  try {
    const recentEnrollments = await db
      .select({
        studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
        className: classes.name,
        enrolledAt: enrollments.enrollmentDate,
      })
      .from(enrollments)
      .innerJoin(students, eq(students.id, enrollments.studentId))
      .innerJoin(classes, eq(classes.id, enrollments.classId))
      .orderBy(desc(enrollments.enrollmentDate))
      .limit(5)

    return recentEnrollments
  } catch (error) {
    console.error("[v0] Failed to fetch recent enrollments:", error)
    return []
  }
}

export async function getUpcomingEvents() {
  try {
    const today = new Date().toISOString().split("T")[0]

    const upcomingEvents = await db.select().from(events).where(gte(events.date, today)).orderBy(events.date).limit(5)

    return upcomingEvents
  } catch (error) {
    console.error("[v0] Failed to fetch upcoming events:", error)
    return []
  }
}
