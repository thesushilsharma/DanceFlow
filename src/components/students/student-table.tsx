"use client"

import { useMemo, useTransition, useState } from "react"
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
import { MoreHorizontal, Eye, Edit, Trash, ArrowUpDown } from "lucide-react"
import { deleteStudent } from "@/app/actions/students"
import { toast } from "sonner"
import { formatDate } from "@/lib/date"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ViewStudentDialog } from "@/components/students/view-student-dialog"
import { EditStudentDialog } from "@/components/students/edit-student-dialog"

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

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  "on-hold": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  graduated: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

const calculateAge = (dob: string) => {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function StudentTable({ students }: { students: Student[] }) {
  const [isPending, startTransition] = useTransition()
  const [viewStudent, setViewStudent] = useState<Student | null>(null)
  const [editStudent, setEditStudent] = useState<Student | null>(null)

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    startTransition(async () => {
      const result = await deleteStudent(id)
      if (result.success) {
        toast.success("Student deleted successfully")
      } else {
        toast.error(result.error)
      }
    })
  }

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 text-left font-medium"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
      },
      {
        id: "age",
        header: "Age",
        cell: ({ row }) => calculateAge(row.original.dateOfBirth),
      },
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => row.original.level || "N/A",
      },
      {
        accessorKey: "enrollmentDate",
        header: "Enrollment Date",
        cell: ({ row }) => (row.original.enrollmentDate ? formatDate(row.original.enrollmentDate, "SHORT") : "-"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="secondary" className={statusColors[row.original.status as keyof typeof statusColors]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.phone || "N/A"}</div>
            <div className="text-muted-foreground">{row.original.email || "N/A"}</div>
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const student = row.original
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
                <DropdownMenuItem onClick={() => setViewStudent(student)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditStudent(student)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student.id)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [isPending]
  )

  return (
    <>
      <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
        <DataTable columns={columns} data={students} searchKey="name" />
      </div>
      <ViewStudentDialog
        student={viewStudent}
        open={!!viewStudent}
        onOpenChange={(open) => !open && setViewStudent(null)}
      />
      <EditStudentDialog
        student={editStudent}
        open={!!editStudent}
        onOpenChange={(open) => !open && setEditStudent(null)}
      />
    </>
  )
}
