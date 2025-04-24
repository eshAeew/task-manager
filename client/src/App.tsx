import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Calendar from "@/pages/calendar";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Sudoku from "@/pages/sudoku";
import Chess from "@/pages/chess";
import Notes from "@/pages/notes";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Home as HomeIcon, 
  LayoutDashboard, 
  HelpCircle, 
  Plus, 
  Gamepad2, 
  BookOpen,
  StickyNote,
  Crown,
  LineChart,
  Edit
} from "lucide-react";
import { InsertTask, Task } from "@shared/schema";
import { addTask } from "@/lib/tasks";
import Home from "@/pages/home";
import Support from "@/pages/support";
import Wikipedia from "@/pages/wikipedia";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { useState } from "react";

function Navigation() {
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
          <Link href="/wikipedia">
            <Button 
              variant="ghost"
              className="text-blue-600 hover:text-blue-800"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Wikipedia
            </Button>
          </Link>
          <Link href="/notes">
            <Button 
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-800"
            >
              <StickyNote className="mr-2 h-4 w-4" />
              Notes
            </Button>
          </Link>
          <Link href="/sudoku">
            <Button 
              variant="ghost"
              className="text-purple-700 hover:text-purple-800"
            >
              <Gamepad2 className="mr-2 h-4 w-4" />
              Sudoku
            </Button>
          </Link>
          <Link href="/chess">
            <Button 
              variant="ghost"
              className="text-amber-600 hover:text-amber-800"
            >
              <Crown className="mr-2 h-4 w-4" />
              Chess
            </Button>
          </Link>
          <a href="https://fintracc.netlify.app" rel="noopener noreferrer">
            <Button 
              variant="ghost"
              className="text-indigo-600 hover:text-indigo-800"
            >
              <LineChart className="mr-2 h-4 w-4" />
              FinTracc
            </Button>
          </a>
          <a href="https://pro-notepad.netlify.app" rel="noopener noreferrer">
            <Button 
              variant="ghost"
              className="text-green-600 hover:text-green-800"
            >
              <Edit className="mr-2 h-4 w-4" />
              Notepad++
            </Button>
          </a>
          <Link href="/support">
            <Button variant="ghost">
              <HelpCircle className="mr-2 h-4 w-4" />
              Support
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
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/wikipedia" component={Wikipedia} />
      <Route path="/notes" component={Notes} />
      <Route path="/sudoku" component={Sudoku} />
      <Route path="/chess" component={Chess} />
      <Route path="/support" component={Support} />
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
