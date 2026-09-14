import { createContext, ReactNode, useContext, useState } from "react";

const ADMIN_PASSWORD = "admin";

type AdminContextType = {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  const login = (password: string) => {
    const success = password.trim() === ADMIN_PASSWORD;
    if (success) setIsAdmin(true);
    return success;
  };

  const logout = () => setIsAdmin(false);

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin debe usarse dentro de AdminProvider");
  }
  return context;
}
