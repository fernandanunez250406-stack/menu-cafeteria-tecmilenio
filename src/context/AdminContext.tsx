import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getStoreStatus, updateStoreStatus } from "@/services/api";

const ADMIN_PASSWORD = "admin";

const STORE_STATUS_REFRESH_MS = 5000;

type AdminContextType = {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isStoreOpen: boolean;
  setIsStoreOpen: (value: boolean) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  // El valor inicial se mantiene abierto mientras
  // se obtiene el estado real desde el backend.
  const [isStoreOpen, setIsStoreOpenState] = useState(true);

  const isUpdatingStoreRef = useRef(false);

  /**
   * Obtiene el estado real de la cafetería desde el backend.
   */
  const loadStoreStatus = async () => {
    try {
      const data = await getStoreStatus();

      setIsStoreOpenState(data.isOpen);
    } catch (error) {
      console.error("Error cargando estado de la cafetería:", error);
    }
  };

  /**
   * Al iniciar la aplicación obtenemos el estado
   * guardado en el backend.
   *
   * Después lo comprobamos periódicamente para que
   * los clientes detecten cambios hechos por el administrador.
   */
  useEffect(() => {
    void loadStoreStatus();

    const interval = setInterval(() => {
      if (!isUpdatingStoreRef.current) {
        void loadStoreStatus();
      }
    }, STORE_STATUS_REFRESH_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * Cambia el estado de la cafetería.
   *
   * El cambio primero se envía al backend.
   * Si el backend lo guarda correctamente,
   * actualizamos el estado local.
   */
  const setIsStoreOpen = async (value: boolean) => {
    if (isUpdatingStoreRef.current) {
      return;
    }

    isUpdatingStoreRef.current = true;

    // Guardamos temporalmente el valor anterior
    // por si la petición falla.
    const previousValue = isStoreOpen;

    // Actualización inmediata de la interfaz.
    setIsStoreOpenState(value);

    try {
      const data = await updateStoreStatus(value);

      // Usamos el valor confirmado por el backend.
      setIsStoreOpenState(data.isOpen);
    } catch (error) {
      console.error("Error actualizando estado de la cafetería:", error);

      // Si falla el backend, regresamos al estado anterior.
      setIsStoreOpenState(previousValue);
    } finally {
      isUpdatingStoreRef.current = false;
    }
  };

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
        login,
        logout,
        isStoreOpen,
        setIsStoreOpen,
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
