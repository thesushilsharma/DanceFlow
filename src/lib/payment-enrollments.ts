import { and, eq, isNull, sql } from "drizzle-orm";
import { classes, classSessions, enrollments } from "@/drizzle/schema";

export type EnrollmentLine = {
  classId: string;
  sessionId: string | null;
  paymentId: string;
};

export async function syncEnrollmentsForClassPayment(
  tx: any,
  studentId: string,
  line: EnrollmentLine,
  enrollmentDate: string,
  markAsPaid: boolean,
) {
  const enrollmentPaymentStatus = markAsPaid ? "paid" : "pending";

  const existingQuery = line.sessionId
    ? and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.sessionId, line.sessionId),
      )
    : and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.classId, line.classId),
        isNull(enrollments.sessionId),
      );

  const [existing] = await tx
    .select({ id: enrollments.id, paymentStatus: enrollments.paymentStatus })
    .from(enrollments)
    .where(existingQuery)
    .limit(1);

  if (existing) {
    await tx
      .update(enrollments)
      .set({
        paymentId: line.paymentId,
        paymentStatus: markAsPaid ? "paid" : existing.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, existing.id));
    return;
  }

  if (line.sessionId) {
    const [session] = await tx
      .select({
        name: classSessions.name,
        maxCapacity: classSessions.maxCapacity,
      })
      .from(classSessions)
      .where(eq(classSessions.id, line.sessionId))
      .limit(1);

    if (!session) throw new Error("Selected session was not found");

    if (session.maxCapacity !== null) {
      const [countRow] = await tx
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.sessionId, line.sessionId),
            eq(enrollments.status, "active"),
          ),
        );

      if (countRow.count >= session.maxCapacity) {
        throw new Error(
          `${session.name} is at full capacity. Payment was not recorded.`,
        );
      }
    }
  } else {
    const [classData] = await tx
      .select({ name: classes.name, maxCapacity: classes.maxCapacity })
      .from(classes)
      .where(eq(classes.id, line.classId))
      .limit(1);

    if (!classData)
      throw new Error("One or more selected classes were not found");

    const [countRow] = await tx
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, line.classId),
          eq(enrollments.status, "active"),
        ),
      );

    if (countRow.count >= classData.maxCapacity) {
      throw new Error(
        `${classData.name} is at full capacity. Payment was not recorded.`,
      );
    }
  }

  await tx.insert(enrollments).values({
    studentId,
    classId: line.classId,
    sessionId: line.sessionId,
    paymentId: line.paymentId,
    enrollmentDate,
    status: "active",
    paymentStatus: enrollmentPaymentStatus,
  });
}
