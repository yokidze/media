export class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(params) {
        await this.prisma.auditLog.create({
            data: {
                userId: params.userId ?? null,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId ?? null,
                metadata: params.metadata ?? undefined
            }
        });
    }
}
