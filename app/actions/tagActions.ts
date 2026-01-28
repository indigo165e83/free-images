// app/actions/tagActions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    await prisma.image.update({
      where: { id: imageId },
      data: {
        tags: {
          create: {
            nameJa: cleanTagName,
            nameEn: cleanTagName, 
          },
        },
      },
    });
  }

  revalidatePath("/[locale]/image/[id]", "page");
}
