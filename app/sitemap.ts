import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://free-images.indigo165e83.com";
  const locales = ['ja', 'en']; // 対応言語

  // 1. 静的ページの定義（ロケール部分を除いたパス）
  const staticRoutes = [
    "",              // ホーム
    "/privacy-policy",
    "/tips"
  ];

  // 静的ページのサイトマップ生成（各言語ごとに展開）
  const staticPages = staticRoutes.flatMap((route) => {
    return locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`, // 例: https://.../ja/privacy-policy
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.5,
    }));
  });

  // 2. 動的ページ（画像詳細ページ）をDBから取得
  const images = await prisma.image.findMany({
    select: { id: true, updatedAt: true },
    take: 1000, // 必要に応じて調整
    orderBy: { updatedAt: 'desc' } // 新しい順にするのが一般的
  });

  // 画像ページのサイトマップ生成（各言語ごとに展開）
  const dynamicPages = images.flatMap((image) => {
    return locales.map((locale) => ({
      url: `${baseUrl}/${locale}/image/${image.id}`,
      lastModified: image.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  });

  // 3. タグページをDBから取得
  const tags = await prisma.tag.findMany({
    select: { id: true, nameJa: true, nameEn: true, updatedAt: true },
    where: { images: { some: {} } }, // 画像が紐付いているタグのみ
  });

  const tagPages = tags.flatMap((tag) => {
    return locales.map((locale) => {
      const tagName = locale === 'en' ? (tag.nameEn || tag.nameJa) : (tag.nameJa || tag.nameEn);
      return {
        url: `${baseUrl}/${locale}/tags/${encodeURIComponent(tagName)}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });
  });

  return [...staticPages, ...dynamicPages, ...tagPages];
}