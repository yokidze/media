import type { Prisma, PrismaClient } from '@prisma/client';

type AuthorClient = PrismaClient | Prisma.TransactionClient;

export const resolveAuthorId = async (client: AuthorClient, authorName?: string | null): Promise<string | null | undefined> => {
  if (authorName === undefined) {
    return undefined;
  }

  const normalized = authorName?.trim() ?? '';
  if (!normalized) {
    return null;
  }

  const existingAuthor = await client.author.findFirst({
    where: { fullName: { equals: normalized, mode: 'insensitive' } },
    select: { id: true }
  });

  if (existingAuthor) {
    return existingAuthor.id;
  }

  const createdAuthor = await client.author.create({
    data: { fullName: normalized },
    select: { id: true }
  });

  return createdAuthor.id;
};
