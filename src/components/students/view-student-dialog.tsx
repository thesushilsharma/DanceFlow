"use client"

import { useEffect, useState } from "react"
import { formatDate } from "@/lib/date"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ExternalLink, Music2, Calendar, Loader2 } from "lucide-react"
import { getStudentDocuments } from "@/app/actions/documents"
import { getStudentActiveSessions } from "@/app/actions/sessions"

type Student = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string | null
  phone: string | null
  level: string | null
  status: string
  enrollmentDate: string
}

type StudentDocument = {
  id: string
  title: string
  documentType: string
  fileName: string
  fileUrl: string
  uploadedAt: string
}

type SessionEnrollment = {
  enrollmentId: string
  classId: string
  className: string
  sessionId: string
  sessionName: string
  songTitle: string | null
  artist: string | null
  startDate: string
  endDate: string | null
  sessionStatus: string
  enrollmentStatus: string
  paymentStatus: string
  enrollmentDate: string
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  "on-hold": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  graduated: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

const sessionStatusColors: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  partial: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
}

interface ViewStudentDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewStudentDialog({ student, open, onOpenChange }: ViewStudentDialogProps) {
  const [docs, setDocs] = useState<StudentDocument[]>([])
  const [sessions, setSessions] = useState<SessionEnrollment[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)

  useEffect(() => {
    if (!open || !student) {
      setDocs([])
      setSessions([])
      return
    }

    setLoadingDocs(true)
    getStudentDocuments(student.id).then((result) => {
      setDocs(result as StudentDocument[])
      setLoadingDocs(false)
    })

    setLoadingSessions(true)
    getStudentActiveSessions(student.id).then((result) => {
      setSessions(
        result.map((r) => ({
          ...r,
          startDate: String(r.startDate),
          endDate: r.endDate ? String(r.endDate) : null,
          enrollmentDate: String(r.enrollmentDate),
        })) as SessionEnrollment[]
      )
      setLoadingSessions(false)
    })
  }, [open, student])

  if (!student) return null

  const age = (() => {
    const birthDate = new Date(student.dateOfBirth)
    const today = new Date()
    let a = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--
    return a
  })()

  const activeSessionCount = sessions.filter(
    (s) => s.enrollmentStatus === "active" && s.sessionStatus !== "completed" && s.sessionStatus !== "cancelled"
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {student.firstName} {student.lastName}
            <Badge variant="secondary"
              className={statusColors[student.status as keyof typeof statusColors]}>
              {student.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
            <TabsTrigger value="enrollments" className="flex-1">
              Classes
              {activeSessionCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {activeSessionCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
          </TabsList>

          {/* ── Info Tab ── */}
          <TabsContent value="info" className="mt-3 grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age</span>
              <span>{age} years old</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth</span>
              <span>{formatDate(student.dateOfBirth, "SHORT")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level</span>
              <span>{student.level || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Studio Enrolment Date</span>
              <span>{formatDate(student.enrollmentDate, "SHORT")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{student.email || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{student.phone || "N/A"}</span>
            </div>
          </TabsContent>

          {/* ── Enrollments / Sessions Tab ── */}
          <TabsContent value="enrollments" className="mt-3 space-y-3">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Not enrolled in any sessions yet.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""} across all classes
                </p>
                {sessions.map((s) => (
                  <div key={s.enrollmentId} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                          {s.className}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <Music2 className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium text-sm truncate">{s.sessionName}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="secondary" className={`text-xs ${sessionStatusColors[s.sessionStatus]}`}>
                          {s.sessionStatus}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${paymentStatusColors[s.paymentStatus]}`}>
                          {s.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    {s.songTitle && (
                      <p className="text-xs text-muted-foreground pl-6">
                        ♪ {s.songTitle}{s.artist ? ` — ${s.artist}` : ""}
                      </p>
                    )}

                    <div className="flex items-center gap-1 pl-6 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {s.startDate}{s.endDate ? ` → ${s.endDate}` : " → ongoing"}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          {/* ── Documents Tab ── */}
          <TabsContent value="documents" className="mt-3 space-y-2">
            {loadingDocs ? (
              <p className="text-muted-foreground text-xs py-4 text-center">Loading documents…</p>
            ) : docs.length === 0 ? (
              <p className="text-muted-foreground text-xs py-4 text-center">No documents found.</p>
            ) : (
              <ul className="space-y-1.5">
                {docs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">{doc.title}</span>
                      <Badge variant="outline" className="shrink-0 text-xs px-1 py-0">
                        {doc.documentType}
                      </Badge>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-primary hover:underline flex items-center gap-1 text-xs">
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
