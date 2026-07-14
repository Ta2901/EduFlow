/** Inline before paint to avoid light/dark flash. */
export default function ThemeScript() {
  const code = `(function(){try{var k='eduflow-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;r.dataset.theme=t}catch(e){}})();`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
