import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import Dashboard from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ProductsPage from "@/pages/products";
import ReportsPage from "@/pages/reports";
import SalesPage from "@/pages/sales";
import SalesReportPage from "@/pages/reports/sales-report";
import { useState } from "react";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col md:flex-row">
          {/* Sidebar - hidden on mobile */}
          <Sidebar />
          
          {/* Mobile Header */}
          <MobileNav 
            isOpen={mobileMenuOpen} 
            setIsOpen={setMobileMenuOpen} 
          />
          
          {/* Main Content */}
          <main className="flex-1 md:ml-64 bg-gray-50 min-h-screen">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/clients" component={ClientsPage} />
              <Route path="/products" component={ProductsPage} />
              <Route path="/sales" component={SalesPage} />
              <Route path="/reports" component={ReportsPage} />
              <Route path="/reports/sales" component={SalesReportPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
