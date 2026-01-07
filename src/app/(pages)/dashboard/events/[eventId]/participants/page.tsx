import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function EventParticipantsPage({ params }: { params: { eventId: string } }) {
    const { eventId } = await params

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/events">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Participants</h1>
                    <p className="text-muted-foreground">Add or remove participants for this event</p>
                </div>
            </div>

            <div className="border rounded-lg p-8 text-center text-muted-foreground">
                Participant management for event {eventId} coming soon...
            </div>
        </div>
    )
}
