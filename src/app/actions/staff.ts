"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/drizzle/db"
import { staff } from  "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function getStaff() {
  try {
    return await db.select().from(staff)
  } catch (error) {
    console.error("Error fetching staff:", error)
    throw new Error("Failed to fetch staff")
  }
}

export async function createStaff(formData: FormData) {
  try {
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const role = formData.get("role") as string
    const specialization = formData.get("specialization") as string
    const hireDate = formData.get("hireDate") as string
    const salary = formData.get("salary") as string
    const status = (formData.get("status") as string) || "active"

    await db.insert(staff).values({
      firstName,
      lastName,
      email,
      phone,
      role,
      specializations: specialization ? [specialization] : undefined,
      hireDate,
      salary: salary ? salary : undefined,
      status,
    })

    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (error) {
    console.error("Error creating staff:", error)
    return { success: false, error: "Failed to create staff member" }
  }
}

export async function deleteStaff(id: string) {
  try {
    await db.delete(staff).where(eq(staff.id, id))
    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (error) {
    console.error("Error deleting staff:", error)
    return { success: false, error: "Failed to delete staff member" }
  }
}
