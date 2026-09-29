import { Outlet } from "react-router";
import { CreoBottomNavbar } from "./CreoBottomNavbar";
import { useRouteMemory } from "../../lib/useRouteMemory";
import { AdminSidebarProvider } from "../admin/AdminSidebarContext";
import { AdminSidebar } from "../admin/AdminSidebar";
import { AdminTopHeader } from "../admin/AdminTopHeader";

export function PortalLayout() {
  // Passively save current route to sessionStorage on every navigation
  useRouteMemory();

  return (
    <AdminSidebarProvider>
      <div className="portal-dark bento-theme min-h-screen w-full flex bg-[#0B111C] text-[#F8FAFC]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-[#BCCCE6] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#0B111C] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7FA0D6] focus:ring-offset-2"
        >
          Skip to content
        </a>

        {/* Permanent Desktop Sidebar (Always Visible) & Mobile Drawer */}
        <AdminSidebar />

        {/* Main Content Area: Offset on desktop to sit beside the permanent sidebar */}
        <div className="flex-1 min-w-0 md:pl-64 lg:pl-72 flex flex-col min-h-screen">
          {/* Top Header with Hamburger (mobile), Page Title, Notification Bell & Profile */}
          <AdminTopHeader />

          {/* Main Content Area */}
          <main
            id="main-content"
            className="portal-main flex-1 w-full px-0 sm:px-2 pt-2 sm:pt-4 pb-20 md:pb-8 animate-page-in"
          >
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <CreoBottomNavbar />
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
