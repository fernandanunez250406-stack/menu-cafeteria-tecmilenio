import { createContext, ReactNode, useContext, useState } from "react";

const ADMIN_PASSWORD = "admin";

type AdminContextType = {
  isAdmin: boolean;
  isStoreOpen: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  setIsStoreOpen: (isOpen: boolean) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  const login = (password: string) => {
    const success = password.trim() === ADMIN_PASSWORD;

    if (success) {
      setIsAdmin(true);
    }

    return success;
  };

  const logout = () => {
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
<<<<<<< HEAD
        login,
        logout,
=======
        isStoreOpen,
        login,
        logout,
        setIsStoreOpen,
>>>>>>> gabriel
      }}
    >
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