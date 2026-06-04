import { PrismaClient, AccessLevel, ArchiveStatus, ContentSection, MaterialType, RoleName } from '@prisma/client';
import argon2 from 'argon2';
import { toSlug } from '../src/common/slug.js';
const prisma = new PrismaClient();
const resolveContentSection = (materialType) => {
    if (materialType === MaterialType.VIDEO)
        return ContentSection.TV_STORY;
    if (materialType === MaterialType.IMAGE)
        return ContentSection.EVENT_PHOTO;
    return ContentSection.ARTICLE;
};
async function main() {
    const roles = await Promise.all([
        prisma.role.upsert({ where: { name: RoleName.GUEST }, update: {}, create: { name: RoleName.GUEST, description: 'Public visitor' } }),
        prisma.role.upsert({ where: { name: RoleName.STAFF }, update: {}, create: { name: RoleName.STAFF, description: 'College employee' } }),
        prisma.role.upsert({ where: { name: RoleName.ADMIN }, update: {}, create: { name: RoleName.ADMIN, description: 'System administrator' } })
    ]);
    const adminPassword = await argon2.hash('Admin123!');
    const staffPassword = await argon2.hash('Staff123!');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@college.local' },
        update: { fullName: 'System Administrator', isActive: true, mustChangePassword: false },
        create: {
            email: 'admin@college.local',
            passwordHash: adminPassword,
            fullName: 'System Administrator',
            isActive: true,
            mustChangePassword: false,
            userRoles: {
                create: [{ roleId: roles[2].id }, { roleId: roles[1].id }]
            }
        }
    });
    const staff = await prisma.user.upsert({
        where: { email: 'staff@college.local' },
        update: { fullName: 'College Staff', mustChangePassword: false },
        create: {
            email: 'staff@college.local',
            passwordHash: staffPassword,
            fullName: 'College Staff',
            mustChangePassword: false,
            userRoles: { create: [{ roleId: roles[1].id }] }
        }
    });
    await prisma.profile.upsert({
        where: { userId: admin.id },
        update: { fullName: 'System Administrator', position: 'Администратор' },
        create: {
            userId: admin.id,
            fullName: 'System Administrator',
            position: 'Администратор'
        }
    });
    await prisma.profile.upsert({
        where: { userId: staff.id },
        update: { fullName: 'College Staff', position: 'Преподаватель' },
        create: {
            userId: staff.id,
            fullName: 'College Staff',
            position: 'Преподаватель'
        }
    });
    const categoriesSeed = [
        { name: 'Приказы', description: 'Нормативные документы и распоряжения' },
        { name: 'Отчёты', description: 'Годовые и тематические отчёты' },
        { name: 'Газеты', description: 'Выпуски колледжной газеты' },
        { name: 'Фотоархив', description: 'Фотографии мероприятий и истории колледжа' },
        { name: 'Видеоархив', description: 'Видео материалов и событий' }
    ];
    const categories = [];
    for (const category of categoriesSeed) {
        categories.push(await prisma.category.upsert({
            where: { slug: toSlug(category.name) },
            update: { description: category.description },
            create: {
                name: category.name,
                slug: toSlug(category.name),
                description: category.description
            }
        }));
    }
    const tagsSeed = ['история колледжа', 'аккредитация', 'учебный процесс', 'мероприятия', 'студенты'];
    const tags = [];
    for (const tagName of tagsSeed) {
        tags.push(await prisma.tag.upsert({
            where: { slug: toSlug(tagName) },
            update: {},
            create: { name: tagName, slug: toSlug(tagName) }
        }));
    }
    const author = await prisma.author.upsert({
        where: { id: 'default-author-id' },
        update: { fullName: 'Редакционный отдел колледжа' },
        create: { id: 'default-author-id', fullName: 'Редакционный отдел колледжа', bio: 'Коллективный автор архивных материалов.' }
    });
    const sampleItems = [
        {
            title: 'Годовой отчёт колледжа за 2024 год',
            description: 'Подробный отчёт о деятельности колледжа за 2024 год.',
            materialType: MaterialType.DOCUMENT,
            categoryId: categories[1].id,
            publicationDate: new Date('2025-01-15'),
            archiveYear: 2024,
            issueNumber: null,
            accessLevel: AccessLevel.STAFF_ONLY,
            status: ArchiveStatus.PUBLISHED,
            keywords: ['отчёт', '2024', 'деятельность']
        },
        {
            title: 'Газета колледжа №12',
            description: 'Декабрьский выпуск газеты колледжа.',
            materialType: MaterialType.NEWSPAPER,
            categoryId: categories[2].id,
            publicationDate: new Date('2024-12-25'),
            archiveYear: 2024,
            issueNumber: '12',
            accessLevel: AccessLevel.PUBLIC,
            status: ArchiveStatus.PUBLISHED,
            keywords: ['газета', 'выпуск', 'декабрь']
        },
        {
            title: 'Фотоальбом: День открытых дверей 2025',
            description: 'Фотоматериалы с дня открытых дверей.',
            materialType: MaterialType.IMAGE,
            categoryId: categories[3].id,
            publicationDate: new Date('2025-03-01'),
            archiveYear: 2025,
            issueNumber: null,
            accessLevel: AccessLevel.PUBLIC,
            status: ArchiveStatus.PUBLISHED,
            keywords: ['фото', 'мероприятие', 'абитуриенты']
        }
    ];
    for (const item of sampleItems) {
        const slug = toSlug(item.title);
        const created = await prisma.archiveItem.upsert({
            where: { slug },
            update: {
                description: item.description,
                materialType: item.materialType,
                contentSection: resolveContentSection(item.materialType),
                categoryId: item.categoryId,
                publicationDate: item.publicationDate,
                archiveYear: item.archiveYear,
                issueNumber: item.issueNumber,
                accessLevel: item.accessLevel,
                status: item.status,
                keywords: item.keywords,
                updatedById: admin.id
            },
            create: {
                slug,
                title: item.title,
                description: item.description,
                materialType: item.materialType,
                contentSection: resolveContentSection(item.materialType),
                categoryId: item.categoryId,
                authorId: author.id,
                publicationDate: item.publicationDate,
                archiveYear: item.archiveYear,
                issueNumber: item.issueNumber,
                accessLevel: item.accessLevel,
                status: item.status,
                language: 'ru',
                alphabetLetter: item.title[0].toUpperCase(),
                academicYear: '2024/2025',
                keywords: item.keywords,
                createdById: admin.id,
                updatedById: admin.id
            }
        });
        await prisma.archiveItemTag.deleteMany({ where: { archiveItemId: created.id } });
        await prisma.archiveItemTag.createMany({
            data: tags.slice(0, 3).map((tag) => ({ archiveItemId: created.id, tagId: tag.id })),
            skipDuplicates: true
        });
        const existingPrimary = await prisma.archiveFile.findFirst({ where: { archiveItemId: created.id, isPrimary: true } });
        if (!existingPrimary) {
            await prisma.archiveFile.create({
                data: {
                    archiveItemId: created.id,
                    fileName: `${slug}.pdf`,
                    originalName: `${item.title}.pdf`,
                    relativePath: `uploads/${new Date().getFullYear()}/${slug}.pdf`,
                    mimeType: 'application/pdf',
                    extension: 'pdf',
                    sizeBytes: 1024 * 512,
                    isPrimary: true,
                    sortOrder: 1
                }
            });
        }
    }
    await prisma.statisticsDaily.upsert({
        where: { date: new Date('2026-01-01T00:00:00.000Z') },
        update: { totalFiles: 3, newItems: 3 },
        create: { date: new Date('2026-01-01T00:00:00.000Z'), totalFiles: 3, newItems: 3 }
    });
    console.log('Seed completed.');
    console.log('Admin: admin@college.local / Admin123!');
    console.log('Staff: staff@college.local / Staff123!');
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
