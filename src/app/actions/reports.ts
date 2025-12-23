"use server"

import { db } from "@/drizzle/db"
import { classes, payments, expenses, attendance, enrollments } from "@/drizzle/migrations/schema"
import { sql, gte, eq, and } from "drizzle-orm"

export async function getFinancialStats() {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

    const revenue = await db
      .select({ total: sql<string>`COALESCE(sum(CAST(${payments.amount} AS DECIMAL)), 0)` })
      .from(payments)
      .where(and(gte(payments.paidDate, firstDayOfMonth), eq(payments.status, "paid")))

    const expensesTotal = await db
      .select({ total: sql<string>`COALESCE(sum(CAST(${expenses.amount} AS DECIMAL)), 0)` })
      .from(expenses)
      .where(gte(expenses.date, firstDayOfMonth))

    const totalRevenue = Number.parseFloat(revenue[0]?.total || "0")
    const totalExpenses = Number.parseFloat(expensesTotal[0]?.total || "0")

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch financial stats:", error)
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
    }
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

    return classPerformance
  } catch (error) {
    console.error("[v0] Failed to fetch class performance:", error)
    return []
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
      overallRate: total > 0 ? Math.round((present / total) * 100) : 0,
      lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
      totalRecords: total,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch attendance stats:", error)
    return {
      overallRate: 0,
      lateRate: 0,
      totalRecords: 0,
    }
  }
}

export async function getMonthlyRevenueData() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]

    const revenueData = await db
      .select({
        month: sql<string>`to_char(${payments.paidDate}::date, 'Mon')`,
        revenue: sql<string>`COALESCE(sum(CAST(${payments.amount} AS DECIMAL)), 0)`,
      })
      .from(payments)
      .where(and(gte(payments.paidDate, sixMonthsAgo), eq(payments.status, "paid")))
      .groupBy(sql`to_char(${payments.paidDate}::date, 'Mon')`)

    return revenueData.map((item) => ({
      month: item.month,
      revenue: Number.parseFloat(item.revenue || "0"),
    }))
  } catch (error) {
    console.error("[v0] Failed to fetch monthly revenue data:", error)
    return []
  }
}

export async function getEnrollmentTrends() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]

    const enrollmentData = await db
      .select({
        month: sql<string>`to_char(${enrollments.enrollmentDate}::date, 'Mon')`,
        enrollments: sql<number>`count(*)`,
      })
      .from(enrollments)
      .where(gte(enrollments.enrollmentDate, sixMonthsAgo))
      .groupBy(sql`to_char(${enrollments.enrollmentDate}::date, 'Mon')`)

    return enrollmentData
  } catch (error) {
    console.error("[v0] Failed to fetch enrollment trends:", error)
    return []
  }
}
