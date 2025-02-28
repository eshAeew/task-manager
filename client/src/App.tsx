import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/ui/navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Support from "@/pages/support";
import { InsertTask, Task } from "@shared/schema";
import { addTask } from "@/lib/tasks";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const handleAddTask = (task: InsertTask) => {
    // Add the task to local storage
    const newTask = addTask(task);

    // Optimistically update the cache
    queryClient.setQueryData<Task[]>(["/api/tasks"], (oldTasks = []) => {
      return [...oldTasks, newTask];
    });

    // Invalidate and refetch in the background
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Navigation />
      <FloatingActionButton onAddTask={handleAddTask} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;