"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadTenantAssetAction } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AssetUploader({
  kind,
  currentUrl,
}: {
  kind: "logo" | "banner";
  currentUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = kind === "logo" ? "Logo" : "Banner";

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadTenantAssetAction(formData);
      if ("error" in result) {
        setError(result.error);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>PNG, JPG, WebP o SVG. Máximo 4 MB.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUrl ? (
          <div
            className={
              kind === "logo"
                ? "relative h-24 w-24 overflow-hidden rounded-md border"
                : "relative h-32 w-full overflow-hidden rounded-md border"
            }
          >
            <Image
              src={currentUrl}
              alt={`${title} actual`}
              fill
              className="object-cover"
              sizes={kind === "logo" ? "96px" : "100vw"}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin {title.toLowerCase()} aún.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Subiendo..." : `Subir ${title.toLowerCase()}`}
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
