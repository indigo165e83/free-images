'use server';

import { prisma } from '@/lib/prisma';

export async function getTags(locale: string = 'ja') {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { nameJa: 'asc' },
      select: {
        id: true,
        nameJa: true,
        nameEn: true,
        slug: true,
        _count: {
          select: { images: true },
        },
      },
    });

    // 画像が紐付いているタグのみ
    const activeTags = tags.filter((tag) => tag._count.images > 0);

    // ロケールに応じたタグ名で集約（同じnameJaの複数レコードを1つにまとめる）
    const aggregated = new Map<string, { id: string; nameJa: string; nameEn: string; slug: string; count: number }>();
    for (const tag of activeTags) {
      const key = locale === 'en' ? (tag.nameEn || tag.nameJa) : (tag.nameJa || tag.nameEn);
      const existing = aggregated.get(key);
      if (existing) {
        existing.count += tag._count.images;
      } else {
        aggregated.set(key, {
          id: tag.id,
          nameJa: tag.nameJa,
          nameEn: tag.nameEn,
          slug: tag.slug,
          count: tag._count.images,
        });
      }
    }

    // 画像数の降順でソート
    return Array.from(aggregated.values()).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
