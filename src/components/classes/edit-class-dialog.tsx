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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateClass } from "@/app/actions/classes"
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

type ClassData = {
  id: string
  name: string
  type: string
  level: string | null
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string | null
  capacity: number
  tuition: string | null
  status: string
  description?: string | null
  instructorId?: string | null
}

export function EditClassDialog({
  open,
  onOpenChange,
  classData,
  staff,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData: ClassData
  staff: Array<{ id: string; firstName: string; lastName: string }>
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  // State for Select components
  const [type, setType] = useState<string>(classData.type)
  const [level, setLevel] = useState<string>(classData.level || "")
  const [dayOfWeek, setDayOfWeek] = useState<string>(classData.dayOfWeek)
  const [instructorId, setInstructorId] = useState<string>(classData.instructorId || "")
  const [status, setStatus] = useState<string>(classData.status)

  // useActionState for form state management
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState: FormState, formData: FormData) => {
      return await updateClass(classData.id, prevState, formData)
    },
    null
  )

  // useOptimistic for immediate UI feedback
  const [optimisticState, setOptimisticState] = useOptimistic<OptimisticState, OptimisticState>(
    { isSubmitting: false },
    (_currentState, optimisticValue) => optimisticValue
  )

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setType(classData.type)
      setLevel(classData.level || "")
      setDayOfWeek(classData.dayOfWeek)
      setInstructorId(classData.instructorId || "")
      setStatus(classData.status)
      if (formRef.current) {
        formRef.current.reset()
      }
    }
  }, [open, classData])

  // Handle success/error states
  useEffect(() => {
    if (state?.success && open) {
      toast.success("Class updated successfully")
      onOpenChange(false)
      router.refresh()
      startTransition(() => {
        setOptimisticState({ isSubmitting: false })
      })
    } else if (state?.error && open) {
      toast.error(state.error)
      startTransition(() => {
        setOptimisticState({ isSubmitting: false })
      })
    }
  }, [state, open, router, onOpenChange, setOptimisticState])

  const handleFormAction = async (formData: FormData) => {
    // Client-side validation
    if (!type) {
      toast.error("Please select a class type")
      return
    }
    if (!dayOfWeek) {
      toast.error("Please select a day of week")
      return
    }

    startTransition(() => {
      setOptimisticState({ isSubmitting: true, message: "Updating class..." })
    })

    await formAction(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>Update the class details and schedule.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormAction}>
          {/* Hidden inputs for Select values */}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="level" value={level} />
          <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
          <input type="hidden" name="instructorId" value={instructorId} />
          <input type="hidden" name="status" value={status} />

          <FieldGroup className="py-4">
            <FieldSet>
              <FieldLegend>Class Information</FieldLegend>
              <FieldDescription>Update the basic details for this class.</FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Class Name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={classData.name}
                    placeholder="Ballet Fundamentals"
                    required
                    disabled={isPending || optimisticState.isSubmitting}
                    aria-invalid={state?.error ? true : undefined}
                  />
                  {state?.error && <FieldError>{state.error}</FieldError>}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="type">Class Type</FieldLabel>
                    <Select
                      value={type}
                      onValueChange={setType}
                      required
                      disabled={isPending || optimisticState.isSubmitting}
                    >
                      <SelectTrigger id="type" aria-invalid={!type && state?.error ? true : undefined}>
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
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="level">Level</FieldLabel>
                    <Select
                      value={level}
                      onValueChange={setLevel}
                      disabled={isPending || optimisticState.isSubmitting}
                    >
                      <SelectTrigger id="level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={classData.description || ""}
                    placeholder="Class description..."
                    rows={3}
                    disabled={isPending || optimisticState.isSubmitting}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Schedule</FieldLegend>
              <FieldDescription>Update the day, time, and location for the class.</FieldDescription>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="dayOfWeek">Day of Week</FieldLabel>
                    <Select
                      value={dayOfWeek}
                      onValueChange={setDayOfWeek}
                      required
                      disabled={isPending || optimisticState.isSubmitting}
                    >
                      <SelectTrigger
                        id="dayOfWeek"
                        aria-invalid={!dayOfWeek && state?.error ? true : undefined}
                      >
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
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="room">Room</FieldLabel>
                    <Input
                      id="room"
                      name="room"
                      defaultValue={classData.room || ""}
                      placeholder="Studio A"
                      disabled={isPending || optimisticState.isSubmitting}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      defaultValue={classData.startTime}
                      required
                      disabled={isPending || optimisticState.isSubmitting}
                      aria-invalid={state?.error ? true : undefined}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="endTime">End Time</FieldLabel>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      defaultValue={classData.endTime}
                      required
                      disabled={isPending || optimisticState.isSubmitting}
                      aria-invalid={state?.error ? true : undefined}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Enrollment & Pricing</FieldLegend>
              <FieldDescription>Configure capacity, instructor, and pricing details.</FieldDescription>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="instructorId">Instructor</FieldLabel>
                    <Select
                      value={instructorId}
                      onValueChange={setInstructorId}
                      disabled={isPending || optimisticState.isSubmitting}
                    >
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
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="capacity">Max Capacity</FieldLabel>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      defaultValue={classData.capacity}
                      placeholder="15"
                      required
                      disabled={isPending || optimisticState.isSubmitting}
                      aria-invalid={state?.error ? true : undefined}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="tuition">Tuition Fee</FieldLabel>
                    <Input
                      id="tuition"
                      name="tuition"
                      type="number"
                      step="0.01"
                      defaultValue={classData.tuition || ""}
                      placeholder="120.00"
                      disabled={isPending || optimisticState.isSubmitting}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                      disabled={isPending || optimisticState.isSubmitting}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || optimisticState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || optimisticState.isSubmitting}>
              {isPending || optimisticState.isSubmitting ? "Updating..." : "Update Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
