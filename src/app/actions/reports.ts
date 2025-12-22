"use server"

import { db } from "@/drizzle/db"
import { classes, payments, expenses, attendance, enrollments } from "@/drizzle/migrations/schema"
import { sql, gte, eq, and } from "drizzle-orm"

export async function getFinancialStats() {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const revenue = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(and(gte(payments.paidDate, firstDayOfMonth), eq(payments.status, "paid")))

    const expensesTotal = await db
      .select({ total: sql<number>`sum(${expenses.amount})` })
      .from(expenses)
      .where(gte(expenses.date, firstDayOfMonth))

    const totalRevenue = revenue[0]?.total || 0
    const totalExpenses = expensesTotal[0]?.total || 0

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      },
    }
  } catch (error) {
    console.error("Failed to fetch financial stats:", error)
    return { success: false, error: "Failed to fetch financial stats" }
  }
}

export async function getClassPerformance() {
  try {
    const classPerformance = await db
      .select({
        className: classes.name,
        classId: classes.id,
        capacity: classes.capacity,
        enrolled: sql<number>`count(distinct ${enrollments.studentId})`,
      })
      .from(classes)
      .leftJoin(enrollments, eq(enrollments.classId, classes.id))
      .where(eq(classes.status, "active"))
      .groupBy(classes.id, classes.name, classes.capacity)

    return { success: true, data: classPerformance }
  } catch (error) {
    console.error("Failed to fetch class performance:", error)
    return { success: false, error: "Failed to fetch class performance" }
  }
}

export async function getAttendanceStats() {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const totalAttendance = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(gte(attendance.date, firstDayOfMonth))

    const presentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(and(gte(attendance.date, firstDayOfMonth), eq(attendance.status, "present")))

    const lateCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(and(gte(attendance.date, firstDayOfMonth), eq(attendance.status, "late")))

    const total = totalAttendance[0]?.count || 0
    const present = presentCount[0]?.count || 0
    const late = lateCount[0]?.count || 0

    return {
      success: true,
      data: {
        overallRate: total > 0 ? Math.round((present / total) * 100) : 0,
        lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
        totalRecords: total,
      },
    }
  } catch (error) {
    console.error("Failed to fetch attendance stats:", error)
    return { success: false, error: "Failed to fetch attendance stats" }
  }
}

export async function getMonthlyRevenueData() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]

    const revenueData = await db
      .select({
        month: sql<string>`to_char(${payments.paidDate}, 'Mon')`,
        revenue: sql<number>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(and(gte(payments.paidDate, sixMonthsAgo), eq(payments.status, "paid")))
      .groupBy(sql`to_char(${payments.paidDate}, 'Mon')`)

    return { success: true, data: revenueData }
  } catch (error) {
    console.error("Failed to fetch monthly revenue data:", error)
    return { success: false, error: "Failed to fetch monthly revenue data" }
  }
}

export async function getEnrollmentTrends() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]

    const enrollmentData = await db
      .select({
        month: sql<string>`to_char(${enrollments.enrollmentDate}, 'Mon')`,
        enrollments: sql<number>`count(*)`,
      })
      .from(enrollments)
      .where(gte(enrollments.enrollmentDate, sixMonthsAgo))
      .groupBy(sql`to_char(${enrollments.enrollmentDate}, 'Mon')`)

    return { success: true, data: enrollmentData }
  } catch (error) {
    console.error("Failed to fetch enrollment trends:", error)
    return { success: false, error: "Failed to fetch enrollment trends" }
  }
}
