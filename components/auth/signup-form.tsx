"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Message } from "../form-message";
import { useForm } from "react-hook-form";
import { useSignUp } from "@/queries/misc";
import ValidateInput from "../ValidateInput";

interface FormValues {
  email: string;
  password: string;
}

interface SignUpFormProps extends React.ComponentPropsWithoutRef<"div"> {
  searchParams: Message;
}

export function SignupForm({ className, ...props }: SignUpFormProps) {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isPending, mutate } = useSignUp();

  const onSubmit = async (data: FormValues) => {
    mutate(data);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-card border-border shadow-lg rounded-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-serif text-foreground">
            Hello there
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <ValidateInput
                    control={control}
                    name="email"
                    placeholder="m@example.com"
                    className="w-full"
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

                <div className="grid gap-2">
                  <ValidateInput
                    control={control}
                    name="password"
                    placeholder=""
                    className="w-full"
                    required
                    rules={{
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must have at least 8 characters",
                      },
                    }}
                    label="Password"
                    type="password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold py-3"
                >
                  {isPending ? "Signing up..." : "Sign up"}
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-foreground hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-foreground transition-colors">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
