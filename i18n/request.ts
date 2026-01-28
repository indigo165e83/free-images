import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
 
  // 対応していない言語が来た場合は日本語にする
  if (!locale || !['ja', 'en'].includes(locale)) {
    locale = 'ja';
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});