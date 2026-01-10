"use client"

import { useState, useTransition, useOptimistic } from "react"
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
  onEventUpdated: () => Promise<void>
}

export function ManageParticipantsDialog({ event, allStudents, open, onOpenChange, onEventUpdated }: ManageParticipantsDialogProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const [optimisticParticipants, addOptimisticParticipant] = useOptimistic(
    event?.participants || [],
    (
      state,
      action: {
        type: "add" | "remove"
        participant?: {
          id: string
          studentId: string | null
          studentName: string
          status: string | null
        }
        id?: string
      }
    ) => {
      if (action.type === "add" && action.participant) {
        return [...state, action.participant]
      } else if (action.type === "remove") {
        return state.filter((p) => p.id !== action.id)
      }
      return state
    }
  )

  if (!event) return null

  const handleAddParticipant = () => {
    if (!selectedStudent) return

    const studentToAdd = allStudents.find((s) => s.id === selectedStudent)
    if (!studentToAdd) return

    startTransition(async () => {
      // Optimistic update
      addOptimisticParticipant({
        type: "add",
        participant: {
          id: `temp-${Date.now()}`, // Temporary ID
          studentId: studentToAdd.id,
          studentName: studentToAdd.name,
          status: "registered",
        },
      })

      const result = await addEventParticipant(event.id, selectedStudent)
      if (result.success) {
        toast.success(result.message)
        setSelectedStudent("")
        await onEventUpdated()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRemoveParticipant = (participantId: string) => {
    startTransition(async () => {
      // Optimistic update
      addOptimisticParticipant({ type: "remove", id: participantId })

      const result = await removeEventParticipant(participantId)
      if (result.success) {
        toast.success(result.message)
        setSelectedStudent("")
        await onEventUpdated()
      } else {
        toast.error(result.error)
      }
    })
  }

  const enrolledStudentIds = new Set(optimisticParticipants.map((p) => p.studentId).filter(Boolean))
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
            <h4 className="text-sm font-medium mb-3">Current Participants ({optimisticParticipants.length})</h4>
            <div className="space-y-2">
              {optimisticParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              ) : (
                optimisticParticipants.map((participant) => (
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
