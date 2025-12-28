"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Jazz", enrollment: 14 },
  { name: "Contemporary", enrollment: 12 },
  { name: "Hip Hop", enrollment: 10 },
  { name: "Ballet", enrollment: 8 },
  { name: "Adv Ballet", enrollment: 6 },
]

const chartConfig = {
  enrollment: {
    label: "Enrollment",
    color: "hsl(var(--chart-4))",
  },
}

export function ClassPopularityChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" className="text-xs" />
          <YAxis dataKey="name" type="category" className="text-xs" width={80} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="enrollment" fill="var(--color-enrollment)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
