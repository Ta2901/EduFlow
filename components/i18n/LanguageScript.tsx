import { LOCALE_OPTIONS } from '@/lib/i18n/catalog'
import { LOCALE_MODE_KEY, LOCALE_STORAGE_KEY } from '@/lib/i18n/messages'

/** Apply saved or device language before paint so the document lang matches the UI. */
export default function LanguageScript({ ssrLocale }: { ssrLocale: string }) {
  const ids = LOCALE_OPTIONS.map((item) => item.id)
  const html = Object.fromEntries(LOCALE_OPTIONS.map((item) => [item.id, item.htmlLang]))
  const code = `(function(){try{var ids=${JSON.stringify(ids)};var html=${JSON.stringify(html)};var modeKey=${JSON.stringify(LOCALE_MODE_KEY)};var key=${JSON.stringify(LOCALE_STORAGE_KEY)};var ssr=${JSON.stringify(ssrLocale)};function match(list){for(var i=0;i<list.length;i++){var tag=String(list[i]||'').toLowerCase().replace('_','-');if(tag==='lzh'||tag.indexOf('lzh-')===0)return 'lzh';if(tag==='zh-tw'||tag==='zh-hk'||tag==='zh-mo'||tag.indexOf('zh-hant')===0)return 'zh-Hant';if(tag==='zh'||tag.indexOf('zh-')===0)return 'zh-Hans';var base=tag.split('-')[0];for(var j=0;j<ids.length;j++){var id=ids[j];var low=id.toLowerCase();if(low===tag||low===base)return id;}}return 'en';}var langs=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language];var mode=localStorage.getItem(modeKey);var stored=localStorage.getItem(key);var known=ids.indexOf(stored)>=0;var l=(mode==='device')?match(langs):(known?stored:match(langs));var resolvedMode=(mode==='device')?'device':(known?(mode==='manual'?'manual':'manual'):'device');var r=document.documentElement;r.lang=html[l]||l;r.dataset.locale=l;if(l!==ssr)r.classList.add('locale-pending');var cookie=';path=/;max-age=31536000;SameSite=Lax';document.cookie=key+'='+encodeURIComponent(l)+cookie;document.cookie=modeKey+'='+resolvedMode+cookie;setTimeout(function(){r.classList.remove('locale-pending');},2000);}catch(e){}})();`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
