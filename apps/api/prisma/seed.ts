import { PrismaClient, AccessLevel, ArchiveStatus, ContentSection, MaterialType, RoleName } from '@prisma/client';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { toSlug } from '../src/common/slug.js';

const prisma = new PrismaClient();

const createTemporaryPassword = (): string => `${randomBytes(18).toString('base64url')}A1!`;

const resolveContentSection = (materialType: MaterialType): ContentSection => {
  if (materialType === MaterialType.VIDEO) return ContentSection.TV_STORY;
  if (materialType === MaterialType.IMAGE) return ContentSection.EVENT_PHOTO;
  if (materialType === MaterialType.UMKD) return ContentSection.METHODICAL_AUTHOR_PROGRAM;
  return ContentSection.ARTICLE;
};

async function main(): Promise<void> {
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: RoleName.GUEST }, update: {}, create: { name: RoleName.GUEST, description: 'Публичный посетитель' } }),
    prisma.role.upsert({ where: { name: RoleName.STAFF }, update: {}, create: { name: RoleName.STAFF, description: 'Сотрудник колледжа' } }),
    prisma.role.upsert({ where: { name: RoleName.ADMIN }, update: {}, create: { name: RoleName.ADMIN, description: 'Администратор системы' } })
  ]);

  const plainAdminPassword = process.env.SEED_ADMIN_PASSWORD || createTemporaryPassword();
  const plainStaffPassword = process.env.SEED_STAFF_PASSWORD || createTemporaryPassword();
  const adminPassword = await argon2.hash(plainAdminPassword);
  const staffPassword = await argon2.hash(plainStaffPassword);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.local' },
    update: { fullName: 'Администратор системы', isActive: true, mustChangePassword: false },
    create: {
      email: 'admin@college.local',
      passwordHash: adminPassword,
      fullName: 'Администратор системы',
      isActive: true,
      mustChangePassword: false,
      userRoles: {
        create: [{ roleId: roles[2].id }, { roleId: roles[1].id }]
      }
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@college.local' },
    update: { fullName: 'Сотрудник колледжа', mustChangePassword: false },
    create: {
      email: 'staff@college.local',
      passwordHash: staffPassword,
      fullName: 'Сотрудник колледжа',
      mustChangePassword: false,
      userRoles: { create: [{ roleId: roles[1].id }] }
    }
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: { fullName: admin.fullName, position: 'Администратор' },
    create: {
      userId: admin.id,
      fullName: admin.fullName,
      position: 'Администратор'
    }
  });

  await prisma.profile.upsert({
    where: { userId: staff.id },
    update: { fullName: staff.fullName, position: 'Преподаватель' },
    create: {
      userId: staff.id,
      fullName: staff.fullName,
      position: 'Преподаватель'
    }
  });

  const categoriesSeed = [
    {
      name: 'Приказы',
      nameRu: 'Приказы',
      nameKaz: 'Бұйрықтар',
      slug: 'orders',
      description: 'Нормативные документы и распоряжения',
      sortOrder: 1
    },
    {
      name: 'Отчёты',
      nameRu: 'Отчёты',
      nameKaz: 'Есептер',
      slug: 'reports',
      description: 'Годовые и тематические отчёты',
      sortOrder: 2
    },
    {
      name: 'Газеты',
      nameRu: 'Газеты',
      nameKaz: 'Газеттер',
      slug: 'newspapers',
      description: 'Выпуски колледжной газеты',
      sortOrder: 3
    },
    {
      name: 'Фотоархив',
      nameRu: 'Фотоархив',
      nameKaz: 'Фотоархив',
      slug: 'photo-archive',
      description: 'Фотографии мероприятий и истории колледжа',
      sortOrder: 4
    },
    {
      name: 'Видеоархив',
      nameRu: 'Видеоархив',
      nameKaz: 'Бейнеархив',
      slug: 'video-archive',
      description: 'Видео материалов и событий',
      sortOrder: 5
    }
  ];

  const categoriesBySlug = new Map<string, { id: string }>();
  for (const category of categoriesSeed) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        nameRu: category.nameRu,
        nameKaz: category.nameKaz,
        description: category.description,
        sortOrder: category.sortOrder
      },
      create: category
    });
    categoriesBySlug.set(category.slug, saved);
  }

  const methodicalCategory = await prisma.category.upsert({
    where: { slug: 'methodical-recommendations-author-programs' },
    update: {
      name: 'Методические рекомендации и авторские программы',
      nameRu: 'Методические рекомендации и авторские программы',
      nameKaz: 'Әдістемелік ұсынымдар және авторлық бағдарламалар',
      description: 'Раздел для учебно-методических комплексов, методических рекомендаций и авторских программ.',
      sortOrder: 10
    },
    create: {
      name: 'Методические рекомендации и авторские программы',
      nameRu: 'Методические рекомендации и авторские программы',
      nameKaz: 'Әдістемелік ұсынымдар және авторлық бағдарламалар',
      slug: 'methodical-recommendations-author-programs',
      description: 'Раздел для учебно-методических комплексов, методических рекомендаций и авторских программ.',
      sortOrder: 10
    }
  });
  categoriesBySlug.set(methodicalCategory.slug, methodicalCategory);

  const teacherCategoriesSeed = [
    {
      name: 'Преподаватель специальных дисциплин',
      nameRu: 'Преподаватель специальных дисциплин',
      nameKaz: 'Арнайы пәндер оқытушысы',
      slug: 'special-disciplines-teacher',
      description: 'Материалы преподавателей специальных дисциплин.',
      sortOrder: 11
    },
    {
      name: 'Преподаватель общеобразовательных дисциплин',
      nameRu: 'Преподаватель общеобразовательных дисциплин',
      nameKaz: 'Жалпы білім беретін пәндер оқытушысы',
      slug: 'general-education-teacher',
      description: 'Материалы преподавателей общеобразовательных дисциплин.',
      sortOrder: 12
    }
  ];

  for (const category of teacherCategoriesSeed) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        nameRu: category.nameRu,
        nameKaz: category.nameKaz,
        description: category.description,
        parentId: methodicalCategory.id,
        sortOrder: category.sortOrder
      },
      create: {
        ...category,
        parentId: methodicalCategory.id
      }
    });
    categoriesBySlug.set(category.slug, saved);
  }

  const tagsSeed = [
    'история колледжа',
    'аккредитация',
    'учебный процесс',
    'мероприятия',
    'студенты',
    'учебно-методический комплекс дисциплины',
    'пәннің оқу-әдістемелік кешені'
  ];
  const tags = [];
  for (const tagName of tagsSeed) {
    tags.push(
      await prisma.tag.upsert({
        where: { slug: toSlug(tagName) },
        update: { name: tagName },
        create: { name: tagName, slug: toSlug(tagName) }
      })
    );
  }

  const author = await prisma.author.upsert({
    where: { id: 'default-author-id' },
    update: { fullName: 'Редакционный отдел колледжа' },
    create: {
      id: 'default-author-id',
      fullName: 'Редакционный отдел колледжа',
      bio: 'Коллективный автор архивных материалов.'
    }
  });

  const sampleItems = [
    {
      title: 'Годовой отчёт колледжа за 2024 год',
      description: 'Подробный отчёт о деятельности колледжа за 2024 год.',
      materialType: MaterialType.DOCUMENT,
      categorySlug: 'reports',
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
      categorySlug: 'newspapers',
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
      categorySlug: 'photo-archive',
      publicationDate: new Date('2025-03-01'),
      archiveYear: 2025,
      issueNumber: null,
      accessLevel: AccessLevel.PUBLIC,
      status: ArchiveStatus.PUBLISHED,
      keywords: ['фото', 'мероприятие', 'абитуриенты']
    },
    {
      title: 'Пәннің оқу-әдістемелік кешені: арнайы пәндер',
      description: 'Учебно-методический комплекс дисциплины для специальных дисциплин: методические рекомендации и авторская программа.',
      materialType: MaterialType.UMKD,
      categorySlug: 'special-disciplines-teacher',
      publicationDate: new Date('2026-06-04'),
      archiveYear: 2026,
      issueNumber: null,
      accessLevel: AccessLevel.PUBLIC,
      status: ArchiveStatus.PUBLISHED,
      keywords: ['учебно-методический комплекс дисциплины', 'пәннің оқу-әдістемелік кешені', 'методические рекомендации', 'авторская программа']
    }
  ];

  for (const item of sampleItems) {
    const slug = toSlug(item.title);
    const category = categoriesBySlug.get(item.categorySlug);
    const created = await prisma.archiveItem.upsert({
      where: { slug },
      update: {
        title: item.title,
        description: item.description,
        materialType: item.materialType,
        contentSection: resolveContentSection(item.materialType),
        categoryId: category?.id,
        authorId: author.id,
        publicationDate: item.publicationDate,
        archiveYear: item.archiveYear,
        issueNumber: item.issueNumber,
        accessLevel: item.accessLevel,
        status: item.status,
        keywords: item.keywords,
        deletedAt: null,
        updatedById: admin.id
      },
      create: {
        slug,
        title: item.title,
        description: item.description,
        materialType: item.materialType,
        contentSection: resolveContentSection(item.materialType),
        categoryId: category?.id,
        authorId: author.id,
        publicationDate: item.publicationDate,
        archiveYear: item.archiveYear,
        issueNumber: item.issueNumber,
        accessLevel: item.accessLevel,
        status: item.status,
        language: 'ru',
        alphabetLetter: item.title[0].toUpperCase(),
        academicYear: '2025/2026',
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
    update: { totalFiles: sampleItems.length, newItems: sampleItems.length },
    create: { date: new Date('2026-01-01T00:00:00.000Z'), totalFiles: sampleItems.length, newItems: sampleItems.length }
  });

  console.log('Seed completed.');
  console.log(`Admin: admin@college.local / ${plainAdminPassword}`);
  console.log(`Staff: staff@college.local / ${plainStaffPassword}`);
  console.log('If these users already existed, their passwords were not changed by seed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
