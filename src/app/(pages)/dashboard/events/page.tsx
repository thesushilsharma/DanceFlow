import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { EventsGrid } from "@/components/events/events-grid"
import { AddEventDialog } from "@/components/events/add-event-dialog"
import { getEvents } from "@/app/actions/events"

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">Manage recitals, competitions, and performances</p>
        </div>
        <AddEventDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </AddEventDialog>
      </div>

      <EventsGrid initialEvents={events ?? []} />
    </div>
  )
}
