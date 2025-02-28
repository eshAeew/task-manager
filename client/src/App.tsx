import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/ui/navigation";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Support from "@/pages/support";

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
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Navigation />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;