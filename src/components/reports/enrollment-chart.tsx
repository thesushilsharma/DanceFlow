"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", students: 210 },
  { month: "Feb", students: 220 },
  { month: "Mar", students: 225 },
  { month: "Apr", students: 232 },
  { month: "May", students: 238 },
  { month: "Jun", students: 248 },
]

const chartConfig = {
  students: {
    label: "Students",
    color: "hsl(var(--chart-1))",
  },
}

export function EnrollmentChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
