"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { classes, enrollments, staff } from "@/drizzle/migrations/schema"
import { eq, sql } from "drizzle-orm"

export async function getClasses() {
  try {
    const classesWithDetails = await db
      .select({
        id: classes.id,
        name: classes.name,
        type: classes.type,
        level: classes.level,
        dayOfWeek: classes.dayOfWeek,
        startTime: classes.startTime,
        endTime: classes.endTime,
        room: classes.room,
        capacity: classes.capacity,
        tuition: classes.tuition,
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
    throw new Error("Failed to fetch classes")
  }
}

export async function createClass(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const level = formData.get("level") as string
    const instructorId = formData.get("instructorId") as string
    const dayOfWeek = formData.get("dayOfWeek") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const room = formData.get("room") as string
    const capacity = Number.parseInt(formData.get("capacity") as string)
    const tuition = formData.get("tuition") as string
    const status = (formData.get("status") as any) || "active"
    const startDate = formData.get("startDate") as string

    await db.insert(classes).values({
      name,
      type,
      level,
      instructorId: instructorId || null,
      dayOfWeek,
      startTime,
      endTime,
      room,
      capacity,
      tuition,
      status,
      startDate,
    })

    revalidatePath("/dashboard/classes")
    return { success: true }
  } catch (error) {
    console.error("Error creating class:", error)
    return { success: false, error: "Failed to create class" }
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
