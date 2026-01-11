"use client"

import { useState, useTransition, useOptimistic } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Check } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
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

  const handleAddParticipants = () => {
    if (selectedStudents.length === 0) return

    startTransition(async () => {
      const promises = selectedStudents.map(async (studentId) => {
        const studentToAdd = allStudents.find((s) => s.id === studentId)
        if (!studentToAdd) return

        // Optimistic update
        addOptimisticParticipant({
          type: "add",
          participant: {
            id: `temp-${Date.now()}-${studentId}`, // Unique temp ID
            studentId: studentToAdd.id,
            studentName: studentToAdd.name,
            status: "registered",
          },
        })

        return addEventParticipant(event.id, studentId)
      })

      const results = await Promise.all(promises)
      const allSuccess = results.every(r => r?.success)

      if (allSuccess) {
        toast.success(`Successfully added ${selectedStudents.length} participant(s)`)
        setSelectedStudents([])
        await onEventUpdated()
      } else {
        toast.error("Failed to add some participants")
        // Force refresh to sync state in case of partial failure
        await onEventUpdated()
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
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Search students..." />
                <CommandList>
                  <CommandEmpty>No student found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {availableStudents.map((student) => (
                      <CommandItem
                        key={student.id}
                        value={student.name}
                        onSelect={() => {
                          setSelectedStudents((prev) =>
                            prev.includes(student.id)
                              ? prev.filter((id) => id !== student.id)
                              : [...prev, student.id]
                          )
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`h-4 w-4 border rounded-sm flex items-center justify-center ${selectedStudents.includes(student.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-primary opacity-50"
                              }`}
                          >
                            {selectedStudents.includes(student.id) && <Check className="h-3 w-3" />}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {selectedStudents.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedStudents.length} student{selectedStudents.length > 1 ? "s" : ""} selected
                </div>
              )}
            </div>
            <Button type="button" onClick={handleAddParticipants} disabled={selectedStudents.length === 0 || isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add Selected
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Current Participants ({optimisticParticipants.length})</h4>
            <div className="space-y-2">
              {optimisticParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              ) : (
                optimisticParticipants.map((participant) => (
                  <div key={participant.studentId} className="flex items-center justify-between p-3 rounded-lg border">
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
