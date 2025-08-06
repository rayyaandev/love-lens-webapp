import { toast } from "sonner";

import { SignInFormData, SignUpFormData } from "@/types";
import {
  PostgrestError,
  Session,
  User,
  WeakPassword,
} from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const useSignIn = () => {
  const supabase = createClient();

  const router = useRouter();

  const signIn = async (data: SignInFormData) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      throw error;
    }

    return authData;
  };

  return useMutation<
    { user: User; session: Session; weakPassword?: WeakPassword },
    PostgrestError,
    SignInFormData
  >({
    mutationKey: ["sign-in"],
    mutationFn: signIn,
    onSuccess: () => {
      router.push("/");
    },
    onError: (error) => {
      toast.error(error?.message || "An error occurred while signing in");
    },
  });
};

const useSignUp = () => {
  const supabase = createClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            userRole: "admin",
          },
        },
      });

      if (error) {
        console.error("Signup error details:", error);
        throw error;
      }

      return authData;
    },
    onSuccess: (data) => {
      console.log("Signup successful:", data);
      toast.success("Signup successful!");
      router.push("/auth/login");
    },
    onError: (error) => {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to sign up. Please try again.");
    },
  });
};

const useSignOut = () => {
  const supabase = createClient();

  const queryClient = useQueryClient();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  return useMutation<void, PostgrestError>({
    mutationKey: ["sign-out"],
    mutationFn: signOut,
    onSuccess: () => {
      window.location.href = "/auth/login";

      queryClient.clear();
    },
    onError: (error) => {
      toast.error(error?.message || "An error occurred while signing out");
    },
  });
};

export { useSignIn, useSignOut, useSignUp };
