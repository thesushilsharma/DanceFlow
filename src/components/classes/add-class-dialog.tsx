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

  // Wrapper form action that handles optimistic updates and validation
  // Following React 19 pattern: validation happens in the action, not onSubmit
  const handleFormAction = async (formData: FormData) => {
    // Client-side validation for Select fields (they don't work with native HTML5 validation)
    // Return early if validation fails - this prevents the server action from being called
    if (!type) {
      toast.error("Please select a class type")
      return
    }
    if (!dayOfWeek) {
      toast.error("Please select a day of week")
      return
    }

    // Optimistic update - show immediate feedback
    // Only set optimistic state if validation passes
    startTransition(() => {
      setOptimisticState({ isSubmitting: true, message: "Creating class..." })
    })

    // Call the server action (it will handle additional server-side validation)
    await formAction(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>Create a new class and set its schedule.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleFormAction}>
          {/* Hidden inputs for Select values (they don't work with native form submission) */}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="level" value={level} />
          <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
          <input type="hidden" name="instructorId" value={instructorId} />
          <input type="hidden" name="status" value={status} />
          
          <FieldGroup className="py-4">
            <FieldSet>
              <FieldLegend>Class Information</FieldLegend>
              <FieldDescription>Enter the basic details for your new class.</FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Class Name</FieldLabel>
                  <Input 
                    id="name" 
                    name="name" 
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
                    <Select value={type} onValueChange={setType} required disabled={isPending || optimisticState.isSubmitting}>
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
                    {!type && state?.error && <FieldError>Class type is required</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="level">Level</FieldLabel>
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
                    <FieldDescription>Optional: Specify the skill level for this class</FieldDescription>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Class description..." 
                    rows={3} 
                    disabled={isPending || optimisticState.isSubmitting}
                  />
                  <FieldDescription>Provide additional details about the class</FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Schedule</FieldLegend>
              <FieldDescription>Set the day, time, and location for the class.</FieldDescription>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="dayOfWeek">Day of Week</FieldLabel>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek} required disabled={isPending || optimisticState.isSubmitting}>
                      <SelectTrigger id="dayOfWeek" aria-invalid={!dayOfWeek && state?.error ? true : undefined}>
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
                    {!dayOfWeek && state?.error && <FieldError>Day of week is required</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="room">Room</FieldLabel>
                    <Input 
                      id="room" 
                      name="room" 
                      placeholder="Studio A" 
                      disabled={isPending || optimisticState.isSubmitting}
                    />
                    <FieldDescription>Optional: Specify the room or studio</FieldDescription>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
                    <Input 
                      id="startTime" 
                      name="startTime" 
                      type="time" 
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
                    <FieldDescription>Optional: Assign an instructor to this class</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="capacity">Max Capacity</FieldLabel>
                    <Input 
                      id="capacity" 
                      name="capacity" 
                      type="number" 
                      placeholder="15" 
                      required 
                      disabled={isPending || optimisticState.isSubmitting}
                      aria-invalid={state?.error ? true : undefined}
                    />
                    <FieldDescription>Maximum number of students</FieldDescription>
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
                      placeholder="120.00" 
                      disabled={isPending || optimisticState.isSubmitting}
                    />
                    <FieldDescription>Optional: Monthly tuition fee in dollars</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
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
                    <FieldDescription>Current status of the class</FieldDescription>
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
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
