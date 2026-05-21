import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "host";
}

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true, error: null });
  const [_email, setEmail] = useState("");

  // Check for existing session on mount
  useEffect(() => {
    const m = document.cookie.match(/session=([^;]+)/);
    if (!m) {
      setState({ session: null, loading: false, error: null });
      return;
    }
    // Session exists — we can't decode it client-side, but the server will validate
    // Try to extract basic info from the JWT
    try {
      const parts = m[1].split(".");
      const payload = JSON.parse(atob(parts[1]));
      setState({
        session: {
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          role: payload.userrole || payload.role,
        },
        loading: false,
        error: null,
      });
    } catch {
      setState({ session: null, loading: false, error: null });
    }
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setEmail(email);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setState((s) => ({ ...s, loading: false }));
      return data.ok;
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
      return false;
    }
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/pgrst/rpc/verify_code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p_email: email, p_code: code }),
      });
      const data = await res.json();
      if (data.userId) {
        // Submit hidden form to set server-side session
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/session";
        for (const key of ["userId", "email", "name", "role"]) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = data[key] || "";
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return true;
      }
      setState((s) => ({ ...s, loading: false, error: data.error || "Invalid code" }));
      return false;
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
      return false;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return <AuthContext.Provider value={{ ...state, login, verifyCode, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
