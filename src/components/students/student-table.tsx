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
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react"
import { deleteStudent } from "@/app/actions/students"
import { useTransition } from "react"
import { toast } from "sonner"

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

export function StudentTable({ students }: { students: Student[] }) {
  const [isPending, startTransition] = useTransition()

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Enrollment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No students found. Add your first student to get started.
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{calculateAge(student.dateOfBirth)}</TableCell>
                <TableCell>{student.level || "N/A"}</TableCell>
                <TableCell>{student.enrollmentDate}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[student.status as keyof typeof statusColors]}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{student.phone || "N/A"}</div>
                    <div className="text-muted-foreground">{student.email || "N/A"}</div>
                  </div>
                </TableCell>
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
