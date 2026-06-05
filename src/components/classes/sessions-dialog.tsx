"use client"

import { useState, useEffect, useActionState, useTransition, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Music2, Calendar, Users, Plus, Trash2, Edit, RefreshCw,
  ChevronDown, ChevronUp, Loader2, Check,
} from "lucide-react"
import {
  getClassSessions,
  createSession,
  updateSession,
  deleteSession,
  renewSessionEnrollments,
  type ClassSession,
} from "@/app/actions/sessions"
import { SessionEnrollmentsDialog } from "./session-enrollments-dialog"

// ─── Status colours ───────────────────────────────────────────────────────────
const sessionStatusColors: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

// ─── Empty form state ─────────────────────────────────────────────────────────
function emptyForm() {
  return {
    name: "",
    songTitle: "",
    artist: "",
    choreographyNotes: "",
    startDate: "",
    endDate: "",
    tuitionFee: "",
    maxCapacity: "",
    status: "upcoming",
    notes: "",
  }
}

// ─── Inline session form ──────────────────────────────────────────────────────
function SessionForm({
  classId,
  session,
  onSuccess,
  onCancel,
}: {
  classId: string
  session?: ClassSession
  onSuccess: () => void
  onCancel: () => void
}) {
  const isEdit = !!session
  const boundAction = isEdit
    ? updateSession.bind(null, session.id)
    : createSession.bind(null, classId)

  const [state, action, isPending] = useActionState(boundAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Session updated" : "Session created")
      onSuccess()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, isEdit, onSuccess])

  const defaultValues = session
    ? {
        name: session.name,
        songTitle: session.songTitle ?? "",
        artist: session.artist ?? "",
        choreographyNotes: session.choreographyNotes ?? "",
        startDate: session.startDate,
        endDate: session.endDate ?? "",
        tuitionFee: session.tuitionFee ?? "",
        maxCapacity: session.maxCapacity?.toString() ?? "",
        status: session.status,
        notes: session.notes ?? "",
      }
    : emptyForm()

  return (
    <form action={action} className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <h4 className="font-semibold text-sm">{isEdit ? "Edit Session" : "New Session"}</h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="s-name" className="text-xs">Session Name *</Label>
          <Input id="s-name" name="name" defaultValue={defaultValues.name}
            placeholder="e.g. Blinding Lights Batch" required disabled={isPending} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-song" className="text-xs">Song Title</Label>
          <Input id="s-song" name="songTitle" defaultValue={defaultValues.songTitle}
            placeholder="e.g. Blinding Lights" disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-artist" className="text-xs">Artist</Label>
          <Input id="s-artist" name="artist" defaultValue={defaultValues.artist}
            placeholder="e.g. The Weeknd" disabled={isPending} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-start" className="text-xs">Start Date *</Label>
          <Input id="s-start" name="startDate" type="date" defaultValue={defaultValues.startDate}
            required disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-end" className="text-xs">End Date</Label>
          <Input id="s-end" name="endDate" type="date" defaultValue={defaultValues.endDate}
            disabled={isPending} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-fee" className="text-xs">Tuition Fee Override</Label>
          <Input id="s-fee" name="tuitionFee" type="number" step="0.01"
            defaultValue={defaultValues.tuitionFee}
            placeholder="Leave blank to use class default" disabled={isPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-cap" className="text-xs">Capacity Override</Label>
          <Input id="s-cap" name="maxCapacity" type="number"
            defaultValue={defaultValues.maxCapacity}
            placeholder="Leave blank to use class default" disabled={isPending} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select name="status" defaultValue={defaultValues.status} disabled={isPending}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="s-choreo" className="text-xs">Choreography Notes</Label>
          <Textarea id="s-choreo" name="choreographyNotes"
            defaultValue={defaultValues.choreographyNotes}
            placeholder="Style, mood, key moves…" rows={2} disabled={isPending} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="s-notes" className="text-xs">Internal Notes</Label>
          <Textarea id="s-notes" name="notes" defaultValue={defaultValues.notes}
            placeholder="Any admin notes…" rows={2} disabled={isPending} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
          {isEdit ? "Save Changes" : "Create Session"}
        </Button>
      </div>
    </form>
  )
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export function SessionsDialog({
  open,
  onOpenChange,
  classId,
  className: classLabel,
  classCapacity,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  className: string
  classCapacity: number
}) {
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Enrollments sub-dialog
  const [enrollSession, setEnrollSession] = useState<ClassSession | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setSessions(await getClassSessions(classId))
    setIsLoading(false)
  }, [classId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const handleDelete = useCallback((session: ClassSession) => {
    if (session.enrollmentCount > 0) {
      toast.error(`Cannot delete — ${session.enrollmentCount} student(s) enrolled`)
      return
    }
    if (!confirm(`Delete session "${session.name}"?`)) return
    startTransition(async () => {
      const r = await deleteSession(session.id)
      r.success ? toast.success("Session deleted") : toast.error(r.error)
      load()
    })
  }, [load])

  const handleRenew = useCallback((session: ClassSession) => {
    const pivot = session.endDate ?? session.startDate
    const others = sessions.filter(
      (s) => s.id !== session.id && (s.status === "upcoming" || s.status === "active")
    )
    if (!others.length) {
      toast.info("Create a new upcoming session first, then renew into it")
      return
    }
    const sorted = [...others].sort((a, b) => a.startDate.localeCompare(b.startDate))
    const target = sorted.find((s) => s.startDate > pivot)
    if (!target) {
      toast.info(
        "No upcoming or active session starts after this batch. Add one with a later start date (or set this batch’s end date)."
      )
      return
    }
    if (
      !confirm(
        `Re-enrol all active students from "${session.name}" into "${target.name}"?\nStudents already in "${target.name}" will be skipped.`
      )
    )
      return
    startTransition(async () => {
      const r = await renewSessionEnrollments(session.id, target.id, classId)
      if (r.success) {
        toast.success(`${(r as { count: number }).count} student(s) renewed into "${target.name}"`)
        load()
      } else {
        toast.error(r.error)
      }
    })
  }, [sessions, classId, load])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col p-0">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-xl">Sessions — {classLabel}</DialogTitle>
              <DialogDescription>
                Each session is a time-boxed batch with its own song / choreography. Students enrol per session and can renew for the next one.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            {/* New session button */}
            {!showNewForm && (
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => { setShowNewForm(true); setEditingId(null) }}
              >
                <Plus className="h-4 w-4" /> New Session
              </Button>
            )}

            {showNewForm && (
              <SessionForm
                classId={classId}
                onSuccess={() => { setShowNewForm(false); load() }}
                onCancel={() => setShowNewForm(false)}
              />
            )}

            {/* Sessions list */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                No sessions yet — create the first one above.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="rounded-lg border bg-card">
                    {/* Session header row */}
                    <div className="flex items-center gap-3 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                        <Music2 className="h-4 w-4 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{s.name}</span>
                          {s.songTitle && (
                            <span className="text-xs text-muted-foreground truncate">
                              ♪ {s.songTitle}{s.artist ? ` — ${s.artist}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {s.startDate}{s.endDate ? ` → ${s.endDate}` : " → ongoing"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {s.enrollmentCount} / {s.maxCapacity ?? classCapacity}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`capitalize shrink-0 ${sessionStatusColors[s.status]}`}
                      >
                        {s.status}
                      </Badge>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="Manage enrollments"
                          onClick={() => setEnrollSession(s)}
                          disabled={isPending}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="Renew students into next session"
                          onClick={() => handleRenew(s)}
                          disabled={isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="Edit session"
                          onClick={() => {
                            setEditingId(editingId === s.id ? null : s.id)
                            setShowNewForm(false)
                          }}
                          disabled={isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete session"
                          onClick={() => handleDelete(s)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        >
                          {expandedId === s.id
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded details / edit form */}
                    {(expandedId === s.id || editingId === s.id) && (
                      <>
                        <Separator />
                        {editingId === s.id ? (
                          <div className="p-4">
                            <SessionForm
                              classId={classId}
                              session={s}
                              onSuccess={() => { setEditingId(null); load() }}
                              onCancel={() => setEditingId(null)}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
                            {s.choreographyNotes && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground text-xs">Choreography notes</span>
                                <p className="mt-0.5">{s.choreographyNotes}</p>
                              </div>
                            )}
                            {s.tuitionFee && (
                              <div>
                                <span className="text-muted-foreground text-xs">Fee (this session)</span>
                                <p className="mt-0.5 font-medium">₹{s.tuitionFee}</p>
                              </div>
                            )}
                            {s.notes && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground text-xs">Notes</span>
                                <p className="mt-0.5 text-muted-foreground">{s.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Enrollments sub-dialog */}
      {enrollSession && (
        <SessionEnrollmentsDialog
          open={!!enrollSession}
          onOpenChange={(v) => { if (!v) setEnrollSession(null) }}
          session={enrollSession}
          classId={classId}
          classCapacity={classCapacity}
          onEnrolled={load}
        />
      )}
    </>
  )
}
