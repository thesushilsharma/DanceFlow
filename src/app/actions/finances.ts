"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { payments, expenses, students, classes, offers } from "@/drizzle/schema"
import { eq, sql, gte } from "drizzle-orm"
import { calculateVat } from "@/lib/vat"

export async function getPayments() {
  try {
    const paymentsWithStudents = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        netAmount: payments.netAmount,
        vatAmount: payments.vatAmount,
        paymentDate: payments.paymentDate,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        paymentType: payments.paymentType,
        receiptNumber: payments.receiptNumber,
        referenceNumber: payments.referenceNumber,
        notes: payments.notes,
        studentId: payments.studentId,
        classId: payments.classId,
        offerId: payments.offerId,
        discountAmount: payments.discountAmount,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        className: classes.name,
        offerTitle: offers.title,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(classes, eq(payments.classId, classes.id))
      .leftJoin(offers, eq(payments.offerId, offers.id))

    return paymentsWithStudents.map((payment) => ({
      id: payment.id,
      studentFirstName: payment.studentFirstName,
      studentLastName: payment.studentLastName,
      amount: payment.amount,
      netAmount: payment.netAmount,
      vatAmount: payment.vatAmount,
      paidDate: payment.paymentDate ? String(payment.paymentDate) : null,
      method: payment.paymentMethod,
      paymentType: payment.paymentType,
      receiptNumber: payment.receiptNumber,
      referenceNumber: payment.referenceNumber,
      className: payment.className,
      offerId: payment.offerId,
      offerTitle: payment.offerTitle,
      discountAmount: payment.discountAmount,
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
      netAmount: expense.netAmount,
      vatAmount: expense.vatAmount,
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

type PaymentState = {
  success?: boolean
  error?: string
} | null

export async function createPayment(
  _prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  try {
    const studentId = formData.get("studentId") as string
    const classId = formData.get("classId") as string | null
    const offerId = formData.get("offerId") as string | null
    const amount = formData.get("amount") as string
    const discountAmount = formData.get("discountAmount") as string | null
    const paymentDate = formData.get("paymentDate") as string
    const paymentMethod = formData.get("paymentMethod") as string | null
    const paymentType = formData.get("paymentType") as string | null
    const receiptNumber = formData.get("receiptNumber") as string | null
    const referenceNumber = formData.get("referenceNumber") as string | null
    const status = (formData.get("status") as string) || "completed"
    const notes = formData.get("notes") as string | null

    // Validate required fields
    if (!studentId) {
      return { success: false, error: "Please select a student" }
    }
    if (!amount || !paymentDate) {
      return { success: false, error: "Please fill in all required fields" }
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount)) {
      return { success: false, error: "Invalid amount" }
    }

    // Assume the entered amount is VAT inclusive (5% VAT rate default)
    const { netAmount, vatAmount } = calculateVat(numericAmount, 5, true)

    await db.insert(payments).values({
      studentId,
      classId: classId && classId.trim() ? classId.trim() : null,
      offerId: offerId && offerId.trim() ? offerId.trim() : null,
      amount: numericAmount.toString(),
      discountAmount: discountAmount && !isNaN(parseFloat(discountAmount)) ? parseFloat(discountAmount).toString() : undefined,
      netAmount: netAmount.toString(),
      vatAmount: vatAmount.toString(),
      paymentDate,
      paymentMethod: paymentMethod || undefined,
      paymentType: paymentType || undefined,
      receiptNumber: receiptNumber || undefined,
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

type ExpenseState = {
  success?: boolean
  error?: string
} | null

export async function createExpense(
  _prevState: ExpenseState,
  formData: FormData
): Promise<ExpenseState> {
  try {
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const amount = formData.get("amount") as string
    const date = formData.get("date") as string
    const vendor = formData.get("vendor") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const notes = formData.get("notes") as string

    // Validate required fields
    if (!category || !description || !amount || !date) {
      return { success: false, error: "Please fill in all required fields" }
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount)) {
      return { success: false, error: "Invalid amount" }
    }

    // Assume the entered amount is VAT inclusive (5% VAT rate default)
    const { netAmount, vatAmount } = calculateVat(numericAmount, 5, true)

    await db.insert(expenses).values({
      category,
      description,
      amount: numericAmount.toString(),
      netAmount: netAmount.toString(),
      vatAmount: vatAmount.toString(),
      expenseDate: date,
      vendor: vendor || undefined,
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
    })

    revalidatePath("/dashboard/finances")
    return { success: true }
  } catch (error) {
    console.error("Error creating expense:", error)
    return { success: false, error: "Failed to create expense" }
  }
}
