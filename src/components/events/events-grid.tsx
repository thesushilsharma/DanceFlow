"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, DollarSign, Users, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteEvent } from "@/app/actions/events"
import { useOptimistic, useTransition } from "react"

interface Event {
  id: string
  name: string
  type: "recital" | "competition" | "workshop" | "showcase" | "other"
  description: string | null
  date: string
  startTime: string | null
  endTime: string | null
  location: string | null
  cost: string | null
  status: string
  capacity: number | null
  participantCount?: number
}

const typeColors = {
  Recital: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Competition: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  Performance: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Workshop: "bg-green-500/10 text-green-700 dark:text-green-400",
  Showcase: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  Other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "in-progress": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function EventsGrid({ initialEvents }: { initialEvents: Event[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticEvents, setOptimisticEvents] = useOptimistic(initialEvents)

  const handleDelete = (eventId: string) => {
    startTransition(async () => {
      setOptimisticEvents(optimisticEvents.filter((e) => e.id !== eventId))
      await deleteEvent(eventId)
    })
  }

  const formatTimeRange = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "Time TBA"
    return endTime ? `${startTime} - ${endTime}` : startTime
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {optimisticEvents.map((event) => (
        <Card key={event.id} className={`flex flex-col ${isPending ? "opacity-50" : ""}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      typeColors[(event.type.charAt(0).toUpperCase() + event.type.slice(1)) as keyof typeof typeColors]
                    }
                  >
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={
                      statusColors[event.status as keyof typeof statusColors] || "bg-gray-500/10 text-gray-700"
                    }
                  >
                    {event.status}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Manage Participants</DropdownMenuItem>
                  <DropdownMenuItem>Edit Event</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(event.id)}>
                    Cancel Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">{event.description || "No description"}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.cost && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${Number.parseFloat(event.cost).toFixed(2)}</span>
                </div>
              )}
              {event.participantCount !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{event.participantCount} participants</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full bg-transparent">
              Manage Participants
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
