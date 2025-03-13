import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/tasks";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
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
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from "date-fns";

export default function DashboardPage() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: getTasks,
  });

  // Calculate monthly task creation distribution
  const currentMonth = new Date();
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const tasksByDay = daysInMonth.map(date => {
    const tasksOnDay = tasks.filter(task => 
      isSameDay(new Date(task.createdAt), date)
    );
    return {
      date: format(date, "dd"),
      count: tasksOnDay.length,
    };
  });

  // Calculate time spent distribution by category
  const timeByCategory = tasks.reduce((acc, task) => {
    const category = task.category;
    acc[category] = (acc[category] || 0) + (task.timeSpent || 0);
    return acc;
  }, {} as Record<string, number>);

  const timeData = Object.entries(timeByCategory).map(([name, value]) => ({
    name,
    value: Math.round(value / 60), // Convert seconds to minutes
  }));

  // Calculate completion rate by priority
  const completionByPriority = tasks.reduce((acc, task) => {
    const priority = task.priority;
    if (!acc[priority]) {
      acc[priority] = { total: 0, completed: 0 };
    }
    acc[priority].total += 1;
    if (task.completed) {
      acc[priority].completed += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  const completionData = Object.entries(completionByPriority).map(([priority, data]) => ({
    priority,
    rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
  }));

  const COLORS = ["#3B82F6", "#EAB308", "#EF4444", "#10B981", "#8B5CF6"];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AnalyticsDashboard tasks={tasks} />
        </TabsContent>

        <TabsContent value="detailed">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Time Spent by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Time Spent by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}min`}
                      >
                        {timeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionData}>
                      <XAxis dataKey="priority" />
                      <YAxis unit="%" />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Task Creation Distribution */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Task Creation Distribution (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksByDay}>
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Task Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={new Date()}
                className="rounded-md border"
                modifiers={{
                  busy: (date) => tasks.some(task => 
                    isSameDay(new Date(task.dueDate), date)
                  ),
                }}
                modifiersStyles={{
                  busy: { backgroundColor: "#3B82F6", color: "white" },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
