"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  getClassEnrollments,
  addEnrollment,
  removeEnrollment,
  updateEnrollmentStatus,
} from "@/app/actions/classes"
import { getStudents } from "@/app/actions/students"
import { Trash2, UserPlus, Loader2, ArrowUpDown } from "lucide-react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table"

type Enrollment = {
  id: string
  studentId: string
  studentFirstName: string
  studentLastName: string
  studentEmail: string | null
  studentLevel: string | null
  enrollmentDate: string
  status: string
  paymentStatus: string
}

type Student = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  level: string | null
  status: string
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  dropped: "bg-red-500/10 text-red-700 dark:text-red-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

const paymentStatusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  partial: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function ManageEnrollmentsDialog({
  open,
  onOpenChange,
  classId,
  className,
  capacity,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  className: string
  capacity: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // TanStack Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, classId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [enrollmentsData, studentsData] = await Promise.all([
        getClassEnrollments(classId),
        getStudents(),
      ])
      setEnrollments(enrollmentsData as Enrollment[])
      const enrolledStudentIds = new Set(enrollmentsData.map((e) => e.studentId))
      const availableStudents = studentsData.filter(
        (s) => !enrolledStudentIds.has(s.id) && s.status === "active"
      )
      setStudents(availableStudents as Student[])
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load enrollment data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEnrollment = () => {
    if (!selectedStudent) {
      toast.error("Please select a student")
      return
    }
    startTransition(async () => {
      const result = await addEnrollment(classId, selectedStudent)
      if (result.success) {
        toast.success("Student enrolled successfully")
        setSelectedStudent("")
        await loadData()
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRemoveEnrollment = (enrollmentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this class?`)) return
    startTransition(async () => {
      const result = await removeEnrollment(enrollmentId)
      if (result.success) {
        toast.success("Student removed successfully")
        await loadData()
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleStatusChange = (enrollmentId: string, newStatus: string, currentPaymentStatus: string) => {
    startTransition(async () => {
      const result = await updateEnrollmentStatus(enrollmentId, newStatus, currentPaymentStatus)
      if (result.success) {
        toast.success("Status updated successfully")
        await loadData()
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handlePaymentStatusChange = (enrollmentId: string, currentStatus: string, newPaymentStatus: string) => {
    startTransition(async () => {
      const result = await updateEnrollmentStatus(enrollmentId, currentStatus, newPaymentStatus)
      if (result.success) {
        toast.success("Payment status updated successfully")
        await loadData()
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // TanStack column definitions — 5 compact columns, no horizontal scroll
  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        // Student name + email stacked
        id: "student",
        accessorFn: (row) => `${row.studentFirstName} ${row.studentLastName} ${row.studentEmail ?? ""}`,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium leading-snug">
              {row.original.studentFirstName} {row.original.studentLastName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {row.original.studentEmail || "—"}
            </div>
          </div>
        ),
      },
      {
        // Level + enrolled date stacked
        id: "info",
        accessorFn: (row) => `${row.studentLevel ?? ""} ${row.enrollmentDate}`,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Info
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            {row.original.studentLevel ? (
              <Badge variant="outline" className="capitalize text-xs">
                {row.original.studentLevel}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No level</span>
            )}
            <div className="text-xs text-muted-foreground">{row.original.enrollmentDate}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(value) =>
              handleStatusChange(row.original.id, value, row.original.paymentStatus)
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
              <Badge
                variant="secondary"
                className={statusColors[row.original.status as keyof typeof statusColors]}
              >
                {row.original.status}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => (
          <Select
            value={row.original.paymentStatus}
            onValueChange={(value) =>
              handlePaymentStatusChange(row.original.id, row.original.status, value)
            }
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
              <Badge
                variant="secondary"
                className={
                  paymentStatusColors[row.original.paymentStatus as keyof typeof paymentStatusColors]
                }
              >
                {row.original.paymentStatus}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() =>
                handleRemoveEnrollment(
                  row.original.id,
                  `${row.original.studentFirstName} ${row.original.studentLastName}`
                )
              }
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [isPending]
  )

  const table = useReactTable({
    data: enrollments,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const enrollmentCount = enrollments.length
  const atCapacity = enrollmentCount >= capacity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col p-0">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Manage Enrollments — {className}</DialogTitle>
            <DialogDescription>
              <span
                className={
                  atCapacity ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""
                }
              >
                {enrollmentCount} / {capacity} students enrolled
              </span>
              {atCapacity && " · Class is at full capacity"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body: scrollable */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Add Student Section */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">Add Student to Class</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <Label htmlFor="student-search" className="text-xs text-muted-foreground">
                  Search
                </Label>
                <Input
                  id="student-search"
                  placeholder="Name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isPending}
                  className="h-9"
                />
              </div>
              <div className="min-w-[220px] flex-1 space-y-1.5">
                <Label htmlFor="student-select" className="text-xs text-muted-foreground">
                  Select Student
                </Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  disabled={isPending || atCapacity}
                >
                  <SelectTrigger id="student-select" className="h-9">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No available students</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                          {student.level && ` (${student.level})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddEnrollment}
                disabled={isPending || !selectedStudent || atCapacity}
                className="h-9 shrink-0 gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Enroll
              </Button>
            </div>
          </div>

          {/* Enrollments Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Table filter + count */}
              <div className="flex items-center justify-between gap-3">
                <Input
                  placeholder="Filter enrolled students…"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="h-8 max-w-xs text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} of {enrollments.length} students
                </span>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="group">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                          No students enrolled yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
