'use server';

import { prisma } from '@/lib/prisma';

const IMAGES_PER_PAGE = 20;

export async function getImages(page: number, searchQuery: string = "") {
  try {
    // 検索条件の構築
    const whereCondition = searchQuery.trim() ? {
      OR: [
        { promptJa: { contains: searchQuery, mode: 'insensitive' as const } },
        { promptEn: { contains: searchQuery, mode: 'insensitive' as const } },
        { descriptionJa: { contains: searchQuery, mode: 'insensitive' as const } },
        { descriptionEn: { contains: searchQuery, mode: 'insensitive' as const } },
        { tags: { some: { 
            OR: [
              { nameJa: { contains: searchQuery, mode: 'insensitive' as const } },
              { nameEn: { contains: searchQuery, mode: 'insensitive' as const } }
            ]
          } 
        }}
      ]
    } : {};

    const images = await prisma.image.findMany({
      where: whereCondition, // 条件を適用
      skip: (page - 1) * IMAGES_PER_PAGE,
      take: IMAGES_PER_PAGE,
      orderBy: {
        createdAt: 'desc',
      },
      // 必要なフィールドを取得 (ImageGalleryと同じ型定義に合わせるためtagsを含める)
      include: {
        tags: true
      }
    });
    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}