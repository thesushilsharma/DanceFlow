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
import { FileText, ExternalLink } from "lucide-react"
import { getStudentDocuments } from "@/app/actions/documents"

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

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  "on-hold": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  graduated: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

interface ViewStudentDialogProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewStudentDialog({ student, open, onOpenChange }: ViewStudentDialogProps) {
  const [docs, setDocs] = useState<StudentDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    if (!open || !student) {
      setDocs([])
      return
    }
    setLoadingDocs(true)
    getStudentDocuments(student.id).then((result) => {
      setDocs(result as StudentDocument[])
      setLoadingDocs(false)
    })
  }, [open, student])

  if (!student) return null

  const age = (() => {
    const birthDate = new Date(student.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {student.firstName} {student.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant="secondary"
              className={statusColors[student.status as keyof typeof statusColors]}
            >
              {student.status}
            </Badge>
          </div>
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
            <span className="text-muted-foreground">Enrollment Date</span>
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

          <Separator />

          <div className="space-y-2">
            <p className="text-muted-foreground font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Documents
            </p>
            {loadingDocs ? (
              <p className="text-muted-foreground text-xs">Loading documents…</p>
            ) : docs.length === 0 ? (
              <p className="text-muted-foreground text-xs">No documents found.</p>
            ) : (
              <ul className="space-y-1.5">
                {docs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{doc.title}</span>
                      <Badge variant="outline" className="shrink-0 text-xs px-1 py-0">
                        {doc.documentType}
                      </Badge>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
