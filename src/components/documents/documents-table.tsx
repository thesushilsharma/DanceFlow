"use client"

import React, { useOptimistic, useTransition, useMemo } from "react"
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
import { MoreHorizontal, Download, Eye, Trash, ArrowUpDown, FileText } from "lucide-react"
import { deleteDocument } from "@/app/actions/documents"
import { formatDate } from "@/lib/date"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

interface Document {
  id: string
  title: string
  documentType: "contract" | "waiver" | "medical" | "certificate" | "other"
  fileName: string
  fileUrl: string
  fileSize: number | null
  uploadedBy: string | null
  uploadedAt: Date
  studentId: string | null
  studentFirstName?: string | null
  studentLastName?: string | null
  studentEmail?: string | null
}

const typeColors = {
  Contract: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Waiver: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  Policy: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Form: "bg-green-500/10 text-green-700 dark:text-green-400",
  Certificate: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  Other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "N/A"
  return `${(bytes / 1024).toFixed(0)} KB`
}

const getTypeLabel = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function DocumentsTable({ initialDocuments }: { initialDocuments: Document[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDocuments, setOptimisticDocuments] = useOptimistic(initialDocuments)

  const handleDelete = (docId: string) => {
    startTransition(async () => {
      setOptimisticDocuments((docs) => docs.filter((d) => d.id !== docId))
      await deleteDocument(docId)
    })
  }

  const columns = useMemo<ColumnDef<Document>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 text-left font-medium"
            >
              Document
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={typeColors[getTypeLabel(row.original.documentType) as keyof typeof typeColors] || typeColors.Other}
          >
            {getTypeLabel(row.original.documentType)}
          </Badge>
        ),
      },
      {
        id: "relatedTo",
        accessorFn: (row) => row.studentFirstName && row.studentLastName ? `${row.studentFirstName} ${row.studentLastName}` : (row.studentId || "General"),
        header: "Related To",
        cell: ({ row }) => {
          const doc = row.original
          if (doc.studentFirstName && doc.studentLastName) {
            return (
              <div className="flex flex-col">
                <span className="font-medium">{doc.studentFirstName} {doc.studentLastName}</span>
                {doc.studentEmail && <span className="text-xs text-muted-foreground">{doc.studentEmail}</span>}
              </div>
            )
          }
          return <span className="text-muted-foreground">{doc.studentId || "General"}</span>
        },
      },
      {
        accessorKey: "uploadedBy",
        header: "Uploaded By",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.uploadedBy || "Unknown"}</span>,
      },
      {
        accessorKey: "uploadedAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4"
            >
              Upload Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (row.original.uploadedAt ? formatDate(row.original.uploadedAt, "SHORT") : "-"),
      },
      {
        accessorKey: "fileSize",
        header: "Size",
        cell: ({ row }) => <span className="text-muted-foreground">{formatFileSize(row.original.fileSize)}</span>,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const doc = row.original
          return (
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
          )
        },
      },
    ],
    [isPending, setOptimisticDocuments] // Ensure we handle optimistic update properly
  )

  return (
    <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
      <DataTable columns={columns} data={optimisticDocuments} searchKey="title" />
    </div>
  )
}
