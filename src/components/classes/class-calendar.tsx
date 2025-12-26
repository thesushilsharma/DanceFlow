"use client"

import { Card, CardContent } from "@/components/ui/card"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

interface ClassCalendarProps {
  classes: Array<{
    id: string
    name: string
    type: string
    dayOfWeek: string
    startTime: string
    room: string | null
    instructorFirstName: string | null
    instructorLastName: string | null
  }>
}

const typeColors: Record<string, string> = {
  Ballet: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "Hip Hop": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Contemporary: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Jazz: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
}

export function ClassCalendar({ classes }: ClassCalendarProps) {
  const classSchedule = classes.reduce(
    (acc, classItem) => {
      const day = classItem.dayOfWeek.charAt(0).toUpperCase() + classItem.dayOfWeek.slice(1)
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push({
        time: classItem.startTime,
        name: classItem.name,
        type: classItem.type,
        room: classItem.room || "TBA",
        instructor: classItem.instructorFirstName
          ? `${classItem.instructorFirstName} ${classItem.instructorLastName || ""}`
          : "TBA",
      })
      return acc
    },
    {} as Record<string, Array<{ time: string; name: string; type: string; room: string; instructor: string }>>,
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {daysOfWeek.map((day) => (
        <Card key={day}>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">{day}</h3>
            <div className="space-y-3">
              {classSchedule[day]?.length > 0 ? (
                classSchedule[day].map((classItem, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${typeColors[classItem.type] || "bg-muted"}`}>
                    <div className="font-medium text-sm">{classItem.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{classItem.time}</div>
                    <div className="text-xs text-muted-foreground">{classItem.room}</div>
                    <div className="text-xs text-muted-foreground mt-1">{classItem.instructor}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">No classes scheduled</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
