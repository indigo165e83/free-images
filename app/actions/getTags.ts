'use server';

import { prisma } from '@/lib/prisma';

export async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { nameJa: 'asc' },
      select: {
        id: true,
        nameJa: true,
        nameEn: true,
        _count: {
          select: { images: true },
        },
      },
    });

    // 画像が紐付いているタグのみ返し、画像数の降順でソート
    return tags
      .filter((tag) => tag._count.images > 0)
      .map((tag) => ({
        id: tag.id,
        nameJa: tag.nameJa,
        nameEn: tag.nameEn,
        count: tag._count.images,
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
