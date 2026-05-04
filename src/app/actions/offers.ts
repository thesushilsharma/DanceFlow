"use server"

import { db } from "@/drizzle/db"
import { offers } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"

export type Offer = {
  id: string
  title: string
  description: string | null
  offerType: string
  discountType: string
  discountValue: string
  minPurchaseAmount: string | null
  maxDiscountAmount: string | null
  couponCode: string | null
  usageLimit: number | null
  usageCount: number | null
  startDate: string
  endDate: string | null
  applicableTo: string[] | null
  status: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getOffers(): Promise<Offer[]> {
  try {
    const allOffers = await db.select().from(offers).orderBy(desc(offers.createdAt))
    return allOffers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      offerType: o.offerType,
      discountType: o.discountType,
      discountValue: o.discountValue,
      minPurchaseAmount: o.minPurchaseAmount,
      maxDiscountAmount: o.maxDiscountAmount,
      couponCode: o.couponCode,
      usageLimit: o.usageLimit,
      usageCount: o.usageCount,
      startDate: String(o.startDate),
      endDate: o.endDate ? String(o.endDate) : null,
      applicableTo: o.applicableTo ?? null,
      status: o.status,
      notes: o.notes,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }))
  } catch (error) {
    console.error("Failed to fetch offers:", error)
    return []
  }
}

export async function createOffer(prevState: any, formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const offerType = formData.get("offerType") as string
    const discountType = formData.get("discountType") as string
    const discountValue = formData.get("discountValue") as string
    const minPurchaseAmount = formData.get("minPurchaseAmount") as string | null
    const maxDiscountAmount = formData.get("maxDiscountAmount") as string | null
    const couponCode = formData.get("couponCode") as string | null
    const usageLimit = formData.get("usageLimit") as string | null
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string | null
    const status = (formData.get("status") as string) || "active"
    const notes = formData.get("notes") as string | null

    if (!title || !offerType || !discountValue || !startDate) {
      return { success: false, error: "Title, type, discount value and start date are required" }
    }

    await db.insert(offers).values({
      title,
      description: description || null,
      offerType,
      discountType: discountType || "percentage",
      discountValue,
      minPurchaseAmount: minPurchaseAmount || null,
      maxDiscountAmount: maxDiscountAmount || null,
      couponCode: couponCode || null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      startDate,
      endDate: endDate || null,
      status,
      notes: notes || null,
    })

    revalidatePath("/dashboard/offers")
    return { success: true, message: "Offer created successfully" }
  } catch (error) {
    console.error("Failed to create offer:", error)
    return { success: false, error: "Failed to create offer" }
  }
}

export async function updateOffer(offerId: string, formData: FormData) {
  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const offerType = formData.get("offerType") as string
    const discountType = formData.get("discountType") as string
    const discountValue = formData.get("discountValue") as string
    const minPurchaseAmount = formData.get("minPurchaseAmount") as string | null
    const maxDiscountAmount = formData.get("maxDiscountAmount") as string | null
    const couponCode = formData.get("couponCode") as string | null
    const usageLimit = formData.get("usageLimit") as string | null
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string | null
    const status = formData.get("status") as string
    const notes = formData.get("notes") as string | null

    await db
      .update(offers)
      .set({
        title,
        description: description || null,
        offerType,
        discountType,
        discountValue,
        minPurchaseAmount: minPurchaseAmount || null,
        maxDiscountAmount: maxDiscountAmount || null,
        couponCode: couponCode || null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        startDate,
        endDate: endDate || null,
        status,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, offerId))

    revalidatePath("/dashboard/offers")
    return { success: true, message: "Offer updated successfully" }
  } catch (error) {
    console.error("Failed to update offer:", error)
    return { success: false, error: "Failed to update offer" }
  }
}

export async function deleteOffer(offerId: string) {
  try {
    await db.delete(offers).where(eq(offers.id, offerId))
    revalidatePath("/dashboard/offers")
    return { success: true, message: "Offer deleted successfully" }
  } catch (error) {
    console.error("Failed to delete offer:", error)
    return { success: false, error: "Failed to delete offer" }
  }
}

export async function toggleOfferStatus(offerId: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    await db.update(offers).set({ status: newStatus, updatedAt: new Date() }).where(eq(offers.id, offerId))
    revalidatePath("/dashboard/offers")
    return { success: true, message: `Offer ${newStatus === "active" ? "activated" : "deactivated"}` }
  } catch (error) {
    console.error("Failed to toggle offer status:", error)
    return { success: false, error: "Failed to update offer status" }
  }
}
