import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Calendar from "@/pages/calendar";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Sudoku from "@/pages/sudoku";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home as HomeIcon, LayoutDashboard, HelpCircle, Plus, Gamepad2 } from "lucide-react";
import { InsertTask, Task } from "@shared/schema";
import { addTask } from "@/lib/tasks";
import Home from "@/pages/home";
import Support from "@/pages/support";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { useState, useEffect } from "react";
import { getBreakState } from "@/components/pomodoro-timer";

function Navigation() {
  const [isBreakActive, setIsBreakActive] = useState(getBreakState());
  
  // Check if break state changes
  useEffect(() => {
    const checkBreakState = () => {
      setIsBreakActive(getBreakState());
    };
    
    // Check periodically for break state changes
    const interval = setInterval(checkBreakState, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">
              <HomeIcon className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="ghost">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="ghost">
              <HelpCircle className="mr-2 h-4 w-4" />
              Support
            </Button>
          </Link>
          {isBreakActive && (
            <Link href="/sudoku">
              <Button 
                variant="ghost"
                className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Sudoku Game
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const [isBreakActive, setIsBreakActive] = useState(getBreakState());
  
  // Update break state periodically to ensure the Sudoku page gets current state
  useEffect(() => {
    const checkBreakState = () => {
      setIsBreakActive(getBreakState());
    };
    
    const interval = setInterval(checkBreakState, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle break end (callback for Sudoku page)
  const handleBreakEnd = () => {
    // This would be called when break ends naturally or is manually ended
    // Additional logic can be added here if needed
  };

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/support" component={Support} />
      <Route path="/sudoku">
        {() => <Sudoku isBreakActive={isBreakActive} onBreakEnd={handleBreakEnd} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function FloatingActionButton({ onAddTask }: { onAddTask: (task: InsertTask) => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6">
        <Button onClick={() => setIsDialogOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogTitle>Add New Task</DialogTitle>
          <TaskForm 
            onSubmit={onAddTask}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
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
        <FloatingActionButton onAddTask={handleAddTask} />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;