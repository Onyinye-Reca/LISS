import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { MemberView } from "@liss11/shared";
import * as authApi from "../lib/auth-api";

interface AuthState {
  member: MemberView | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<MemberView>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberView | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setMember(await authApi.getMe());
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  // Hydrate the session once on load from the httpOnly cookie.
  useEffect(() => {
    void refresh();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedIn = await authApi.login(email, password);
    setMember(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    await authApi.logout();
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ member, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
