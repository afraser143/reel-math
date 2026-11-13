import { AuthForm } from "@/components/AuthForm";
import { Shell } from "@/components/ui";

export const metadata = { title: "Create account · Reel Math" };

export default function SignupPage() {
  return (
    <Shell title="Create an account" back={{ href: "/", label: "Home" }}>
      <AuthForm mode="signup" />
    </Shell>
  );
}
