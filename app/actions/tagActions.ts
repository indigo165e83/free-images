// app/actions/tagActions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// nameEn からURLフレンドリーなslugを生成する
function generateSlug(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // 英数字・スペース・ハイフン以外を除去
    .replace(/\s+/g, "-")          // スペースをハイフンに変換
    .replace(/^-+|-+$/g, "");      // 先頭・末尾のハイフンを除去
}

// タグを画像から外す（削除）
export async function removeTagFromImage(imageId: string, tagId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("権限がありません");

  await prisma.image.update({
    where: { id: imageId },
    data: {
      tags: {
        disconnect: { id: tagId }, // 紐付けを解除するだけ（タグ自体は消えない）
      },
    },
  });

  // 多言語パスに対応するため、パスの再検証はlocaleを含むか、全ルートを対象にするのが安全です
  // ここではシンプルに画像ページを更新します
  revalidatePath("/[locale]/image/[id]", "page");
}

// タグを画像に追加する
export async function addTagToImage(imageId: string, tagName: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("権限がありません");

  const cleanTagName = tagName.trim();
  if (!cleanTagName) return;

  // 既存のタグを検索 (日本語または英語のどちらかに一致するか)
  const existingTag = await prisma.tag.findFirst({
    where: {
      OR: [
        { nameJa: cleanTagName },
        { nameEn: cleanTagName }
      ]
    }
  });

  if (existingTag) {
    // 既存タグがあれば紐付け (Connect)  
    await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          connect: { id: existingTag.id },
        },
      },
    });
  } else {
    // 既存タグがなければ新規作成 (Create)して紐付け
    // ※現在は入力フォームが1つなので、暫定的にJa/En両方に同じ値を入れます。
    // 将来的には自動翻訳APIを使って、片方を翻訳した値を入れるのが理想的です。

    // slugを生成し、重複する場合はランダムサフィックスを付与する
    const baseSlug = generateSlug(cleanTagName) || cleanTagName.toLowerCase();
    let slug = baseSlug;
    const existingSlug = await prisma.tag.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          create: {
            nameJa: cleanTagName,
            nameEn: cleanTagName,
            slug,
          },
        },
      },
    });
  }

  revalidatePath("/[locale]/image/[id]", "page");
}
