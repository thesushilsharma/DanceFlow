"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { classes, enrollments, staff } from "@/drizzle/schema"
import { eq, sql } from "drizzle-orm"

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

