"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download, Eye, Trash } from "lucide-react"
import { FileText } from "lucide-react"
import { deleteDocument } from "@/app/actions/documents"
import { useOptimistic, useTransition } from "react"

interface Document {
  id: string
  name: string
  type: "contract" | "waiver" | "medical" | "certificate" | "other"
  fileUrl: string
  fileSize: number | null
  uploadedBy: string | null
  uploadedAt: Date
  studentId: string | null
}

const typeColors = {
  Contract: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Waiver: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  Policy: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Form: "bg-green-500/10 text-green-700 dark:text-green-400",
  Certificate: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  Other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

export function DocumentsTable({ initialDocuments }: { initialDocuments: Document[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDocuments, setOptimisticDocuments] = useOptimistic(initialDocuments)

  const handleDelete = (docId: string) => {
    startTransition(async () => {
      setOptimisticDocuments(optimisticDocuments.filter((d) => d.id !== docId))
      await deleteDocument(docId)
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A"
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Related To</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticDocuments.map((doc) => (
            <TableRow key={doc.id} className={isPending ? "opacity-50" : ""}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{doc.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={typeColors[getTypeLabel(doc.type) as keyof typeof typeColors]}>
                  {getTypeLabel(doc.type)}
                </Badge>
              </TableCell>
              <TableCell>{doc.studentId || "General"}</TableCell>
              <TableCell>{doc.uploadedBy || "Unknown"}</TableCell>
              <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-muted-foreground">{formatFileSize(doc.fileSize)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(doc.id)}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
