import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://free-images.indigo165e83.com"; // 本番URL

  // 1. 静的ページ
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // 2. 動的ページ（画像詳細ページ）をDBから取得
  const images = await prisma.image.findMany({
    select: { id: true, updatedAt: true },
    take: 1000, // 多すぎる場合は制限
  });

  const dynamicPages = images.map((image) => ({
    url: `${baseUrl}/image/${image.id}`,
    lastModified: image.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...dynamicPages];
}