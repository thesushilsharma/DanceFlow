"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { classSessions, enrollments, students } from "@/drizzle/schema"
import { eq, and, sql, inArray } from "drizzle-orm"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClassSession = {
  id: string
  classId: string
  name: string
  songTitle: string | null
  artist: string | null
  choreographyNotes: string | null
  startDate: string
  endDate: string | null
  tuitionFee: string | null
  maxCapacity: number | null
  status: string
  notes: string | null
  enrollmentCount: number
  createdAt: Date
  updatedAt: Date
}

type SessionState = { success?: boolean; error?: string } | null

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getClassSessions(classId: string): Promise<ClassSession[]> {
  try {
    const rows = await db
      .select({
        id: classSessions.id,
        classId: classSessions.classId,
        name: classSessions.name,
        songTitle: classSessions.songTitle,
        artist: classSessions.artist,
        choreographyNotes: classSessions.choreographyNotes,
        startDate: classSessions.startDate,
        endDate: classSessions.endDate,
        tuitionFee: classSessions.tuitionFee,
        maxCapacity: classSessions.maxCapacity,
        status: classSessions.status,
        notes: classSessions.notes,
        enrollmentCount: sql<number>`cast(count(${enrollments.id}) as integer)`,
        createdAt: classSessions.createdAt,
        updatedAt: classSessions.updatedAt,
      })
      .from(classSessions)
      .leftJoin(
        enrollments,
        and(
          eq(enrollments.sessionId, classSessions.id),
          eq(enrollments.status, "active")
        )
      )
      .where(eq(classSessions.classId, classId))
      .groupBy(classSessions.id)

    return rows.map((r) => ({
      ...r,
      startDate: String(r.startDate),
      endDate: r.endDate ? String(r.endDate) : null,
      tuitionFee: r.tuitionFee ?? null,
    }))
  } catch (error) {
    console.error("Error fetching class sessions:", error)
    return []
  }
}

export async function getSessionEnrollments(sessionId: string) {
  try {
    const rows = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        studentEmail: students.email,
        studentLevel: students.level,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        paymentStatus: enrollments.paymentStatus,
        notes: enrollments.notes,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.sessionId, sessionId))

    return rows
  } catch (error) {
    console.error("Error fetching session enrollments:", error)
    return []
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createSession(
  classId: string,
  prevState: SessionState,
  formData: FormData
): Promise<SessionState> {
  try {
    const name = (formData.get("name") as string)?.trim()
    const songTitle = (formData.get("songTitle") as string)?.trim() || null
    const artist = (formData.get("artist") as string)?.trim() || null
    const choreographyNotes = (formData.get("choreographyNotes") as string)?.trim() || null
    const startDate = formData.get("startDate") as string
    const endDate = (formData.get("endDate") as string) || null
    const tuitionFee = (formData.get("tuitionFee") as string)?.trim() || null
    const maxCapacityStr = (formData.get("maxCapacity") as string)?.trim()
    const status = (formData.get("status") as string) || "upcoming"
    const notes = (formData.get("notes") as string)?.trim() || null

    if (!name || !startDate) {
      return { success: false, error: "Session name and start date are required" }
    }

    const maxCapacity =
      maxCapacityStr && !isNaN(Number(maxCapacityStr)) ? Number(maxCapacityStr) : null

    await db.insert(classSessions).values({
      classId,
      name,
      songTitle,
      artist,
      choreographyNotes,
      startDate,
      endDate: endDate || null,
      tuitionFee: tuitionFee || null,
      maxCapacity,
      status,
      notes,
    })

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error creating session:", error)
    return { success: false, error: "Failed to create session" }
  }
}

export async function updateSession(
  sessionId: string,
  prevState: SessionState,
  formData: FormData
): Promise<SessionState> {
  try {
    const name = (formData.get("name") as string)?.trim()
    const songTitle = (formData.get("songTitle") as string)?.trim() || null
    const artist = (formData.get("artist") as string)?.trim() || null
    const choreographyNotes = (formData.get("choreographyNotes") as string)?.trim() || null
    const startDate = formData.get("startDate") as string
    const endDate = (formData.get("endDate") as string) || null
    const tuitionFee = (formData.get("tuitionFee") as string)?.trim() || null
    const maxCapacityStr = (formData.get("maxCapacity") as string)?.trim()
    const status = formData.get("status") as string
    const notes = (formData.get("notes") as string)?.trim() || null

    if (!name || !startDate) {
      return { success: false, error: "Session name and start date are required" }
    }

    const maxCapacity =
      maxCapacityStr && !isNaN(Number(maxCapacityStr)) ? Number(maxCapacityStr) : null

    await db
      .update(classSessions)
      .set({
        name,
        songTitle,
        artist,
        choreographyNotes,
        startDate,
        endDate: endDate || null,
        tuitionFee: tuitionFee || null,
        maxCapacity,
        status,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(classSessions.id, sessionId))

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error updating session:", error)
    return { success: false, error: "Failed to update session" }
  }
}

export async function deleteSession(sessionId: string) {
  try {
    const existing = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(enrollments)
      .where(eq(enrollments.sessionId, sessionId))

    if (existing[0].count > 0) {
      return {
        success: false,
        error: `Cannot delete session — ${existing[0].count} active enrollment(s) exist`,
      }
    }

    await db.delete(classSessions).where(eq(classSessions.id, sessionId))
    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting session:", error)
    return { success: false, error: "Failed to delete session" }
  }
}

export async function addSessionEnrollment(
  sessionId: string,
  classId: string,
  studentIds: string[]
) {
  try {
    if (!studentIds.length) {
      return { success: false, error: "Please select at least one student" }
    }

    // Fetch session capacity
    const [session] = await db
      .select()
      .from(classSessions)
      .where(eq(classSessions.id, sessionId))
      .limit(1)

    if (!session) return { success: false, error: "Session not found" }

    // Prevent duplicate enrollment in the same session
    const existing = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.sessionId, sessionId),
          inArray(enrollments.studentId, studentIds)
        )
      )

    const existingIds = new Set(existing.map((e) => e.studentId))
    const newStudentIds = studentIds.filter((id) => !existingIds.has(id))

    if (!newStudentIds.length) {
      return { success: false, error: "All selected students are already enrolled in this session" }
    }

    // Check capacity (session maxCapacity overrides class maxCapacity if set)
    if (session.maxCapacity !== null) {
      const [count] = await db
        .select({ n: sql<number>`cast(count(*) as integer)` })
        .from(enrollments)
        .where(and(eq(enrollments.sessionId, sessionId), eq(enrollments.status, "active")))

      if (count.n + newStudentIds.length > session.maxCapacity) {
        return {
          success: false,
          error: `Session capacity exceeded. Only ${session.maxCapacity - count.n} spot(s) remaining.`,
        }
      }
    }

    await db.insert(enrollments).values(
      newStudentIds.map((studentId) => ({
        studentId,
        classId,
        sessionId,
        enrollmentDate: new Date().toISOString().split("T")[0],
        status: "active",
        paymentStatus: "pending",
      }))
    )

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error adding session enrollment:", error)
    return { success: false, error: "Failed to enroll students" }
  }
}

/**
 * Renewal: copy all active students from a previous session into a new one.
 * Students who already appear in the target session are skipped.
 */
export async function renewSessionEnrollments(
  fromSessionId: string,
  toSessionId: string,
  classId: string
) {
  try {
    const prevEnrollments = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(
        and(eq(enrollments.sessionId, fromSessionId), eq(enrollments.status, "active"))
      )

    if (!prevEnrollments.length) {
      return { success: false, error: "No active students in the previous session" }
    }

    const studentIds = prevEnrollments.map((e) => e.studentId)

    // Skip those already in the target session
    const alreadyIn = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(
        and(eq(enrollments.sessionId, toSessionId), inArray(enrollments.studentId, studentIds))
      )

    const skipIds = new Set(alreadyIn.map((e) => e.studentId))
    const toEnroll = studentIds.filter((id) => !skipIds.has(id))

    if (!toEnroll.length) {
      return { success: false, error: "All students are already enrolled in the new session" }
    }

    await db.insert(enrollments).values(
      toEnroll.map((studentId) => ({
        studentId,
        classId,
        sessionId: toSessionId,
        enrollmentDate: new Date().toISOString().split("T")[0],
        status: "active",
        paymentStatus: "pending",
        notes: "Renewed from previous session",
      }))
    )

    revalidatePath("/dashboard/classes")
    return { success: true, count: toEnroll.length }
  } catch (error) {
    console.error("Error renewing enrollments:", error)
    return { success: false, error: "Failed to renew enrollments" }
  }
}

/**
 * Get all active session enrollments for a student across all classes.
 * Used on the student profile page.
 */
export async function getStudentActiveSessions(studentId: string) {
  try {
    const rows = await db
      .select({
        enrollmentId: enrollments.id,
        classId: enrollments.classId,
        sessionId: classSessions.id,
        sessionName: classSessions.name,
        songTitle: classSessions.songTitle,
        artist: classSessions.artist,
        startDate: classSessions.startDate,
        endDate: classSessions.endDate,
        sessionStatus: classSessions.status,
        enrollmentStatus: enrollments.status,
        paymentStatus: enrollments.paymentStatus,
        enrollmentDate: enrollments.enrollmentDate,
      })
      .from(enrollments)
      .innerJoin(classSessions, eq(enrollments.sessionId, classSessions.id))
      .where(eq(enrollments.studentId, studentId))

    return rows
  } catch (error) {
    console.error("Error fetching student sessions:", error)
    return []
  }
}
