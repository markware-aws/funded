import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import {
  getCurrentSession,
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  signOut as cognitoSignOut,
  confirmSignUp as cognitoConfirm,
} from "@/lib/auth";
import { api } from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const loadUser = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      if (!session) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      // Cognito session valid → user is authenticated regardless of backend
      try {
        const user = await api.get<User>("/users/me");
        setState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        setState({ user: null, isAuthenticated: true, isLoading: false });
      }
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const signIn = async (email: string, password: string) => {
    await cognitoSignIn(email, password);
    await loadUser();
  };

  const signOut = () => {
    cognitoSignOut();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signOut,
      signUp: cognitoSignUp,
      confirmSignUp: cognitoConfirm,
      reload: loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
