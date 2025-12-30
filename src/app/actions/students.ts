"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { students } from "@/drizzle/schema"
import { eq, ilike, or } from "drizzle-orm"

export async function getStudents(searchQuery?: string) {
  try {
    const query = db.select().from(students)
    const allStudents = searchQuery
      ? await query.where(
          or(
            ilike(students.firstName, `%${searchQuery}%`),
            ilike(students.lastName, `%${searchQuery}%`),
            ilike(students.email, `%${searchQuery}%`),
          ),
        )
      : await query
    
    return allStudents.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: String(student.dateOfBirth),
      email: student.email,
      phone: student.phone,
      level: student.level,
      status: student.status,
      enrollmentDate: String(student.enrollmentDate),
    }))
  } catch (error) {
    console.error("Error fetching students:", error)
    return []
  }
}

export async function createStudent(formData: FormData) {
  try {
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const dateOfBirth = formData.get("dateOfBirth") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const emergencyContact = formData.get("emergencyContact") as string
    const emergencyPhone = formData.get("emergencyPhone") as string
    const level = formData.get("level") as string
    const status = (formData.get("status") as string) || "active"
    const medicalNotes = formData.get("medicalNotes") as string

    await db.insert(students).values({
      firstName,
      lastName,
      dateOfBirth,
      email,
      phone,
      address,
      emergencyContactName: emergencyContact,
      emergencyContactPhone: emergencyPhone,
      level,
      status,
      medicalConditions: medicalNotes,
      enrollmentDate: new Date().toISOString().split("T")[0],
    })

    revalidatePath("/dashboard/students")
    return { success: true }
  } catch (error) {
    console.error("Error creating student:", error)
    return { success: false, error: "Failed to create student" }
  }
}

export async function deleteStudent(id: string) {
  try {
    await db.delete(students).where(eq(students.id, id))
    revalidatePath("/dashboard/students")
    return { success: true }
  } catch (error) {
    console.error("Error deleting student:", error)
    return { success: false, error: "Failed to delete student" }
  }
}