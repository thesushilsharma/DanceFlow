"use server"

import { db } from "@/drizzle/db"
import { events, eventParticipants, students } from "@/drizzle/schema"
import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"

export async function getEvents() {
  try {
    const allEvents = await db.select().from(events).orderBy(desc(events.eventDate))

    // Deduplicate events just in case
    const uniqueEventsMap = new Map()
    allEvents.forEach(e => {
      if (uniqueEventsMap.has(e.id)) {
        console.warn(`Duplicate event ID found: ${e.id}`)
      } else {
        uniqueEventsMap.set(e.id, e)
      }
    })

    return Array.from(uniqueEventsMap.values()).map((event) => ({
      id: event.id,
      name: event.name,
      type: event.eventType as "recital" | "competition" | "workshop" | "showcase" | "other",
      description: event.description,
      date: String(event.eventDate),
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      cost: event.cost,
      status: event.status,
      capacity: null,
    }))
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return []
  }
}

export async function createEvent(prevState: any, formData: FormData) {
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
      status: (formData.get("status") as string) || "scheduled",
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

export async function getEventDetails(eventId: string) {
  try {
    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1)

    if (event.length === 0) {
      return null
    }

    const participants = await db
      .select({
        id: eventParticipants.id,
        studentId: students.id,
        studentName: students.firstName,
        studentLastName: students.lastName,
        status: eventParticipants.participationStatus,
        notes: eventParticipants.notes,
      })
      .from(eventParticipants)
      .leftJoin(students, eq(eventParticipants.studentId, students.id))
      .where(eq(eventParticipants.eventId, eventId))

    return {
      ...event[0],
      participants: participants.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        studentName: `${p.studentName} ${p.studentLastName}`,
        status: p.status,
        notes: p.notes,
      })),
    }
  } catch (error) {
    console.error("Failed to fetch event details:", error)
    return null
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const eventType = formData.get("type") as "recital" | "competition" | "workshop" | "showcase" | "other"
    const eventDate = formData.get("date") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string
    const cost = formData.get("cost") as string | null
    const status = formData.get("status") as string

    await db
      .update(events)
      .set({
        name,
        eventType,
        eventDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location || undefined,
        description: description || undefined,
        cost: cost || undefined,
        status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))

    revalidatePath("/dashboard/events")
    return { success: true, message: "Event updated successfully" }
  } catch (error) {
    console.error("Failed to update event:", error)
    return { success: false, error: "Failed to update event" }
  }
}

export async function addEventParticipant(eventId: string, studentId: string) {
  try {
    await db.insert(eventParticipants).values({
      eventId,
      studentId,
      participationStatus: "registered",
    })

    revalidatePath("/dashboard/events")
    return { success: true, message: "Participant added successfully" }
  } catch (error) {
    console.error("Failed to add participant:", error)
    return { success: false, error: "Failed to add participant" }
  }
}

export async function removeEventParticipant(participantId: string) {
  try {
    await db.delete(eventParticipants).where(eq(eventParticipants.id, participantId))

    revalidatePath("/dashboard/events")
    return { success: true, message: "Participant removed successfully" }
  } catch (error) {
    console.error("Failed to remove participant:", error)
    return { success: false, error: "Failed to remove participant" }
  }
}

export async function getStudentsForEvent() {
  try {
    const allStudents = await db
      .select({
        id: students.id,
        name: students.firstName,
        lastName: students.lastName,
      })
      .from(students)
      .where(eq(students.status, "active"))

    return allStudents.map((s) => ({
      id: s.id,
      name: `${s.name} ${s.lastName}`,
    }))
  } catch (error) {
    console.error("Failed to fetch students:", error)
    return []
  }
}