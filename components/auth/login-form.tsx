"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Message } from "../form-message";
import { useForm } from "react-hook-form";
import { useSignIn } from "@/queries/misc";
import ValidateInput from "../ValidateInput";

interface FormValues {
  email: string;
  password: string;
}

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  searchParams: Message;
}

/**
 * Login form component with Azure-inspired styling
 * Handles form validation and submission
 */
export function LoginForm({
  className,
  searchParams,
  ...props
}: LoginFormProps) {
  const { handleSubmit, control } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isPending, mutate } = useSignIn();

  const onSubmit = async (data: FormValues) => {
    mutate(data);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {/* Email input field */}
          <div className="grid gap-2">
            <ValidateInput
              control={control}
              name="email"
              placeholder="name@example.com"
              required
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: "Invalid email address",
                },
              }}
              label="Email"
              type="email"
            />
          </div>

          {/* Password input with forgot password link */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
            <ValidateInput
              control={control}
              name="password"
              placeholder=""
              required
              rules={{
                required: "Password is required",
              }}
              label=""
              type="password"
            />
          </div>

          {/* Sign in button - Azure styled */}
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </Button>

          {/* Sign up link */}
          <div className="text-center text-sm mt-4">
            Don&apos;t have an account? <Link href="/sign-up">Create one</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
