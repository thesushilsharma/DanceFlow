"use client"

import { uploadDocument } from "@/app/actions/documents"
import { getStudents } from "@/app/actions/students"
import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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

const initialState = {
  success: false,
  message: "",
}

export function UploadDocumentDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(uploadDocument, initialState)
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([])

  useEffect(() => {
    getStudents().then((data) => setStudents(data))
  }, [])

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      toast.success("Document uploaded successfully")
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a new document to the system.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input id="title" name="name" placeholder="Student Registration Form" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="docType">Document Type</Label>
              <Select name="type" required>
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="waiver">Waiver</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedTo">Related To</Label>
              <Select name="studentId">
                <SelectTrigger id="relatedTo">
                  <SelectValue placeholder="Select related entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      Student: {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="notes" placeholder="Optional description..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
