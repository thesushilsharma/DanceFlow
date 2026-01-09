"use client"

import { useActionState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateEvent } from "@/app/actions/events"

interface EditEventDialogProps {
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
    } | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
    const [state, formAction, isPending] = useActionState(
        async (_prevState: unknown, formData: FormData) => {
            if (!event) return { success: false, error: "No event selected" }
            const result = await updateEvent(event.id, formData)
            if (result.success) {
                onOpenChange(false)
            }
            return result
        },
        { success: false, error: "" },
    )

    if (!event) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Event Name</Label>
                        <Input id="name" name="name" defaultValue={event.name} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" defaultValue={event.eventType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recital">Recital</SelectItem>
                                    <SelectItem value="competition">Competition</SelectItem>
                                    <SelectItem value="workshop">Workshop</SelectItem>
                                    <SelectItem value="showcase">Showcase</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={event.status}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" name="date" type="date" defaultValue={event.eventDate} required />
                        </div>
                        <div>
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input id="startTime" name="startTime" type="time" defaultValue={event.startTime || ""} />
                        </div>
                        <div>
                            <Label htmlFor="endTime">End Time</Label>
                            <Input id="endTime" name="endTime" type="time" defaultValue={event.endTime || ""} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" defaultValue={event.location || ""} />
                        </div>
                        <div>
                            <Label htmlFor="cost">Cost</Label>
                            <Input id="cost" name="cost" type="number" step="0.01" defaultValue={event.cost || ""} />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" defaultValue={event.description || ""} rows={3} />
                    </div>

                    {state && "error" in state && state.error && <p className="text-sm text-destructive">{state.error}</p>}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
