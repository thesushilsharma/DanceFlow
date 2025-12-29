"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { payments, expenses, students } from "@/drizzle/schema"
import { eq, sql, gte } from "drizzle-orm"

export async function getPayments() {
  try {
    const paymentsWithStudents = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        dueDate: payments.dueDate,
        paymentDate: payments.paymentDate,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        paymentType: payments.paymentType,
        referenceNumber: payments.referenceNumber,
        notes: payments.notes,
        studentId: payments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))

    return paymentsWithStudents.map((payment) => ({
      id: payment.id,
      studentFirstName: payment.studentFirstName,
      studentLastName: payment.studentLastName,
      amount: payment.amount,
      paidDate: payment.paymentDate ? String(payment.paymentDate) : null,
      dueDate: payment.dueDate ? String(payment.dueDate) : "",
      method: payment.paymentMethod,
      status: payment.status as "paid" | "pending" | "overdue" | "cancelled",
      notes: payment.notes,
    }))
  } catch (error) {
    console.error("Error fetching payments:", error)
    return []
  }
}

export async function getExpenses() {
  try {
    const allExpenses = await db.select().from(expenses)
    return allExpenses.map((expense) => ({
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: String(expense.expenseDate),
      vendor: expense.vendor,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    }))
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return []
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
      .where(gte(payments.paymentDate, currentMonth))

    const [expensesResult] = await db
      .select({
        total: sql<string>`cast(sum(${expenses.amount}) as text)`,
      })
      .from(expenses)
      .where(gte(expenses.expenseDate, currentMonth))

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
    const dueDate = formData.get("dueDate") as string | null
    const paymentDate = formData.get("paymentDate") as string
    const paymentMethod = formData.get("paymentMethod") as string | null
    const paymentType = formData.get("paymentType") as string | null
    const referenceNumber = formData.get("referenceNumber") as string | null
    const status = (formData.get("status") as string) || "completed"
    const notes = formData.get("notes") as string | null

    await db.insert(payments).values({
      studentId,
      amount,
      dueDate: dueDate || undefined,
      paymentDate,
      paymentMethod: paymentMethod || undefined,
      paymentType: paymentType || undefined,
      referenceNumber: referenceNumber || undefined,
      status,
      notes: notes || undefined,
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
      expenseDate: date,
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

