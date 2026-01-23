"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";

export async function uploadImage(formData: FormData) {
  // 1. ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // 2. フォームデータの取得
  const file = formData.get("file") as File;
  const prompt = formData.get("prompt") as string;
  
  if (!file || file.size === 0) return;

  // 3. ファイルを public/uploads フォルダに保存
  const buffer = Buffer.from(await file.arrayBuffer());
  // ファイル名が被らないように日付をつける
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`; 
  const uploadDir = path.join(process.cwd(), "public/uploads");
  
  // フォルダが無ければ自動で作る
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
  } catch (error) {
    console.error("File save error:", error);
    throw new Error("画像の保存に失敗しました");
  }

  // 4. データベースに記録
  await prisma.image.create({
    data: {
      url: `/uploads/${fileName}`, // ブラウザからアクセスするパス
      prompt: prompt || "",
      userId: session.user.id,
    },
  });

  // 5. 画面を更新
  revalidatePath("/");
}
