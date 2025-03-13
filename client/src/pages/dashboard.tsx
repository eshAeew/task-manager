import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import { categoryIcons, Task } from "@shared/schema";

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
    if (!task.timeSpent) return acc;
    const category = task.category;
    // Convert timeSpent from seconds to hours for better readability
    const hours = Math.round((task.timeSpent / 3600) * 10) / 10; // Round to 1 decimal place
    acc[category] = (acc[category] || 0) + hours;
    return acc;
  }, {} as Record<string, number>);

  const timeData = Object.entries(timeByCategory)
    .filter(([_, value]) => value > 0) // Only show categories with time spent
    .map(([name, value]) => ({
      name,
      value,
      label: `${value} hrs`
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

  // Get tasks due on selected date for calendar
  const getDueTasks = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  // Get tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Format tasks by category for display
  const categoryTaskCounts = Object.entries(tasksByCategory).map(([category, tasks]) => ({
    category,
    count: tasks.length,
  }));

  // State for calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const tasksOnSelectedDate = selectedCalendarDate ? getDueTasks(selectedCalendarDate) : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analytics</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AnalyticsDashboard tasks={tasks} />
        </TabsContent>

        <TabsContent value="detailed">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Completion Rate by Priority */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>Completion Rate by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionData} layout="vertical" margin={{ left: 40, right: 30 }}>
                      <XAxis type="number" unit="%" domain={[0, 100]} />
                      <YAxis dataKey="priority" type="category" />
                      <Tooltip 
                        formatter={(value) => {
                          if (typeof value === 'number') {
                            return [`${value.toFixed(1)}%`, 'Completion Rate'];
                          }
                          return [value, 'Completion Rate'];
                        }} 
                      />
                      <Bar 
                        dataKey="rate" 
                        fill="#3B82F6" 
                        radius={[0, 4, 4, 0]} 
                        label={{ 
                          position: 'right', 
                          formatter: (value: any) => {
                            if (typeof value === 'number') {
                              return `${value.toFixed(1)}%`;
                            }
                            return `${value}%`;
                          },
                          fill: '#6B7280',
                          fontSize: 12
                        }} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Task Creation Distribution */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>Task Creation Distribution (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={tasksByDay} 
                      margin={{ left: 10, right: 10, bottom: 20 }}
                    >
                      <XAxis 
                        dataKey="date" 
                        tickLine={false}
                        axisLine={true}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any) => [value, 'Tasks']}
                        labelFormatter={(label: any) => `Day ${label}`}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]} 
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedCalendarDate}
                  onSelect={setSelectedCalendarDate}
                  className="rounded-md border"
                  modifiers={{
                    highlight: (date) => getDueTasks(date).length > 0
                  }}
                  modifiersStyles={{
                    highlight: { backgroundColor: "#3B82F6", color: "white" }
                  }}
                />
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Days with tasks due are highlighted in blue
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Tasks due on {selectedCalendarDate ? format(selectedCalendarDate, 'MMMM d, yyyy') : 'selected date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-auto pr-2">
                  {tasksOnSelectedDate.length > 0 ? (
                    <div className="space-y-3">
                      {tasksOnSelectedDate.map(task => (
                        <div key={task.id} className="p-3 border rounded-md flex justify-between items-start">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">{task.category}</div>
                          </div>
                          <div className={`px-2 py-1 text-xs font-medium rounded ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {task.priority}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No tasks due on this date
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryTaskCounts} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
                    <div key={category} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-lg flex items-center gap-2">
                          {categoryIcons[category as keyof typeof categoryIcons]} {category}
                        </h3>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                          {categoryTasks.length} tasks
                        </span>
                      </div>
                      <div className="max-h-[120px] overflow-auto">
                        <ul className="space-y-1 text-sm">
                          {categoryTasks.slice(0, 5).map(task => (
                            <li key={task.id} className="flex justify-between">
                              <span>{task.title}</span>
                              <span className={`text-xs ${
                                task.completed ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {task.completed ? 'Done' : 'Pending'}
                              </span>
                            </li>
                          ))}
                          {categoryTasks.length > 5 && (
                            <li className="text-xs text-muted-foreground text-center pt-1">
                              + {categoryTasks.length - 5} more tasks
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}