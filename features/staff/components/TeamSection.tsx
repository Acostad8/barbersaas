"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addMemberAction,
  updateMemberAction,
  upsertBarberProfileAction,
} from "@/features/staff/actions";
import {
  addMemberSchema,
  barberProfileSchema,
  updateMemberSchema,
  STAFF_ROLES,
  type AddMemberInput,
  type BarberProfileInput,
  type UpdateMemberInput,
} from "@/features/staff/schemas";
import type {
  BarberProfile,
  Branch,
  MemberRole,
  Membership,
  Profile,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type TeamMember = Membership & {
  profiles: Pick<Profile, "full_name" | "avatar_url" | "phone"> | null;
  barber_profiles: BarberProfile | null;
};

const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  receptionist: "Recepcionista",
  barber: "Barbero",
  accountant: "Contador",
  client: "Cliente",
};

function AddMemberForm({
  branches,
  onDone,
}: {
  branches: Branch[];
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "", role: "barber", branchId: "" },
  });

  const onSubmit = (data: AddMemberInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await addMemberAction(data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="member-email">Correo del usuario registrado</Label>
        <Input id="member-email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="member-role">Rol</Label>
          <select
            id="member-role"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("role")}
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-branch">Sede</Label>
          <select
            id="member-branch"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("branchId")}
          >
            <option value="">Todas las sedes</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Agregando..." : "Agregar miembro"}
        </Button>
      </div>
    </form>
  );
}

function EditMemberForm({
  member,
  branches,
  onDone,
}: {
  member: TeamMember;
  branches: Branch[];
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<UpdateMemberInput>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: {
      role: member.role === "client" ? "barber" : member.role,
      branchId: member.branch_id ?? "",
      isActive: member.is_active,
    },
  });

  const onSubmit = (data: UpdateMemberInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateMemberAction(member.id, data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-role">Rol</Label>
          <select
            id="edit-role"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("role")}
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-branch">Sede</Label>
          <select
            id="edit-branch"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            {...register("branchId")}
          >
            <option value="">Todas las sedes</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("isActive")} />
        Membresía activa
      </label>
      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function BarberProfileForm({
  member,
  onDone,
}: {
  member: TeamMember;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const profile = member.barber_profiles;
  const { register, handleSubmit, formState: { errors } } =
    useForm<BarberProfileInput>({
      resolver: zodResolver(barberProfileSchema),
      defaultValues: {
        bio: profile?.bio ?? "",
        specialties: profile?.specialties.join(", ") ?? "",
        commissionRate:
          profile?.commission_rate != null
            ? String(profile.commission_rate)
            : "",
        hiredAt: profile?.hired_at ?? "",
      },
    });

  const onSubmit = (data: BarberProfileInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await upsertBarberProfileAction(member.id, data);
      if ("error" in result) setServerError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bp-bio">Bio</Label>
        <Textarea id="bp-bio" rows={2} {...register("bio")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bp-specialties">
          Especialidades (separadas por coma)
        </Label>
        <Input
          id="bp-specialties"
          placeholder="fade, barba, color"
          {...register("specialties")}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bp-commission">Comisión propia (%)</Label>
          <Input
            id="bp-commission"
            type="number"
            min={0}
            max={100}
            step="0.5"
            placeholder="Usa la del servicio"
            {...register("commissionRate")}
          />
          {errors.commissionRate && (
            <p className="text-sm text-destructive">
              {errors.commissionRate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bp-hired">Fecha de contratación</Label>
          <Input id="bp-hired" type="date" {...register("hiredAt")} />
        </div>
      </div>
      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar ficha"}
        </Button>
      </div>
    </form>
  );
}

function MemberRow({
  member,
  branches,
  canManage,
  isSelf,
}: {
  member: TeamMember;
  branches: Branch[];
  canManage: boolean;
  isSelf: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const branchName = branches.find((b) => b.id === member.branch_id)?.name;

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border p-4">
      <div className="min-w-0">
        <p className="font-medium">
          {member.profiles?.full_name ?? "Sin nombre"}
          {isSelf && (
            <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
          )}
          {!member.is_active && (
            <span className="ml-2 text-xs text-muted-foreground">
              (inactivo)
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABEL[member.role]}
          {branchName ? ` · ${branchName}` : " · Todas las sedes"}
        </p>
        {member.barber_profiles &&
          member.barber_profiles.specialties.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {member.barber_profiles.specialties.join(" · ")}
            </p>
          )}
      </div>
      {canManage && (
        <div className="flex shrink-0 gap-2">
          {member.role === "barber" && (
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Ficha
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    Ficha de {member.profiles?.full_name ?? "barbero"}
                  </DialogTitle>
                </DialogHeader>
                <BarberProfileForm
                  member={member}
                  onDone={() => setProfileOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          {!isSelf && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Editar
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Editar miembro</DialogTitle>
                </DialogHeader>
                <EditMemberForm
                  member={member}
                  branches={branches}
                  onDone={() => setEditOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </li>
  );
}

export function TeamSection({
  members,
  branches,
  canManage,
  selfMembershipId,
}: {
  members: TeamMember[];
  branches: Branch[];
  canManage: boolean;
  selfMembershipId: string;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Miembros</h2>
        {canManage && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger render={<Button />}>Agregar miembro</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Agregar miembro</DialogTitle>
              </DialogHeader>
              <AddMemberForm
                branches={branches}
                onDone={() => setAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            branches={branches}
            canManage={canManage}
            isSelf={m.id === selfMembershipId}
          />
        ))}
      </ul>
    </section>
  );
}
