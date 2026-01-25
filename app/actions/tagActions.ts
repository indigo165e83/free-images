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

  revalidatePath(`/image/${imageId}`);
}

// タグを画像に追加する
export async function addTagToImage(imageId: string, tagName: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("権限がありません");

  const cleanTagName = tagName.trim();
  if (!cleanTagName) return;

  await prisma.image.update({
    where: { id: imageId },
    data: {
      tags: {
        // タグがあれば紐付け、なければ作って紐付け (Upsert的な動作)
        connectOrCreate: {
          where: { name: cleanTagName },
          create: { name: cleanTagName },
        },
      },
    },
  });

  revalidatePath(`/image/${imageId}`);
}