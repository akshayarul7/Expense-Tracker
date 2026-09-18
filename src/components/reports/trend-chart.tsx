'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  total: {
    label: "Total Spent",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: -20,
          right: 12,
          top: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-total)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-total)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="total"
          type="natural"
          fill="url(#fillTotal)"
          fillOpacity={0.4}
          stroke="var(--color-total)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
