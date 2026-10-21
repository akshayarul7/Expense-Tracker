'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from "recharts";

import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import { CATEGORY_COLORS } from "./category-pie-chart";
import { formatCurrency } from "@/lib/constants";

export function MonthlyChart({ 
  data, 
  onCategoryClick 
}: { 
  data: { category: string; total: number }[];
  onCategoryClick?: (category: string) => void;
}) {
  const totalSpent = data.reduce((sum, d) => sum + d.total, 0);

  const chartData = data.map(d => ({
    category: d.category,
    total: d.total,
    percent: totalSpent > 0 ? ((d.total / totalSpent) * 100).toFixed(1) : '0',
    fill: CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']
  }));

  const chartConfig = {
    total: {
      label: "Total",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[380px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 35, right: 10, left: -20, bottom: 25 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '…' : value}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
          domain={[0, 'auto']}
        />
        <Bar 
          dataKey="total" 
          radius={[6, 6, 0, 0]}
          onClick={(entry: any) => onCategoryClick && entry?.category && onCategoryClick(entry.category)}
          className={onCategoryClick ? "cursor-pointer" : undefined}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList 
            dataKey="total" 
            position="top"
            content={(props: any) => {
              const { x, y, width, value, index } = props;
              if (value === undefined || value === null || !width) return null;
              const item = chartData[index];
              const percentText = item ? `${item.percent}%` : '';
              const cx = Number(x) + Number(width) / 2;
              const cy = Number(y);
              return (
                <g>
                  <text
                    x={cx}
                    y={cy - 16}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-semibold"
                  >
                    {formatCurrency(Number(value))}
                  </text>
                  <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] font-medium"
                  >
                    {percentText}
                  </text>
                </g>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
