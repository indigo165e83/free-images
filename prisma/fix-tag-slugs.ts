/**
 * fix-tag-slugs.ts
 *
 * slugがidのフォールバックになっているTagレコードを検出・修正するスクリプト
 *
 * 使い方:
 *   npx tsx scripts/fix-tag-slugs.ts          # ドライラン（変更なし・確認のみ）
 *   npx tsx scripts/fix-tag-slugs.ts --apply  # 実際に更新を適用
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

function generateSlug(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 英数字・スペース・ハイフン以外を除去
    .replace(/\s+/g, '-')         // スペースをハイフンに
    .replace(/^-+|-+$/g, '')      // 先頭・末尾のハイフンを除去
}

/** cuidっぽい文字列かどうか（c + 24文字の英数字） */
function looksLikeCuid(str: string): boolean {
  return /^c[a-z0-9]{24}$/.test(str)
}

async function main() {
  const tags = await prisma.tag.findMany({
    select: { id: true, nameJa: true, nameEn: true, slug: true },
    orderBy: { nameJa: 'asc' },
  })

  // slugがidと同じ（フォールバック）なレコードを抽出
  const fallbackTags = tags.filter((t) => t.slug === t.id || looksLikeCuid(t.slug))

  console.log(`\n全タグ数: ${tags.length}`)
  console.log(`idフォールバック slug: ${fallbackTags.length} 件\n`)

  if (fallbackTags.length === 0) {
    console.log('✅ 修正が必要なタグはありません。')
    return
  }

  const needManualFix: typeof fallbackTags = []
  const canAutoFix: { tag: (typeof fallbackTags)[0]; newSlug: string }[] = []

  // 既存のslug一覧（重複チェック用）
  const existingSlugs = new Set(tags.map((t) => t.slug))

  for (const tag of fallbackTags) {
    const candidate = generateSlug(tag.nameEn)

    if (!candidate) {
      // nameEn が日本語のみ等で slug が生成できない
      needManualFix.push(tag)
    } else {
      // 既存のslugと衝突しないか確認（自分自身は除外）
      const withoutSelf = new Set([...existingSlugs].filter((s) => s !== tag.slug))
      const finalSlug = withoutSelf.has(candidate) ? `${candidate}-${tag.id.slice(-6)}` : candidate
      canAutoFix.push({ tag, newSlug: finalSlug })
    }
  }

  // --- 自動修正可能 ---
  if (canAutoFix.length > 0) {
    console.log('=== 自動修正可能（nameEn から slug を生成） ===')
    for (const { tag, newSlug } of canAutoFix) {
      console.log(`  ${tag.nameJa} (nameEn="${tag.nameEn}")`)
      console.log(`    ${tag.slug}  →  ${newSlug}`)
    }

    if (APPLY) {
      console.log('\n更新中...')
      for (const { tag, newSlug } of canAutoFix) {
        await prisma.tag.update({
          where: { id: tag.id },
          data: { slug: newSlug },
        })
        // 既存slugセットを更新
        existingSlugs.delete(tag.slug)
        existingSlugs.add(newSlug)
        console.log(`  ✅ ${tag.nameJa}: slug = "${newSlug}"`)
      }
    } else {
      console.log('\n⚠️  ドライランです。実際に更新するには --apply を付けて実行してください。')
    }
  }

  // --- 手動修正が必要 ---
  if (needManualFix.length > 0) {
    console.log('\n=== 手動修正が必要（nameEn が日本語等で slug を生成できない） ===')
    console.log('以下のタグの nameEn を英語に修正してから、再度このスクリプトを実行してください。\n')
    for (const tag of needManualFix) {
      console.log(`  ID:     ${tag.id}`)
      console.log(`  nameJa: ${tag.nameJa}`)
      console.log(`  nameEn: ${tag.nameEn}  ← ここを英語に修正`)
      console.log(`  slug:   ${tag.slug}`)
      console.log('')
    }

    console.log('--- 修正用 SQL (例) ---')
    for (const tag of needManualFix) {
      console.log(`UPDATE "Tag" SET "nameEn" = '英語名', "slug" = '英語-slug' WHERE "id" = '${tag.id}';`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
