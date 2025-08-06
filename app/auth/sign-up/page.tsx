import { SignupForm } from "@/components/auth/signup-form";
import { FormMessage, Message } from "@/components/form-message";
import { Heart } from "lucide-react";

/**
 * Sign-up page component
 * Styled to match Love Lens design language
 */
export default async function Signup(props: {
  searchparams: Promise<Message>;
}) {
  const searchParams = await props.searchparams;

  return (
    // Main container with Love Lens background color
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

        {/* Sign-up form with Love Lens styling */}
        <SignupForm searchParams={searchParams} />
      </div>
    </div>
  );
}
