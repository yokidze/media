export const hasProfileMirrorChanges = (values) => values.fullName !== undefined ||
    values.position !== undefined ||
    values.department !== undefined ||
    values.phone !== undefined ||
    values.avatarUrl !== undefined;
export const toUserMirrorUpdateData = (values) => ({
    fullName: values.fullName,
    jobTitle: values.position,
    department: values.department,
    phone: values.phone,
    profilePhotoUrl: values.avatarUrl
});
export const upsertProfileMirror = async (tx, userId, values, fallback) => {
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
