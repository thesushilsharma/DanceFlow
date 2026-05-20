"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/drizzle/db";
import {
  classes,
  classSessions,
  enrollments,
  expenses,
  offers,
  payments,
  students,
} from "@/drizzle/schema";
import { groupPaymentRows, type PaymentGroup } from "@/lib/group-payments";
import {
  type EnrollmentLine,
  syncEnrollmentsForClassPayment,
} from "@/lib/payment-enrollments";
import {
  type ClassLineItem,
  parseClassLineItems,
  prepareClassPaymentLines,
} from "@/lib/payment-line-items";
import {
  normalizePaymentDisplayStatus,
  REVENUE_PAYMENT_STATUSES,
} from "@/lib/payment-status";
import { calculateVat } from "@/lib/vat";

const ALLOWED_PAYMENT_STATUSES = new Set([
  "completed",
  "pending",
  "refunded",
  "failed",
  "cancelled",
]);

function revalidateFinancePaths() {
  revalidatePath("/dashboard/finances");
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/students");
}

export async function getGroupedPayments(): Promise<PaymentGroup[]> {
  try {
    const rows = await db
      .select({
        id: payments.id,
        paymentGroupId: payments.paymentGroupId,
        amount: payments.amount,
        discountAmount: payments.discountAmount,
        paymentDate: payments.paymentDate,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        paymentType: payments.paymentType,
        receiptNumber: payments.receiptNumber,
        referenceNumber: payments.referenceNumber,
        notes: payments.notes,
        studentId: payments.studentId,
        classId: payments.classId,
        sessionId: payments.sessionId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        className: classes.name,
        sessionName: classSessions.name,
        offerTitle: offers.title,
      })
      .from(payments)
      .leftJoin(students, eq(payments.studentId, students.id))
      .leftJoin(classes, eq(payments.classId, classes.id))
      .leftJoin(classSessions, eq(payments.sessionId, classSessions.id))
      .leftJoin(offers, eq(payments.offerId, offers.id))
      .orderBy(
        sql`${payments.paymentDate} desc`,
        sql`${payments.createdAt} desc`,
      );

    return groupPaymentRows(
      rows.map((row) => ({
        ...row,
        paymentDate: row.paymentDate ? String(row.paymentDate) : null,
      })),
    );
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}

/** @deprecated Use getGroupedPayments */
export async function getPayments() {
  const groups = await getGroupedPayments();
  return groups.flatMap((group) =>
    group.lineItems.map((line) => ({
      id: line.paymentId,
      studentFirstName: group.studentFirstName,
      studentLastName: group.studentLastName,
      amount: line.amount,
      netAmount: null,
      vatAmount: null,
      paidDate: group.paidDate,
      method: group.method,
      paymentType: group.paymentType,
      receiptNumber: group.receiptNumber,
      referenceNumber: group.referenceNumber,
      className: line.className,
      offerId: null,
      offerTitle: group.offerTitle,
      discountAmount: line.discountAmount,
      status: normalizePaymentDisplayStatus(line.status),
      notes: group.notes,
    })),
  );
}

export async function getPaymentGroupByKey(
  groupKey: string,
): Promise<PaymentGroup | null> {
  const groups = await getGroupedPayments();
  return groups.find((g) => g.groupKey === groupKey) ?? null;
}

export async function getExpenses() {
  try {
    const allExpenses = await db.select().from(expenses);
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
    }));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function getFinancialSummary() {
  try {
    const currentMonth = `${new Date().toISOString().slice(0, 7)}-01`;

    const [revenueResult] = await db
      .select({
        total: sql<string>`cast(sum(${payments.amount}) as text)`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.paymentDate, currentMonth),
          inArray(payments.status, [...REVENUE_PAYMENT_STATUSES]),
        ),
      );

    const [expensesResult] = await db
      .select({
        total: sql<string>`cast(sum(${expenses.amount}) as text)`,
      })
      .from(expenses)
      .where(gte(expenses.expenseDate, currentMonth));

    const [outstandingResult] = await db
      .select({
        total: sql<string>`cast(sum(${payments.amount}) as text)`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.paymentDate, currentMonth),
          eq(payments.status, "pending"),
        ),
      );

    const totalRevenue = Number.parseFloat(revenueResult?.total || "0");
    const totalExpenses = Number.parseFloat(expensesResult?.total || "0");
    const outstanding = Number.parseFloat(outstandingResult?.total || "0");
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstanding,
    };
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      outstanding: 0,
    };
  }
}

type PaymentState = {
  success?: boolean;
  error?: string;
  enrolledCount?: number;
} | null;

async function insertPaymentRows(
  tx: typeof db,
  rows: Array<{
    studentId: string;
    paymentGroupId: string;
    classId: string | null;
    sessionId: string | null;
    offerId: string | null;
    amount: string;
    discountAmount?: string;
    netAmount: string;
    vatAmount: string;
    paymentDate: string;
    paymentMethod?: string;
    paymentType?: string;
    receiptNumber?: string;
    referenceNumber?: string;
    status: string;
    notes?: string;
  }>,
) {
  if (rows.length === 0) return [];
  const inserted =
    rows.length === 1
      ? await tx.insert(payments).values(rows[0]).returning({ id: payments.id })
      : await tx.insert(payments).values(rows).returning({ id: payments.id });
  return inserted;
}

export async function createPayment(
  _prevState: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  try {
    const studentId = formData.get("studentId") as string;
    const legacyClassId = formData.get("classId") as string | null;
    const classLineItems = parseClassLineItems(
      formData.get("classLineItems") as string | null,
    );
    const offerId = formData.get("offerId") as string | null;
    const amount = formData.get("amount") as string;
    const discountAmount = formData.get("discountAmount") as string | null;
    const paymentDate = formData.get("paymentDate") as string;
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const paymentType = formData.get("paymentType") as string | null;
    let receiptNumber =
      (formData.get("receiptNumber") as string | null)?.trim() || null;
    const referenceNumber = formData.get("referenceNumber") as string | null;
    const status = (formData.get("status") as string) || "completed";
    const notes = formData.get("notes") as string | null;

    if (!studentId) return { success: false, error: "Please select a student" };
    if (!ALLOWED_PAYMENT_STATUSES.has(status)) {
      return { success: false, error: "Invalid payment status" };
    }
    if (!amount || !paymentDate) {
      return { success: false, error: "Please fill in all required fields" };
    }

    const numericAmount = Number.parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return { success: false, error: "Invalid amount" };
    }

    const parsedDiscount =
      discountAmount && !Number.isNaN(Number.parseFloat(discountAmount))
        ? Number.parseFloat(discountAmount)
        : 0;
    const trimmedOfferId = offerId?.trim() || null;

    const lines: ClassLineItem[] =
      classLineItems.length > 0
        ? classLineItems
        : legacyClassId?.trim()
          ? [
              {
                classId: legacyClassId.trim(),
                sessionId: null,
                amount: numericAmount + parsedDiscount,
              },
            ]
          : [];

    if (lines.length > 1) {
      const keys = new Set(
        lines.map((l) => `${l.classId}:${l.sessionId ?? ""}`),
      );
      if (keys.size !== lines.length) {
        return {
          success: false,
          error: "Each class/session can only be selected once per payment",
        };
      }
    }

    if (!receiptNumber && lines.length > 0) {
      receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    }

    const paymentGroupId = crypto.randomUUID();
    const markEnrollmentPaid = status === "completed" || status === "paid";

    await db.transaction(async (tx) => {
      const client = tx as unknown as typeof db;
      const shared = {
        studentId,
        paymentGroupId,
        paymentDate,
        paymentMethod: paymentMethod || undefined,
        paymentType: paymentType || undefined,
        receiptNumber: receiptNumber || undefined,
        referenceNumber: referenceNumber || undefined,
        status,
        notes: notes || undefined,
      };

      const enrollmentLines: EnrollmentLine[] = [];

      if (lines.length === 0) {
        const { netAmount, vatAmount } = calculateVat(numericAmount, 5, true);
        await insertPaymentRows(client, [
          {
            ...shared,
            classId: null,
            sessionId: null,
            offerId: trimmedOfferId,
            amount: numericAmount.toString(),
            discountAmount:
              parsedDiscount > 0 ? parsedDiscount.toString() : undefined,
            netAmount: netAmount.toString(),
            vatAmount: vatAmount.toString(),
          },
        ]);
      } else if (lines.length === 1) {
        const [line] = prepareClassPaymentLines(lines, parsedDiscount);
        const { netAmount, vatAmount } = calculateVat(
          line.finalAmount,
          5,
          true,
        );
        const [inserted] = await insertPaymentRows(client, [
          {
            ...shared,
            classId: line.classId,
            sessionId: line.sessionId ?? null,
            offerId: line.offerId ?? trimmedOfferId,
            amount: line.finalAmount.toString(),
            discountAmount:
              line.discountAmount > 0
                ? line.discountAmount.toString()
                : undefined,
            netAmount: netAmount.toString(),
            vatAmount: vatAmount.toString(),
          },
        ]);
        enrollmentLines.push({
          classId: line.classId,
          sessionId: line.sessionId ?? null,
          paymentId: inserted.id,
        });
      } else {
        const allocated = prepareClassPaymentLines(lines, parsedDiscount);
        const paymentRows = allocated.map((line) => {
          const { netAmount, vatAmount } = calculateVat(
            line.finalAmount,
            5,
            true,
          );
          return {
            ...shared,
            classId: line.classId,
            sessionId: line.sessionId ?? null,
            offerId: line.offerId ?? trimmedOfferId,
            amount: line.finalAmount.toString(),
            discountAmount:
              line.discountAmount > 0
                ? line.discountAmount.toString()
                : undefined,
            netAmount: netAmount.toString(),
            vatAmount: vatAmount.toString(),
          };
        });
        const inserted = await insertPaymentRows(client, paymentRows);
        for (let i = 0; i < allocated.length; i++) {
          enrollmentLines.push({
            classId: allocated[i].classId,
            sessionId: allocated[i].sessionId ?? null,
            paymentId: inserted[i].id,
          });
        }
      }

      for (const line of enrollmentLines) {
        await syncEnrollmentsForClassPayment(
          client,
          studentId,
          line,
          paymentDate,
          markEnrollmentPaid,
        );
      }
    });

    revalidateFinancePaths();
    return {
      success: true,
      enrolledCount: lines.length > 0 ? lines.length : undefined,
    };
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create payment" };
  }
}

export async function completePaymentGroup(
  groupKey: string,
): Promise<PaymentState> {
  try {
    const group = await getPaymentGroupByKey(groupKey);
    if (!group) return { success: false, error: "Payment not found" };

    await db.transaction(async (tx) => {
      const client = tx as unknown as typeof db;
      await client
        .update(payments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(inArray(payments.id, group.paymentIds));

      await client
        .update(enrollments)
        .set({ paymentStatus: "paid", updatedAt: new Date() })
        .where(inArray(enrollments.paymentId, group.paymentIds));
    });

    revalidateFinancePaths();
    return { success: true };
  } catch (error) {
    console.error("Error completing payment:", error);
    return { success: false, error: "Failed to mark payment as collected" };
  }
}

export async function voidPaymentGroup(
  groupKey: string,
  reason?: string,
): Promise<PaymentState> {
  try {
    const group = await getPaymentGroupByKey(groupKey);
    if (!group) return { success: false, error: "Payment not found" };

    await db.transaction(async (tx) => {
      const client = tx as unknown as typeof db;
      await client
        .update(payments)
        .set({
          status: "refunded",
          notes: reason
            ? [group.notes, `Voided: ${reason}`].filter(Boolean).join("\n")
            : (group.notes ?? undefined),
          updatedAt: new Date(),
        })
        .where(inArray(payments.id, group.paymentIds));

      await client
        .update(enrollments)
        .set({
          paymentStatus: "pending",
          paymentId: null,
          updatedAt: new Date(),
        })
        .where(inArray(enrollments.paymentId, group.paymentIds));
    });

    revalidateFinancePaths();
    return { success: true };
  } catch (error) {
    console.error("Error voiding payment:", error);
    return { success: false, error: "Failed to void payment" };
  }
}

type UpdatePaymentState = { success?: boolean; error?: string } | null;

export async function updatePaymentGroup(
  _prev: UpdatePaymentState,
  formData: FormData,
): Promise<UpdatePaymentState> {
  try {
    const groupKey = formData.get("groupKey") as string;
    const paymentDate = formData.get("paymentDate") as string;
    const paymentMethod = formData.get("paymentMethod") as string | null;
    const paymentType = formData.get("paymentType") as string | null;
    const receiptNumber = formData.get("receiptNumber") as string | null;
    const referenceNumber = formData.get("referenceNumber") as string | null;
    const status = formData.get("status") as string;
    const notes = formData.get("notes") as string | null;

    if (!ALLOWED_PAYMENT_STATUSES.has(status)) {
      return { success: false, error: "Invalid payment status" };
    }

    const group = await getPaymentGroupByKey(groupKey);
    if (!group) return { success: false, error: "Payment not found" };

    const markEnrollmentPaid = status === "completed" || status === "paid";

    await db.transaction(async (tx) => {
      const client = tx as unknown as typeof db;
      await client
        .update(payments)
        .set({
          paymentDate,
          paymentMethod: paymentMethod || undefined,
          paymentType: paymentType || undefined,
          receiptNumber: receiptNumber || undefined,
          referenceNumber: referenceNumber || undefined,
          status,
          notes: notes || undefined,
          updatedAt: new Date(),
        })
        .where(inArray(payments.id, group.paymentIds));

      if (markEnrollmentPaid) {
        await client
          .update(enrollments)
          .set({ paymentStatus: "paid", updatedAt: new Date() })
          .where(inArray(enrollments.paymentId, group.paymentIds));
      } else if (status === "pending") {
        await client
          .update(enrollments)
          .set({ paymentStatus: "pending", updatedAt: new Date() })
          .where(inArray(enrollments.paymentId, group.paymentIds));
      }
    });

    revalidateFinancePaths();
    return { success: true };
  } catch (error) {
    console.error("Error updating payment:", error);
    return { success: false, error: "Failed to update payment" };
  }
}

type ExpenseState = {
  success?: boolean;
  error?: string;
} | null;

export async function createExpense(
  _prevState: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  try {
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const amount = formData.get("amount") as string;
    const date = formData.get("date") as string;
    const vendor = formData.get("vendor") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const notes = formData.get("notes") as string;

    if (!category || !description || !amount || !date) {
      return { success: false, error: "Please fill in all required fields" };
    }

    const numericAmount = Number.parseFloat(amount);
    if (Number.isNaN(numericAmount)) {
      return { success: false, error: "Invalid amount" };
    }

    const { netAmount, vatAmount } = calculateVat(numericAmount, 5, true);

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
    });

    revalidatePath("/dashboard/finances");
    return { success: true };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}
