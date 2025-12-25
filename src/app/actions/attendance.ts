"use server"

import { db } from "@/drizzle/db"
import { attendance, enrollments, students } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"

export async function getAttendanceForClass(classId: string, date: string) {
  try {
    // Get all enrolled students for the class
    const enrolled = await db
      .select({
        studentId: enrollments.studentId,
        firstName: students.firstName,
        lastName: students.lastName,
        enrollmentId: enrollments.id,
      })
      .from(enrollments)
      .innerJoin(students, eq(students.id, enrollments.studentId))
      .where(eq(enrollments.classId, classId))

    // Get attendance records for this class and date
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.classId, classId), eq(attendance.attendanceDate, date)))

    // Combine the data
    const attendanceData = enrolled.map((student) => {
      const record = attendanceRecords.find((a) => a.studentId === student.studentId)
      return {
        id: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        status: record?.status || "absent",
        attendanceId: record?.id,
      }
    })

    return { success: true, data: attendanceData }
  } catch (error) {
    console.error("Failed to fetch attendance:", error)
    return { success: false, error: "Failed to fetch attendance" }
  }
}

export async function updateAttendance(
  classId: string,
  studentId: string,
  date: string,
  status: "present" | "absent" | "late" | "excused",
  attendanceId?: string,
) {
  try {
    if (attendanceId) {
      // Update existing record
      await db.update(attendance).set({ status }).where(eq(attendance.id, attendanceId))
    } else {
      // Create new record
      await db.insert(attendance).values({
        classId,
        studentId,
        attendanceDate: date,
        status,
      })
    }

    revalidatePath("/dashboard/attendance")
    return { success: true, message: "Attendance updated successfully" }
  } catch (error) {
    console.error("Failed to update attendance:", error)
    return { success: false, error: "Failed to update attendance" }
  }
}