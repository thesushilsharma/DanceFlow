"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { getAttendanceForClass, updateAttendance, type AttendanceStatus } from "@/app/actions/attendance"

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

      setAttendanceData(attendanceData.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s)))
    })
  }

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((student) => {
                const currentStatus = statusOptions.find((s) => s.value === student.status)
                return (
                  <TableRow key={student.id} className={isPending ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={currentStatus?.color}>
                        {currentStatus?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
