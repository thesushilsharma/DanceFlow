"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { payments, expenses, students, classes, offers, enrollments } from "@/drizzle/schema"
import { and, eq, sql, gte } from "drizzle-orm"
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
  enrolledCount?: number
} | null

type ClassLineItem = { classId: string; amount: number }

function parseClassLineItems(raw: string | null): ClassLineItem[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const classId = "classId" in item ? String(item.classId) : ""
        const amount = "amount" in item ? parseFloat(String(item.amount)) : NaN
        if (!classId.trim() || isNaN(amount) || amount <= 0) return null
        return { classId: classId.trim(), amount }
      })
      .filter((item): item is ClassLineItem => item !== null)
  } catch {
    return []
  }
}

function splitDiscountAcrossLines(
  lines: ClassLineItem[],
  totalDiscount: number
): { classId: string; amount: number; discountAmount: number }[] {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
  if (subtotal <= 0) return []

  let allocatedDiscount = 0
  return lines.map((line, index) => {
    const isLast = index === lines.length - 1
    const lineDiscount = isLast
      ? Math.max(0, totalDiscount - allocatedDiscount)
      : Math.round(((line.amount / subtotal) * totalDiscount) * 100) / 100
    allocatedDiscount += lineDiscount
    const finalAmount = Math.max(0, line.amount - lineDiscount)
    return {
      classId: line.classId,
      amount: finalAmount,
      discountAmount: lineDiscount,
    }
  })
}

async function syncEnrollmentsForClassPayment(
  tx: typeof db,
  studentId: string,
  classIds: string[],
  enrollmentDate: string,
  markAsPaid: boolean
) {
  const uniqueClassIds = [...new Set(classIds)]
  if (uniqueClassIds.length === 0) return

  const enrollmentPaymentStatus = markAsPaid ? "paid" : "pending"

  for (const classId of uniqueClassIds) {
    const [classData] = await tx
      .select({ id: classes.id, name: classes.name, maxCapacity: classes.maxCapacity })
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1)

    if (!classData) {
      throw new Error("One or more selected classes were not found")
    }

    const [existing] = await tx
      .select({ id: enrollments.id, paymentStatus: enrollments.paymentStatus })
      .from(enrollments)
      .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
      .limit(1)

    if (existing) {
      if (markAsPaid && existing.paymentStatus !== "paid") {
        await tx
          .update(enrollments)
          .set({ paymentStatus: "paid", updatedAt: new Date() })
          .where(eq(enrollments.id, existing.id))
      }
      continue
    }

    const [countRow] = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(enrollments)
      .where(eq(enrollments.classId, classId))

    if (countRow.count >= classData.maxCapacity) {
      throw new Error(`${classData.name} is at full capacity. Payment was not recorded.`)
    }

    await tx.insert(enrollments).values({
      studentId,
      classId,
      enrollmentDate,
      status: "active",
      paymentStatus: enrollmentPaymentStatus,
    })
  }
}

export async function createPayment(
  _prevState: PaymentState,
  formData: FormData
): Promise<PaymentState> {
  try {
    const studentId = formData.get("studentId") as string
    const legacyClassId = formData.get("classId") as string | null
    const classLineItems = parseClassLineItems(formData.get("classLineItems") as string | null)
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

    if (!studentId) {
      return { success: false, error: "Please select a student" }
    }
    if (!amount || !paymentDate) {
      return { success: false, error: "Please fill in all required fields" }
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount < 0) {
      return { success: false, error: "Invalid amount" }
    }

    const parsedDiscount =
      discountAmount && !isNaN(parseFloat(discountAmount)) ? parseFloat(discountAmount) : 0
    const trimmedOfferId = offerId?.trim() || null

    const lines =
      classLineItems.length > 0
        ? classLineItems
        : legacyClassId?.trim()
          ? [{ classId: legacyClassId.trim(), amount: numericAmount + parsedDiscount }]
          : []

    if (lines.length > 1) {
      const uniqueClassIds = new Set(lines.map((line) => line.classId))
      if (uniqueClassIds.size !== lines.length) {
        return { success: false, error: "Each class can only be selected once per payment" }
      }
    }

    const sharedFields = {
      studentId,
      offerId: trimmedOfferId,
      paymentDate,
      paymentMethod: paymentMethod || undefined,
      paymentType: paymentType || undefined,
      receiptNumber: receiptNumber || undefined,
      referenceNumber: referenceNumber || undefined,
      status,
      notes: notes || undefined,
    }

    const markEnrollmentPaid = status === "completed" || status === "paid"
    const classIdsToEnroll = lines.map((line) => line.classId)

    const runPaymentAndEnrollment = async (tx: typeof db) => {
      if (lines.length === 0) {
        const { netAmount, vatAmount } = calculateVat(numericAmount, 5, true)
        await tx.insert(payments).values({
          ...sharedFields,
          classId: null,
          amount: numericAmount.toString(),
          discountAmount: parsedDiscount > 0 ? parsedDiscount.toString() : undefined,
          netAmount: netAmount.toString(),
          vatAmount: vatAmount.toString(),
        })
      } else if (lines.length === 1) {
        const line = lines[0]
        const { netAmount, vatAmount } = calculateVat(numericAmount, 5, true)
        await tx.insert(payments).values({
          ...sharedFields,
          classId: line.classId,
          amount: numericAmount.toString(),
          discountAmount: parsedDiscount > 0 ? parsedDiscount.toString() : undefined,
          netAmount: netAmount.toString(),
          vatAmount: vatAmount.toString(),
        })
      } else {
        const allocatedLines = splitDiscountAcrossLines(lines, parsedDiscount)
        const paymentRows = allocatedLines.map((line) => {
          const { netAmount, vatAmount } = calculateVat(line.amount, 5, true)
          return {
            ...sharedFields,
            classId: line.classId,
            amount: line.amount.toString(),
            discountAmount: line.discountAmount > 0 ? line.discountAmount.toString() : undefined,
            netAmount: netAmount.toString(),
            vatAmount: vatAmount.toString(),
          }
        })
        await tx.insert(payments).values(paymentRows)
      }

      if (classIdsToEnroll.length > 0) {
        await syncEnrollmentsForClassPayment(
          tx,
          studentId,
          classIdsToEnroll,
          paymentDate,
          markEnrollmentPaid
        )
      }
    }

    if (classIdsToEnroll.length > 0) {
      await db.transaction(async (tx) => {
        await runPaymentAndEnrollment(tx as unknown as typeof db)
      })
    } else {
      await runPaymentAndEnrollment(db)
    }

    revalidatePath("/dashboard/finances")
    revalidatePath("/dashboard/classes")
    return {
      success: true,
      enrolledCount: classIdsToEnroll.length > 0 ? classIdsToEnroll.length : undefined,
    }
  } catch (error) {
    console.error("Error creating payment:", error)
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message }
    }
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
