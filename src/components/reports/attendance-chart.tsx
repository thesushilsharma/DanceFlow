"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", rate: 89 },
  { month: "Feb", rate: 90 },
  { month: "Mar", rate: 88 },
  { month: "Apr", rate: 91 },
  { month: "May", rate: 90 },
  { month: "Jun", rate: 92 },
]

const chartConfig = {
  rate: {
    label: "Attendance Rate",
    color: "hsl(var(--chart-3))",
  },
}

export function AttendanceChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" domain={[85, 95]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--color-rate)"
            strokeWidth={2}
            dot={{ fill: "var(--color-rate)", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
