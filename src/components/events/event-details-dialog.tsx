"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, DollarSign, Clock, Users } from "lucide-react"
import { formatDate } from "@/lib/date"

interface EventDetailsDialogProps {
  event: {
    id: string
    name: string
    eventType: string
    description: string | null
    eventDate: string
    startTime: string | null
    endTime: string | null
    location: string | null
    cost: string | null
    status: string
    participants: Array<{
      id: string
      studentName: string
      status: string | null
    }>
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge variant="secondary">{event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}</Badge>
            <Badge variant="secondary">{event.status}</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{event.eventDate ? formatDate(event.eventDate, "SHORT") : "-"}</span>
            </div>
            {event.startTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.startTime}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
            {event.cost && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${Number.parseFloat(event.cost).toFixed(2)}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Participants ({event.participants.length})</h4>
            </div>
            <div className="space-y-2">
              {event.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              ) : (
                event.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between text-sm">
                    <span>{participant.studentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {participant.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
