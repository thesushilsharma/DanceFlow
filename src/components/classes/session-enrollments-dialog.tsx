"use client"

import { useState, useEffect, useTransition, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  getSessionEnrollments,
  addSessionEnrollment,
  type ClassSession,
} from "@/app/actions/sessions"
import {
  removeEnrollment,
  updateEnrollmentStatus,
} from "@/app/actions/classes"
import { getStudents } from "@/app/actions/students"
import {
  Trash2, UserPlus, Loader2, ArrowUpDown, Check, ChevronsUpDown, Music2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
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
  notes: string | null
}

type Student = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  level: string | null
  status: string
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  dropped: "bg-red-500/10 text-red-700 dark:text-red-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}
const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  partial: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function SessionEnrollmentsDialog({
  open,
  onOpenChange,
  session,
  classId,
  classCapacity,
  onEnrolled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ClassSession
  classId: string
  classCapacity: number
  onEnrolled?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [comboOpen, setComboOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [isLoading, setIsLoading] = useState(false)

  const maxCap = session.maxCapacity ?? classCapacity

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [enrolData, studentsData] = await Promise.all([
        getSessionEnrollments(session.id),
        getStudents(),
      ])
      setEnrollments(enrolData as Enrollment[])
      const enrolledIds = new Set(enrolData.map((e) => e.studentId))
      setStudents(
        (studentsData as Student[]).filter(
          (s) => !enrolledIds.has(s.id) && s.status === "active"
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [session.id])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  const handleEnroll = useCallback(() => {
    if (!selectedStudents.length) return toast.error("Select at least one student")
    startTransition(async () => {
      const r = await addSessionEnrollment(session.id, classId, selectedStudents)
      if (r.success) {
        toast.success("Students enrolled")
        setSelectedStudents([])
        await loadData()
        onEnrolled?.()
        router.refresh()
      } else {
        toast.error(r.error)
      }
    })
  }, [selectedStudents, session.id, classId, loadData, onEnrolled, router])

  const handleRemove = useCallback((enrollmentId: string, name: string) => {
    if (!confirm(`Remove ${name} from this session?`)) return
    startTransition(async () => {
      const r = await removeEnrollment(enrollmentId)
      if (r.success) {
        toast.success("Removed")
        await loadData()
        onEnrolled?.()
        router.refresh()
      } else {
        toast.error(r.error)
      }
    })
  }, [loadData, onEnrolled, router])

  const handleStatusChange = useCallback((id: string, status: string, paymentStatus: string) => {
    startTransition(async () => {
      const r = await updateEnrollmentStatus(id, status, paymentStatus)
      if (r.success) { toast.success("Updated"); await loadData() }
      else toast.error(r.error)
    })
  }, [loadData])

  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        id: "student",
        accessorFn: (r) => `${r.studentFirstName} ${r.studentLastName}`,
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Student <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row: r }) => (
          <div>
            <div className="font-medium text-sm">
              {r.original.studentFirstName} {r.original.studentLastName}
            </div>
            <div className="text-xs text-muted-foreground">{r.original.studentEmail || "—"}</div>
          </div>
        ),
      },
      {
        id: "info",
        header: "Level / Enrolled",
        cell: ({ row: r }) => (
          <div className="space-y-0.5">
            {r.original.studentLevel
              ? <Badge variant="outline" className="text-xs capitalize">{r.original.studentLevel}</Badge>
              : <span className="text-xs text-muted-foreground">—</span>}
            <div className="text-xs text-muted-foreground">{r.original.enrollmentDate}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row: r }) => (
          <Select value={r.original.status} disabled={isPending}
            onValueChange={(v) => handleStatusChange(r.original.id, v, r.original.paymentStatus)}>
            <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
              <Badge variant="secondary" className={statusColors[r.original.status]}>
                {r.original.status}
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
        cell: ({ row: r }) => (
          <Select value={r.original.paymentStatus} disabled={isPending}
            onValueChange={(v) => handleStatusChange(r.original.id, r.original.status, v)}>
            <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
              <Badge variant="secondary" className={paymentStatusColors[r.original.paymentStatus]}>
                {r.original.paymentStatus}
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
        cell: ({ row: r }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" disabled={isPending}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(r.original.id,
                `${r.original.studentFirstName} ${r.original.studentLastName}`)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [isPending, handleStatusChange, handleRemove]
  )

  const table = useReactTable({
    data: enrollments,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const atCapacity = enrollments.length >= maxCap

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col p-0">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl">{session.name}</DialogTitle>
            </div>
            <DialogDescription className="flex items-center gap-3 mt-1">
              {session.songTitle && (
                <span className="text-primary/80">♪ {session.songTitle}{session.artist ? ` — ${session.artist}` : ""}</span>
              )}
              <span className={atCapacity ? "text-yellow-600 font-medium" : ""}>
                {enrollments.length} / {maxCap} enrolled
              </span>
              {atCapacity && <span>· Full</span>}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Enroll section */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-3 text-sm font-semibold">Enroll Students</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[260px] flex-1 space-y-1.5">
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={comboOpen}
                      disabled={isPending || atCapacity}
                      className="h-9 w-full justify-between font-normal">
                      {selectedStudents.length > 0
                        ? `${selectedStudents.length} student(s) selected`
                        : "Select students…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search students…" className="h-9" />
                      <CommandList>
                        <CommandEmpty>No available student found.</CommandEmpty>
                        <CommandGroup>
                          {students.map((s) => {
                            const sel = selectedStudents.includes(s.id)
                            return (
                              <CommandItem key={s.id}
                                value={`${s.firstName} ${s.lastName} ${s.email ?? ""}`}
                                onSelect={() =>
                                  setSelectedStudents((cur) =>
                                    sel ? cur.filter((id) => id !== s.id) : [...cur, s.id]
                                  )}>
                                <Check className={cn("mr-2 h-4 w-4", sel ? "opacity-100" : "opacity-0")} />
                                {s.firstName} {s.lastName}
                                {s.level && <span className="ml-1 text-xs text-muted-foreground">({s.level})</span>}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleEnroll}
                disabled={isPending || !selectedStudents.length || atCapacity}
                className="h-9 shrink-0 gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Enrol
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Input placeholder="Filter enrolled students…" value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="h-8 max-w-xs text-sm" />
                <span className="text-xs text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} of {enrollments.length}
                </span>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
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
