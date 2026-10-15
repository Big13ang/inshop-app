/**
 * Inline script that recovers from a page whose HTML points at build assets a
 * newer deploy has already removed (e.g. HTML served from an edge cache).
 *
 * It must be inline: when the page's own scripts fail to load, React never
 * hydrates, so nothing in the bundle could run to repair it. On the first
 * failed `/_next/static/` asset (or failed lazy chunk) it reloads the page once
 * with a throwaway `_r` query param, so caches key it as a fresh URL and fetch
 * the current HTML. A short-lived cookie stops it from ever looping.
 */
const RECOVERY_SCRIPT = `(function(){
  var COOKIE='inshop_asset_reload';
  var PARAM='_r';
  function isAsset(url){return typeof url==='string'&&url.indexOf('/_next/static/')!==-1;}
  function recover(){
    if(document.cookie.indexOf(COOKIE+'=1')!==-1)return;
    document.cookie=COOKIE+'=1; max-age=60; path=/; samesite=lax';
    var url=new URL(location.href);
    url.searchParams.set(PARAM,Date.now().toString(36));
    location.replace(url.toString());
  }
  window.addEventListener('error',function(event){
    var el=event.target;
    if(el&&el!==window&&(el.tagName==='SCRIPT'||el.tagName==='LINK')&&isAsset(el.src||el.href))recover();
  },true);
  window.addEventListener('unhandledrejection',function(event){
    var reason=event.reason;
    var message=(reason&&reason.message)||String(reason||'');
    if((reason&&reason.name==='ChunkLoadError')||/Loading chunk|dynamically imported module/i.test(message))recover();
  });
  window.addEventListener('load',function(){
    var url=new URL(location.href);
    if(url.searchParams.has(PARAM)){url.searchParams.delete(PARAM);history.replaceState(history.state,'',url.toString());}
  });
})();`;

export function StaleAssetRecovery() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: fixed, build-time constant script (no user input) that must run before any bundle loads
  return <script dangerouslySetInnerHTML={{ __html: RECOVERY_SCRIPT }} />;
}
