"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { getAttendanceForClass, updateAttendance, type AttendanceStatus } from "@/app/actions/attendance"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { value: "absent", label: "Absent", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
  { value: "late", label: "Late", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  { value: "excused", label: "Excused", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
]

export function AttendanceTracker({ classes }: { classes: any[] }) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id?.toString() || "")
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (selectedClass) {
      startTransition(async () => {
        const formattedDate = format(date, "yyyy-MM-dd")
        const result = await getAttendanceForClass(selectedClass, formattedDate)
        if (result.success) {
          setAttendanceData(result.data || [])
        }
      })
    }
  }, [selectedClass, date])

  const handleStatusChange = (studentId: number, newStatus: AttendanceStatus, attendanceId?: number) => {
    startTransition(async () => {
      const formattedDate = format(date, "yyyy-MM-dd")
      await updateAttendance(selectedClass, studentId.toString(), formattedDate, newStatus, attendanceId?.toString())

      setAttendanceData((prevData) => 
        prevData.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      )
    })
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 text-left font-medium"
            >
              Student Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const currentStatus = statusOptions.find((s) => s.value === row.original.status)
          return (
            <Badge variant="secondary" className={currentStatus?.color}>
              {currentStatus?.label}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const student = row.original;
          return (
            <Select
              value={student.status as AttendanceStatus}
              onValueChange={(value: AttendanceStatus) => handleStatusChange(student.id, value, student.attendanceId)}
              disabled={isPending}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
      },
    ],
    [isPending, handleStatusChange] 
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name} - {cls.schedule}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={(day) => day && setDate(day)} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-none shadow-none">
            <DataTable columns={columns} data={attendanceData} searchKey="name" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
