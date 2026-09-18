'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CATEGORY_COLORS } from "./category-pie-chart";

export function MonthlyChart({ data }: { data: { category: string; total: number }[] }) {
  const chartData = data.map(d => ({
    category: d.category,
    total: d.total,
    fill: CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']
  }));

  const chartConfig = {
    total: {
      label: "Total",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="total" radius={8} />
      </BarChart>
    </ChartContainer>
  )
}
