import { AuthForm } from "@/components/AuthForm";
import { Shell } from "@/components/ui";

export const metadata = { title: "Sign in · Reel Math" };

export default function LoginPage() {
  return (
    <Shell title="Sign in" back={{ href: "/", label: "Home" }}>
      <AuthForm mode="login" />
    </Shell>
  );
}
