import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // 対応する言語の一覧
  locales: ['en', 'ja'],
 
  // デフォルトの言語
  defaultLocale: 'ja'
});
 
export const config = {
  // 以下のパスを除外してミドルウェアを適用
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
