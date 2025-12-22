"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { payments, expenses, students } from "@/drizzle/migrations/schema"
import { eq, sql, gte } from "drizzle-orm"

export async function getPayments() {
  try {
    const paymentsWithStudents = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        dueDate: payments.dueDate,
        paidDate: payments.paidDate,
        status: payments.status,
        method: payments.method,
        notes: payments.notes,
        studentId: payments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))

    return paymentsWithStudents
  } catch (error) {
    console.error("Error fetching payments:", error)
    throw new Error("Failed to fetch payments")
  }
}

export async function getExpenses() {
  try {
    return await db.select().from(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    throw new Error("Failed to fetch expenses")
  }
}

export async function getFinancialSummary() {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01"

    const [revenueResult] = await db
      .select({
        total: sql<string>`cast(sum(${payments.amount}) as text)`,
      })
      .from(payments)
      .where(gte(payments.paidDate, currentMonth))

    const [expensesResult] = await db
      .select({
        total: sql<string>`cast(sum(${expenses.amount}) as text)`,
      })
      .from(expenses)
      .where(gte(expenses.date, currentMonth))

    const [outstandingResult] = await db
      .select({
        total: sql<string>`cast(sum(${payments.amount}) as text)`,
      })
      .from(payments)
      .where(eq(payments.status, "pending"))

    const totalRevenue = Number.parseFloat(revenueResult?.total || "0")
    const totalExpenses = Number.parseFloat(expensesResult?.total || "0")
    const outstanding = Number.parseFloat(outstandingResult?.total || "0")
    const netProfit = totalRevenue - totalExpenses

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstanding,
    }
  } catch (error) {
    console.error("Error fetching financial summary:", error)
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      outstanding: 0,
    }
  }
}

export async function createPayment(formData: FormData) {
  try {
    const studentId = formData.get("studentId") as string
    const amount = formData.get("amount") as string
    const dueDate = formData.get("dueDate") as string
    const paidDate = formData.get("paidDate") as string
    const method = formData.get("method") as string
    const status = (formData.get("status") as any) || "paid"
    const notes = formData.get("notes") as string

    await db.insert(payments).values({
      studentId,
      amount,
      dueDate,
      paidDate: paidDate || null,
      method,
      status,
      notes,
    })

    revalidatePath("/dashboard/finances")
    return { success: true }
  } catch (error) {
    console.error("Error creating payment:", error)
    return { success: false, error: "Failed to create payment" }
  }
}

export async function createExpense(formData: FormData) {
  try {
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const amount = formData.get("amount") as string
    const date = formData.get("date") as string
    const vendor = formData.get("vendor") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const notes = formData.get("notes") as string

    await db.insert(expenses).values({
      category,
      description,
      amount,
      date,
      vendor,
      paymentMethod,
      notes,
    })

    revalidatePath("/dashboard/finances")
    return { success: true }
  } catch (error) {
    console.error("Error creating expense:", error)
    return { success: false, error: "Failed to create expense" }
  }
}
