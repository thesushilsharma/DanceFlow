"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { classes, enrollments, staff, students } from "@/drizzle/schema"
import { eq, sql, inArray, and } from "drizzle-orm"

export async function getClasses() {
  try {
    const classesWithDetails = await db
      .select({
        id: classes.id,
        name: classes.name,
        type: classes.classType,
        level: classes.level,
        dayOfWeek: classes.dayOfWeek,
        startTime: classes.startTime,
        endTime: classes.endTime,
        room: classes.room,
        capacity: classes.maxCapacity,
        tuition: classes.tuitionFee,
        status: classes.status,
        instructorId: classes.instructorId,
        instructorFirstName: staff.firstName,
        instructorLastName: staff.lastName,
        description: classes.description,
        enrollmentCount: sql<number>`cast(count(${enrollments.id}) as integer)`,
      })
      .from(classes)
      .leftJoin(staff, eq(classes.instructorId, staff.id))
      .leftJoin(enrollments, eq(classes.id, enrollments.classId))
      .groupBy(classes.id, staff.id)

    return classesWithDetails
  } catch (error) {
    console.error("Error fetching classes:", error)
    return []
  }
}

type CreateClassState = {
  success?: boolean
  error?: string
} | null

export async function createClass(
  prevState: CreateClassState,
  formData: FormData
): Promise<CreateClassState> {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const level = formData.get("level") as string | null
    const instructorId = formData.get("instructorId") as string | null
    const dayOfWeek = formData.get("dayOfWeek") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const room = formData.get("room") as string | null
    const capacityStr = formData.get("capacity") as string
    const tuition = formData.get("tuition") as string | null
    const status = (formData.get("status") as string) || "active"
    const description = formData.get("description") as string | null

    // Validate required fields
    if (!name || !type || !dayOfWeek || !startTime || !endTime || !capacityStr) {
      return { success: false, error: "Please fill in all required fields" }
    }

    const capacity = Number.parseInt(capacityStr, 10)
    if (isNaN(capacity) || capacity <= 0) {
      return { success: false, error: "Capacity must be a positive number" }
    }

    // Convert empty strings to null for optional fields
    const cleanDescription = description && description.trim() ? description.trim() : null
    const cleanLevel = level && level.trim() ? level.trim() : null
    const cleanRoom = room && room.trim() ? room.trim() : null
    const cleanInstructorId = instructorId && instructorId.trim() ? instructorId.trim() : null
    const cleanTuition = tuition && tuition.trim() ? tuition.trim() : null

    await db.insert(classes).values({
      name: name.trim(),
      description: cleanDescription,
      classType: type,
      level: cleanLevel,
      instructorId: cleanInstructorId,
      dayOfWeek,
      startTime,
      endTime,
      room: cleanRoom,
      maxCapacity: capacity,
      tuitionFee: cleanTuition,
      status,
    })

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error creating class:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create class" }
  }
}

export async function deleteClass(id: string) {
  try {
    await db.delete(classes).where(eq(classes.id, id))
    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting class:", error)
    return { success: false, error: "Failed to delete class" }
  }
}

type UpdateClassState = {
  success?: boolean
  error?: string
} | null

export async function updateClass(
  id: string,
  prevState: UpdateClassState,
  formData: FormData
): Promise<UpdateClassState> {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const level = formData.get("level") as string | null
    const instructorId = formData.get("instructorId") as string | null
    const dayOfWeek = formData.get("dayOfWeek") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const room = formData.get("room") as string | null
    const capacityStr = formData.get("capacity") as string
    const tuition = formData.get("tuition") as string | null
    const status = (formData.get("status") as string) || "active"
    const description = formData.get("description") as string | null

    // Validate required fields
    if (!name || !type || !dayOfWeek || !startTime || !endTime || !capacityStr) {
      return { success: false, error: "Please fill in all required fields" }
    }

    const capacity = Number.parseInt(capacityStr, 10)
    if (isNaN(capacity) || capacity <= 0) {
      return { success: false, error: "Capacity must be a positive number" }
    }

    // Convert empty strings to null for optional fields
    const cleanDescription = description && description.trim() ? description.trim() : null
    const cleanLevel = level && level.trim() ? level.trim() : null
    const cleanRoom = room && room.trim() ? room.trim() : null
    const cleanInstructorId = instructorId && instructorId.trim() ? instructorId.trim() : null
    const cleanTuition = tuition && tuition.trim() ? tuition.trim() : null

    await db
      .update(classes)
      .set({
        name: name.trim(),
        description: cleanDescription,
        classType: type,
        level: cleanLevel,
        instructorId: cleanInstructorId,
        dayOfWeek,
        startTime,
        endTime,
        room: cleanRoom,
        maxCapacity: capacity,
        tuitionFee: cleanTuition,
        status,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error updating class:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to update class" }
  }
}

export async function getClassEnrollments(classId: string) {
  try {
    const classEnrollments = await db
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
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.classId, classId))

    return classEnrollments
  } catch (error) {
    console.error("Error fetching class enrollments:", error)
    return []
  }
}

export async function addEnrollment(classId: string, studentIds: string[]) {
  try {
    if (!studentIds || studentIds.length === 0) {
      return { success: false, error: "Please select at least one student" }
    }

    // Check class capacity
    const classData = await db.select().from(classes).where(eq(classes.id, classId)).limit(1)
    if (classData.length === 0) {
      return { success: false, error: "Class not found" }
    }

    // Check existing enrollments to prevent duplicates
    const existing = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(and(eq(enrollments.classId, classId), inArray(enrollments.studentId, studentIds)))

    const existingStudentIds = new Set(existing.map((e) => e.studentId))
    const newStudentIds = studentIds.filter((id) => !existingStudentIds.has(id))

    if (newStudentIds.length === 0) {
      return { success: false, error: "All selected students are already enrolled" }
    }

    const enrollmentCount = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(enrollments)
      .where(eq(enrollments.classId, classId))

    if (enrollmentCount[0].count + newStudentIds.length > classData[0].maxCapacity) {
      return { success: false, error: `Class capacity exceeded. Cannot add ${newStudentIds.length} more student(s).` }
    }

    const newEnrollments = newStudentIds.map((studentId) => ({
      studentId,
      classId,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "active",
      paymentStatus: "pending",
    }))

    await db.insert(enrollments).values(newEnrollments)

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error adding enrollment:", error)
    return { success: false, error: "Failed to add enrollment" }
  }
}

export async function removeEnrollment(enrollmentId: string) {
  try {
    await db.delete(enrollments).where(eq(enrollments.id, enrollmentId))
    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error removing enrollment:", error)
    return { success: false, error: "Failed to remove enrollment" }
  }
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: string,
  paymentStatus: string
) {
  try {
    await db
      .update(enrollments)
      .set({
        status,
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId))

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error updating enrollment status:", error)
    return { success: false, error: "Failed to update enrollment status" }
  }
}

