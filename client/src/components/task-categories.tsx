import { useMemo } from "react";
import { Task, categoryOptions, categoryIcons } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface TaskCategoriesProps {
  tasks: Task[];
}

export function TaskCategories({ tasks }: TaskCategoriesProps) {
  const categoriesData = useMemo(() => {
    // Initialize categories with counts
    const categories: Record<string, { total: number; completed: number; icon: string }> = {};
    
    // Initialize all possible categories
    categoryOptions.forEach(category => {
      const categoryValue = category.value;
      categories[categoryValue] = {
        total: 0,
        completed: 0,
        icon: categoryIcons[categoryValue as keyof typeof categoryIcons] || "⚪️"
      };
    });
    
    // Count tasks by category
    tasks.forEach(task => {
      if (task.category && categories[task.category]) {
        categories[task.category].total += 1;
        if (task.completed) {
          categories[task.category].completed += 1;
        }
      }
    });
    
    // Convert to array and sort by total count (descending)
    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Tasks by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoriesData.map(category => (
            category.total > 0 && (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium capitalize">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {category.completed}/{category.total}
                    </Badge>
                    <Badge 
                      variant={
                        category.percentage >= 75 ? "default" :
                        category.percentage >= 50 ? "default" :
                        category.percentage >= 25 ? "outline" : "destructive"
                      }
                      className={
                        category.percentage >= 75 ? "bg-green-100 text-green-800" : 
                        category.percentage >= 50 ? "bg-blue-100 text-blue-800" :
                        category.percentage >= 25 ? "bg-yellow-100 text-yellow-800" : ""
                      }
                    >
                      {category.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={category.percentage}
                  className="h-2"
                />
              </div>
            )
          ))}
          
          {categoriesData.every(category => category.total === 0) && (
            <div className="text-center py-3 text-muted-foreground">
              No tasks created yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}