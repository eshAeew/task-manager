import { Task } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { startOfWeek, eachDayOfInterval, format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target } from "lucide-react";

interface AnalyticsDashboardProps {
  tasks: Task[];
}

export function AnalyticsDashboard({ tasks }: AnalyticsDashboardProps) {
  // Calculate daily completion stats for the last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyCompletions = last7Days.map(date => {
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.lastCompleted || task.createdAt);
      return (
        format(taskDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        task.completed
      );
    });

    return {
      date: format(date, "MMM dd"),
      completed: dayTasks.length,
    };
  });

  // Calculate priority distribution
  const priorityStats = tasks.reduce(
    (acc, task) => {
      acc[task.priority] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 } as Record<string, number>
  );

  const priorityData = Object.entries(priorityStats).map(([name, value]) => ({
    name,
    value,
  }));

  // Calculate streak
  let currentStreak = 0;
  let maxStreak = 0;
  let streakDate = new Date();

  for (let i = 0; i < last7Days.length; i++) {
    const tasksCompletedOnDay = tasks.filter(
      task =>
        task.completed &&
        task.lastCompleted &&
        format(new Date(task.lastCompleted), "yyyy-MM-dd") ===
          format(last7Days[i], "yyyy-MM-dd")
    ).length;

    if (tasksCompletedOnDay > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Calculate completion rate
  const completionRate =
    tasks.length > 0
      ? ((tasks.filter(t => t.completed).length / tasks.length) * 100).toFixed(0)
      : "0";

  const COLORS = ["#3B82F6", "#EAB308", "#EF4444"];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Streak Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak} days</div>
          <p className="text-xs text-muted-foreground">
            Best streak: {maxStreak} days
          </p>
        </CardContent>
      </Card>

      {/* Completion Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {tasks.filter(t => t.completed).length} of {tasks.length} tasks
            completed
          </p>
        </CardContent>
      </Card>

      {/* Productivity Score Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
          <Star className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.min(
              100,
              Math.round(
                (Number(completionRate) + currentStreak * 10 + maxStreak * 5) / 2
              )
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on completion rate and streaks
          </p>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Task Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={35}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {priorityData.map((entry, index) => (
              <Badge
                key={entry.name}
                variant="outline"
                className="flex items-center gap-1"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                {entry.name} ({entry.value})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Weekly Completion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCompletions}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
