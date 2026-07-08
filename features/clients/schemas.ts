import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max, `Máximo ${max} caracteres`);

export const clientFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  email: z.union([z.literal(""), z.email("Correo inválido")]),
  phone: optionalText(30),
  birthdate: z.union([
    z.literal(""),
    z.iso.date("Fecha inválida").refine(
      (d) => {
        const date = new Date(`${d}T00:00:00`);
        return date >= new Date("1900-01-01") && date <= new Date();
      },
      { message: "Fecha fuera de rango" },
    ),
  ]),
  notes: optionalText(2000),
  tags: optionalText(300),
  rating: z.union([
    z.literal(""),
    z.enum(["1", "2", "3", "4", "5"]),
  ]),
  marketingConsent: z.boolean(),
  whatsappConsent: z.boolean(),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;

export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const piece of raw.split(",")) {
    const tag = piece.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, 20);
}
