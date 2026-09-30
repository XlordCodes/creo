import React, { createContext, useContext, useState } from "react";

interface AdminSidebarContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType>({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
});

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <AdminSidebarContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  return useContext(AdminSidebarContext);
}
