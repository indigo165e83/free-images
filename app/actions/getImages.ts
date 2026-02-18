'use server';

import { prisma } from '@/lib/prisma';

const IMAGES_PER_PAGE = 20;

export async function getImages(page: number, searchQuery: string = "", tagSlug: string = "") {
  try {
    // 検索条件の構築
    const conditions: Record<string, unknown>[] = [];

    // テキスト検索条件
    if (searchQuery.trim()) {
      conditions.push({
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
      });
    }

    // タグフィルタ条件（slugまたはnameで検索）
    if (tagSlug.trim()) {
      // slugで対応するタグを検索し、同じ名前を持つすべてのタグを取得
      const foundTag = await prisma.tag.findUnique({
        where: { slug: tagSlug },
        select: { nameJa: true, nameEn: true },
      });

      if (foundTag) {
        // 同じnameJaまたはnameEnを持つすべてのタグで検索
        conditions.push({
          tags: {
            some: {
              OR: [
                { nameJa: foundTag.nameJa },
                { nameEn: foundTag.nameEn },
              ],
            },
          },
        });
      }
    }

    const whereCondition = conditions.length > 0
      ? { AND: conditions }
      : {};

    // 並行してデータ取得とカウントを行う
    const [images, totalCount] = await Promise.all([
      prisma.image.findMany({
        where: whereCondition,
        skip: (page - 1) * IMAGES_PER_PAGE,
        take: IMAGES_PER_PAGE,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          tags: true
        }
      }),
      prisma.image.count({
        where: whereCondition
      })
    ]);

    // ★修正: 配列ではなく、imagesとtotalCountを含むオブジェクトを返す
    return { images, totalCount };
    
  } catch (error) {
    console.error('Error fetching images:', error);
    // エラー時もオブジェクト形式で返す
    return { images: [], totalCount: 0 };
  }
}