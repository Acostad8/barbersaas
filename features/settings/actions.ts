"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/forms";
import { getActiveMembership } from "@/lib/auth/current-tenant";
import {
  updateTenantSchema,
  type UpdateTenantInput,
} from "@/features/settings/schemas";

export type SettingsActionResult = { error: string } | { success: true };

export async function updateTenantAction(
  input: UpdateTenantInput,
): Promise<SettingsActionResult> {
  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const { data } = parsed;
  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: data.name,
      description: emptyToNull(data.description),
      phone: emptyToNull(data.phone),
      email: emptyToNull(data.email),
      website: emptyToNull(data.website),
      socials: {
        ...(emptyToNull(data.instagram) ? { instagram: data.instagram.trim() } : {}),
        ...(emptyToNull(data.facebook) ? { facebook: data.facebook.trim() } : {}),
        ...(emptyToNull(data.tiktok) ? { tiktok: data.tiktok.trim() } : {}),
        ...(emptyToNull(data.whatsapp) ? { whatsapp: data.whatsapp.trim() } : {}),
      },
      timezone: data.timezone,
      currency: data.currency,
    })
    .eq("id", active.tenant.id);

  if (error) {
    return { error: "No se pudo guardar. Verifica tus permisos." };
  }

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}

const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
]);

export async function uploadTenantAssetAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const kind = formData.get("kind");
  const file = formData.get("file");

  if ((kind !== "logo" && kind !== "banner") || !(file instanceof File)) {
    return { error: "Solicitud inválida" };
  }
  if (file.size === 0 || file.size > MAX_ASSET_BYTES) {
    return { error: "El archivo debe pesar entre 1 byte y 4 MB" };
  }
  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) {
    return { error: "Formato no soportado (PNG, JPG, WebP o SVG)" };
  }

  const active = await getActiveMembership();
  if (!active) {
    return { error: "Sin barbería activa" };
  }

  const supabase = await createClient();
  const path = `${active.tenant.id}/${kind}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("tenant-assets")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: "No se pudo subir el archivo. Verifica tus permisos." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("tenant-assets").getPublicUrl(path);

  const previousUrl =
    kind === "logo" ? active.tenant.logo_url : active.tenant.banner_url;

  const { error: updateError } = await supabase
    .from("tenants")
    .update(
      kind === "logo" ? { logo_url: publicUrl } : { banner_url: publicUrl },
    )
    .eq("id", active.tenant.id);

  if (updateError) {
    return { error: "Archivo subido pero no se pudo guardar la referencia" };
  }

  // Best-effort cleanup of the replaced asset.
  if (previousUrl) {
    const prefix = `/tenant-assets/`;
    const idx = previousUrl.indexOf(prefix);
    if (idx !== -1) {
      const oldPath = decodeURIComponent(
        previousUrl.slice(idx + prefix.length),
      );
      await supabase.storage.from("tenant-assets").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/configuracion");
  return { success: true };
}
