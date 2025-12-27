"use client"

import type React from "react"
import { useState } from "react"
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

export function UploadDocumentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a new document to the system.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input id="title" placeholder="Student Registration Form" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select>
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
            <Select>
              <SelectTrigger id="relatedTo">
                <SelectValue placeholder="Select related entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" accept=".pdf,.doc,.docx" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Optional description..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
