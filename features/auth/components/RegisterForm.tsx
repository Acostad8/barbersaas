"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheck,
  Scissors,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { signUpAction } from "@/features/auth/actions";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PasswordCheck = {
  label: string;
  test: (v: string) => boolean;
};

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: "Al menos 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Una letra minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Una letra mayúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Un número", test: (v) => /[0-9]/.test(v) },
];

const STRENGTH_LEVELS = [
  { label: "Muy débil", color: "bg-destructive" },
  { label: "Débil", color: "bg-destructive/80" },
  { label: "Aceptable", color: "bg-amber-500" },
  { label: "Fuerte", color: "bg-emerald-500" },
  { label: "Excelente", color: "bg-emerald-600" },
];

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const passwordValue = watch("password") ?? "";
  const confirmValue = watch("confirmPassword") ?? "";

  const passedChecks = useMemo(
    () => PASSWORD_CHECKS.map((c) => c.test(passwordValue)),
    [passwordValue]
  );
  const strengthScore = passedChecks.filter(Boolean).length;
  const strength =
    STRENGTH_LEVELS[Math.min(strengthScore, STRENGTH_LEVELS.length - 1)]!;

  const onSubmit = (data: RegisterInput) => {
    setServerError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await signUpAction(data);
      if (result && "error" in result) {
        setServerError(result.error);
      } else if (result && "message" in result) {
        setSuccessMessage(result.message);
      }
    });
  };

  if (successMessage) {
    return (
      <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <MailCheck className="h-6 w-6" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="font-heading text-3xl font-medium tracking-tight">
              Revisa tu correo
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {successMessage}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">¿No lo ves?</p>
            <p className="mt-1">
              Revisa tu carpeta de spam o promociones. El enlace expira en 24
              horas.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 w-full text-sm font-medium"
            )}
          >
            Ir a iniciar sesión
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Volver al inicio
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-black/5 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Scissors className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <CardTitle className="font-heading text-3xl font-medium tracking-tight">
            Crea tu cuenta
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Empieza a gestionar tu barbería en minutos. Sin tarjeta, sin
            compromisos.
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-5">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Nombre completo
            </Label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Juan Pérez"
                aria-invalid={errors.fullName ? "true" : undefined}
                className={cn("h-11 pl-10 text-sm md:text-sm")}
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@barberia.com"
                aria-invalid={errors.email ? "true" : undefined}
                className={cn("h-11 pl-10 text-sm md:text-sm")}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Contraseña
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Crea una contraseña segura"
                aria-invalid={errors.password ? "true" : undefined}
                className={cn("h-11 pl-10 pr-10 text-sm md:text-sm")}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>

            {passwordValue.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-1.5 flex-1 gap-1 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={strengthScore}
                    aria-valuemin={0}
                    aria-valuemax={PASSWORD_CHECKS.length}
                    aria-label="Fortaleza de la contraseña"
                  >
                    {PASSWORD_CHECKS.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-full flex-1 rounded-full transition-colors",
                          i < strengthScore ? strength.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  {PASSWORD_CHECKS.map((check, i) => {
                    const passed = passedChecks[i];
                    return (
                      <li
                        key={check.label}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors",
                          passed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {passed ? (
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <X className="h-3.5 w-3.5 opacity-60" aria-hidden />
                        )}
                        <span>{check.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                aria-invalid={errors.confirmPassword ? "true" : undefined}
                className={cn("h-11 pl-10 pr-16 text-sm md:text-sm")}
                {...register("confirmPassword")}
              />
              {confirmValue.length > 0 &&
                confirmValue === passwordValue &&
                passwordValue.length > 0 && (
                  <CheckCircle2
                    className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
                    aria-hidden
                  />
                )}
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showConfirm}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground select-none">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            />
            <span>
              Acepto los{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Términos de servicio
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Política de privacidad
              </Link>
              .
            </span>
          </label>
        </CardContent>

        <CardFooter className="mt-2 flex flex-col gap-4">
          <Button
            type="submit"
            className="h-11 w-full text-sm font-medium"
            disabled={isPending}
          >
            {isPending ? "Creando cuenta…" : "Crear cuenta gratis"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            <span>Conexión cifrada · Tus datos siempre protegidos</span>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
