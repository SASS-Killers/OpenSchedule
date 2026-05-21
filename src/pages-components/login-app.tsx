import { AuthProvider } from "@/auth/auth-context";
import { LoginPage } from "@/pages-components/login-page";

export default function LoginApp() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
