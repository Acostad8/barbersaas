import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  slug: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(60, "Máximo 60 caracteres")
    .regex(SLUG_REGEX, "Solo minúsculas, números y guiones (ej: mi-barberia)"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
