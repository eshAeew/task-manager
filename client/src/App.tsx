import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Calendar from "@/pages/calendar";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { InsertTask, Task } from "@shared/schema";
import { addTask } from "@/lib/tasks";
import Home from "@/pages/home";
import Support from "@/pages/support";


function Navigation() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-4">
          <Link href="/calendar">
            <Button variant="ghost">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/support" component={Support}/>
      <Route path="/" component={Home}/>
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <main>
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;