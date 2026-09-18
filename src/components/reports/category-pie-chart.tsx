'use client';

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/constants"

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': 'oklch(0.65 0.2 25)',
  'Transportation': 'oklch(0.65 0.2 250)',
  'Shopping': 'oklch(0.7 0.18 330)',
  'Entertainment': 'oklch(0.7 0.2 145)',
  'Bills & Utilities': 'oklch(0.6 0.15 280)',
  'Health': 'oklch(0.7 0.15 165)',
  'Education': 'oklch(0.65 0.2 55)',
  'Travel': 'oklch(0.6 0.2 300)',
  'Subscriptions': 'oklch(0.65 0.15 200)',
  'Other': 'oklch(0.6 0.05 0)'
};

const defaultColor = 'oklch(0.6 0.05 0)';

export function CategoryPieChart({ data }: { data: { category: string; total: number; fill: string }[] }) {
  const chartData = data.map(d => ({
    category: d.category,
    total: d.total,
    fill: d.fill || CATEGORY_COLORS[d.category] || defaultColor
  }));

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: "Total Spending",
      },
    };
    chartData.forEach((d) => {
      config[d.category] = {
        label: d.category,
        color: d.fill,
      };
    });
    return config;
  }, [chartData]);

  const totalSpent = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0)
  }, [chartData])

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[350px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="category"
          innerRadius={60}
          outerRadius={80}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-xl font-bold"
                    >
                      {formatCurrency(totalSpent)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground text-sm"
                    >
                      Total
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
