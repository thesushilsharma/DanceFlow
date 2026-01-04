"use client"

import type React from "react"
import { useState, useEffect, useRef, useOptimistic, startTransition, useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClass } from "@/app/actions/classes"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type FormState = {
  success?: boolean
  error?: string
} | null

type OptimisticState = {
  isSubmitting: boolean
  message?: string
}

export function AddClassDialog({
  children,
  staff,
}: {
  children: React.ReactNode
  staff: Array<{ id: string; firstName: string; lastName: string }>
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  // State for Select components (they don't work with native form submission)
  const [type, setType] = useState<string>("")
  const [level, setLevel] = useState<string>("")
  const [dayOfWeek, setDayOfWeek] = useState<string>("")
  const [instructorId, setInstructorId] = useState<string>("")
  const [status, setStatus] = useState<string>("active")

  // useActionState for form state management
  const [state, formAction, isPending] = useActionState<FormState, FormData>(createClass, null)

  // useOptimistic for immediate UI feedback
  const [optimisticState, setOptimisticState] = useOptimistic<OptimisticState, OptimisticState>(
    { isSubmitting: false },
    (_currentState, optimisticValue) => optimisticValue
  )

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setType("")
      setLevel("")
      setDayOfWeek("")
      setInstructorId("")
      setStatus("active")
      if (formRef.current) {
        formRef.current.reset()
      }
    }
  }, [open])

  // Handle success/error states
  useEffect(() => {
    if (state?.success && open) {
      toast.success("Class created successfully")
      setOpen(false)
      router.refresh()
      // Reset optimistic state
      startTransition(() => {
        setOptimisticState({ isSubmitting: false })
      })
    } else if (state?.error && open) {
      toast.error(state.error)
      // Reset optimistic state on error
      startTransition(() => {
        setOptimisticState({ isSubmitting: false })
      })
    }
  }, [state, open, router, setOptimisticState])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validate required Select fields
    if (!type) {
      e.preventDefault()
      toast.error("Please select a class type")
      return
    }
    if (!dayOfWeek) {
      e.preventDefault()
      toast.error("Please select a day of week")
      return
    }

    // Optimistic update - show immediate feedback
    startTransition(() => {
      setOptimisticState({ isSubmitting: true, message: "Creating class..." })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>Create a new class and set its schedule.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} onSubmit={handleSubmit}>
          {/* Hidden inputs for Select values (they don't work with native form submission) */}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="level" value={level} />
          <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
          <input type="hidden" name="instructorId" value={instructorId} />
          <input type="hidden" name="status" value={status} />
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" name="name" placeholder="Ballet Fundamentals" required disabled={isPending || optimisticState.isSubmitting} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Class Type</Label>
                <Select value={type} onValueChange={setType} required disabled={isPending || optimisticState.isSubmitting}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ballet">Ballet</SelectItem>
                    <SelectItem value="hip-hop">Hip Hop</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="tap">Tap</SelectItem>
                    <SelectItem value="lyrical">Lyrical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={level} onValueChange={setLevel} disabled={isPending || optimisticState.isSubmitting}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Class description..." rows={3} disabled={isPending || optimisticState.isSubmitting} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek} required disabled={isPending || optimisticState.isSubmitting}>
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input id="room" name="room" placeholder="Studio A" disabled={isPending || optimisticState.isSubmitting} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" name="startTime" type="time" required disabled={isPending || optimisticState.isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" name="endTime" type="time" required disabled={isPending || optimisticState.isSubmitting} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructorId">Instructor</Label>
                <Select value={instructorId} onValueChange={setInstructorId} disabled={isPending || optimisticState.isSubmitting}>
                  <SelectTrigger id="instructorId">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input id="capacity" name="capacity" type="number" placeholder="15" required disabled={isPending || optimisticState.isSubmitting} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tuition">Tuition Fee</Label>
                <Input id="tuition" name="tuition" type="number" step="0.01" placeholder="120.00" disabled={isPending || optimisticState.isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={isPending || optimisticState.isSubmitting}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending || optimisticState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || optimisticState.isSubmitting}>
              {isPending || optimisticState.isSubmitting ? (
                <>
                  <span className="mr-2">Adding...</span>
                  {optimisticState.message && <span className="text-xs opacity-75">{optimisticState.message}</span>}
                </>
              ) : (
                "Add Class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
