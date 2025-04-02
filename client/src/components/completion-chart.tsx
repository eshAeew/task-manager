import { useMemo } from "react";
import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface CompletionChartProps {
  tasks: Task[];
}

export function CompletionChart({ tasks }: CompletionChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const days = 7; // Show 7 days
    
    // Generate data for the last 'days' days
    const data = Array.from({ length: days }, (_, index) => {
      const date = subDays(today, days - 1 - index);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      // Count completed tasks for this day
      const completedCount = tasks.filter(task => 
        task.completed && 
        task.lastCompleted && 
        isWithinInterval(new Date(task.lastCompleted), { 
          start: dayStart, 
          end: dayEnd 
        })
      ).length;
      
      return {
        day: format(date, "EEE"),
        date: format(date, "MMM d"),
        completed: completedCount,
        isToday: index === days - 1
      };
    });
    
    return data;
  }, [tasks]);

  // Calculate average completed tasks per day
  const averageCompleted = useMemo(() => {
    const sum = chartData.reduce((acc, day) => acc + day.completed, 0);
    return Math.round((sum / chartData.length) * 10) / 10; // Round to 1 decimal place
  }, [chartData]);

  // Calculate streak
  const streak = useMemo(() => {
    let currentStreak = 0;
    
    // Start from today and go backwards
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].completed > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow-sm text-sm">
          <p className="font-medium">{payload[0].payload.date}</p>
          <p>{`${payload[0].value} tasks completed`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Completion History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-2">
          <div>
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-xs text-muted-foreground">Day streak</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{averageCompleted}</div>
            <div className="text-xs text-muted-foreground">Avg tasks/day</div>
          </div>
        </div>
        
        <div className="h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? 'var(--primary)' : 'var(--primary-light, #cbd5e1)'}
                    fillOpacity={entry.isToday ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}