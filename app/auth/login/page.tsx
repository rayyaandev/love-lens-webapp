import { LoginForm } from "@/components/auth/login-form";
import { Message } from "@/components/form-message";
import { Heart } from "lucide-react";

/**
 * Sign-in page component
 * Styled to match Love Lens design language
 */
export default async function Login(props: { searchparams: Promise<Message> }) {
  const searchParams = await props.searchparams;
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 bg-background">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Logo and brand section */}
        <div className="flex items-center gap-3 self-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-foreground">
              THE LOVE LENS
            </span>
            <span className="text-sm italic text-muted-foreground font-serif">
              Love. Framed.
            </span>
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="bg-secondary rounded-t-2xl -mt-8 -mx-8 px-8 py-6 mb-6">
            <h1 className="text-2xl font-serif text-center text-foreground mb-2">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Access your Love Lens account
            </p>
          </div>
          <LoginForm searchParams={searchParams} />
        </div>

        <div className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <a href="#" className="text-foreground hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-foreground hover:underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
