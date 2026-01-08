"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addEventParticipant, removeEventParticipant } from "@/app/actions/events"
import { toast } from "sonner";

interface ManageParticipantsDialogProps {
  event: {
    id: string
    name: string
    participants: Array<{
      id: string
      studentId: string | null
      studentName: string
      status: string | null
    }>
  } | null
  allStudents: Array<{
    id: string
    name: string
  }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageParticipantsDialog({ event, allStudents, open, onOpenChange }: ManageParticipantsDialogProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  if (!event) return null

  const handleAddParticipant = () => {
    if (!selectedStudent) return

    startTransition(async () => {
      const result = await addEventParticipant(event.id, selectedStudent)
      if (result.success) {
        toast.success(result.message)
        setSelectedStudent("")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRemoveParticipant = (participantId: string) => {
    startTransition(async () => {
      const result = await removeEventParticipant(participantId)
      if (result.success) {
        toast.success(result.message)
        setSelectedStudent("")
      } else {
        toast.error(result.error)
      }
    })
  }

  const enrolledStudentIds = new Set(event.participants.map((p) => p.studentId).filter(Boolean))
  const availableStudents = allStudents.filter((s) => !enrolledStudentIds.has(s.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Participants - {event.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddParticipant} disabled={!selectedStudent || isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Current Participants ({event.participants.length})</h4>
            <div className="space-y-2">
              {event.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              ) : (
                event.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{participant.studentName}</span>
                      <Badge variant="outline" className="text-xs">
                        {participant.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
