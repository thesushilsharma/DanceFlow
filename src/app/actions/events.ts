"use server"

import { db } from "@/drizzle/db"
import { events } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"

export async function getEvents() {
  try {
    const allEvents = await db.select().from(events).orderBy(desc(events.eventDate))
    return allEvents
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return []
  }
}

export async function createEvent(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const eventType = formData.get("type") as "recital" | "competition" | "workshop" | "showcase" | "other"
    const eventDate = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string
    const cost = formData.get("cost") as string | null

    await db.insert(events).values({
      name,
      eventType,
      eventDate,
      startTime,
      endTime,
      location,
      description,
      cost,
      status: "upcoming",
    })

    revalidatePath("/dashboard/events")
    return { success: true, message: "Event created successfully" }
  } catch (error) {
    console.error("Failed to create event:", error)
    return { success: false, error: "Failed to create event" }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    await db.delete(events).where(eq(events.id, eventId))
    revalidatePath("/dashboard/events")
    return { success: true, message: "Event deleted successfully" }
  } catch (error) {
    console.error("Failed to delete event:", error)
    return { success: false, error: "Failed to delete event" }
  }
}