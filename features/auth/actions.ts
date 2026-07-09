"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/features/auth/schemas";

export type AuthActionResult =
  | { error: string }
  | { message: string }
  | never;

export async function signInAction(input: LoginInput): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Tu correo aún no está confirmado. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de confirmación.",
      };
    }
    return { error: "Credenciales incorrectas" };
  }

  redirect("/dashboard");
}

export async function signUpAction(input: RegisterInput): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Ya existe una cuenta con ese correo. Inicia sesión." };
    }
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  // With email confirmation enabled there is no session yet: the user
  // must click the link in their inbox before signing in.
  if (!data.session) {
    return {
      message:
        "Cuenta creada. Te enviamos un correo de confirmación: haz clic en el enlace y luego inicia sesión.",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
