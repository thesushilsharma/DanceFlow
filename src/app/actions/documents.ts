"use server"

import { db } from "@/drizzle/db"
import { documents } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"
import fs from "fs/promises"
import path from "path"

export async function getDocuments() {
  try {
    const allDocuments = await db.select().from(documents).orderBy(desc(documents.uploadedAt))
    return allDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType as "contract" | "waiver" | "medical" | "certificate" | "other",
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.uploadedAt,
      studentId: doc.studentId,
    }))
  } catch (error) {
    console.error("Failed to fetch documents:", error)
    return []
  }
}

export async function uploadDocument(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as "contract" | "medical" | "waiver" | "certificate" | "other"
    const studentId = formData.get("studentId") as string | null
    const uploadedBy = "System" // In a real app, get current user
    const file = formData.get("file") as File
    const notes = formData.get("notes") as string

    if (!file || file.size === 0) {
      return { success: false, error: "No file provided" }
    }

    // Save file locally
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${Date.now()}-${file.name}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true })

    await fs.writeFile(path.join(uploadDir, fileName), buffer)
    const fileUrl = `/uploads/${fileName}`

    await db.insert(documents).values({
      title: name,
      documentType: type,
      fileName: file.name,
      studentId: studentId && studentId !== "general" ? studentId : null,
      uploadedBy,
      fileSize: file.size,
      fileUrl,
      description: notes,
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