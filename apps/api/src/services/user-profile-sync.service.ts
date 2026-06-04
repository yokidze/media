import type { Prisma } from '@prisma/client';

export interface ProfileMirrorValues {
  fullName?: string;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileMirrorFallback {
  fullName: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export const hasProfileMirrorChanges = (values: ProfileMirrorValues): boolean =>
  values.fullName !== undefined ||
  values.position !== undefined ||
  values.department !== undefined ||
  values.phone !== undefined ||
  values.avatarUrl !== undefined;

export const toUserMirrorUpdateData = (values: ProfileMirrorValues): Prisma.UserUpdateInput => ({
  fullName: values.fullName,
  jobTitle: values.position,
  department: values.department,
  phone: values.phone,
  profilePhotoUrl: values.avatarUrl
});

export const upsertProfileMirror = async (
  tx: Prisma.TransactionClient,
  userId: string,
  values: ProfileMirrorValues,
  fallback: ProfileMirrorFallback
): Promise<void> => {
  await tx.profile.upsert({
    where: { userId },
    update: {
      fullName: values.fullName,
      position: values.position,
      department: values.department,
      phone: values.phone,
      avatarUrl: values.avatarUrl
    },
    create: {
      userId,
      fullName: values.fullName ?? fallback.fullName,
      position: values.position ?? fallback.position,
      department: values.department ?? fallback.department,
      phone: values.phone ?? fallback.phone,
      avatarUrl: values.avatarUrl ?? fallback.avatarUrl
    }
  });
};

