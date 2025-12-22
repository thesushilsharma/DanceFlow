"use server"

import { db } from "@/drizzle/db"
import { documents } from "@/drizzle/migrations/schema"
import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"

export async function getDocuments() {
  try {
    const allDocuments = await db.select().from(documents).orderBy(desc(documents.uploadedAt))
    return { success: true, data: allDocuments }
  } catch (error) {
    console.error("Failed to fetch documents:", error)
    return { success: false, error: "Failed to fetch documents" }
  }
}

export async function uploadDocument(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as "contract" | "medical" | "waiver" | "certificate" | "other"
    const studentId = formData.get("studentId") as string | null
    const uploadedBy = formData.get("uploadedBy") as string
    const fileSize = formData.get("fileSize") ? Number.parseInt(formData.get("fileSize") as string) : null
    const fileUrl = formData.get("fileUrl") as string // In production, handle actual file upload
    const notes = formData.get("notes") as string

    await db.insert(documents).values({
      name,
      type,
      studentId,
      uploadedBy,
      fileSize,
      fileUrl,
      notes,
    })

    revalidatePath("/dashboard/documents")
    return { success: true, message: "Document uploaded successfully" }
  } catch (error) {
    console.error("Failed to upload document:", error)
    return { success: false, error: "Failed to upload document" }
  }
}

export async function deleteDocument(documentId: string) {
  try {
    await db.delete(documents).where(eq(documents.id, documentId))
    revalidatePath("/dashboard/documents")
    return { success: true, message: "Document deleted successfully" }
  } catch (error) {
    console.error("Failed to delete document:", error)
    return { success: false, error: "Failed to delete document" }
  }
}