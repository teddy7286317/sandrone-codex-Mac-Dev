// PR #6 static renderer by wsqUsaqi537; extracted without selector/style changes.
// This is never imported by the full-theme launcher.
export function installStaticBackground(art) {
 if (!document.body || !document.querySelector('button')) return false;
 if (document.getElementById('sandrone-personal-overlay')) { window.__sandronePersonalLayout?.(); return true; }
 const panel = document.createElement('div'); panel.id = 'sandrone-personal-overlay';
 panel.style.cssText = 'position:fixed;z-index:9990;pointer-events:none;opacity:.24;mix-blend-mode:screen;background-image:url("' + art + '");background-position:right center;background-size:cover;background-repeat:no-repeat;mask-image:linear-gradient(to right,transparent 0%,rgba(0,0,0,.45) 12%,black 30%,black 92%,transparent 100%),linear-gradient(to bottom,transparent 0%,black 7%,black 93%,transparent 100%);mask-composite:intersect';
 const style = document.createElement('style'); style.id='sandrone-personal-style';
 style.textContent='@media(max-width:700px){#sandrone-personal-overlay{display:none}} body:has([role="dialog"]) #sandrone-personal-overlay,body:has([role="alertdialog"]) #sandrone-personal-overlay{display:none}';
 document.head.appendChild(style); document.body.appendChild(panel);
 window.__sandronePersonalLayout = () => {
  const w=window.innerWidth, h=window.innerHeight;
  const mains=[...document.querySelectorAll('main,[role="main"]')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>w*.35 && r.height>h*.45).sort((a,b)=>b.width*b.height-a.width*a.height);
  const sidebars=[...document.querySelectorAll('aside,nav,[role="navigation"]')].map(e=>e.getBoundingClientRect()).filter(r=>r.height>h*.4 && r.right>w*.12 && r.right<w*.6);
  const main=mains[0]; let left=main?.left ?? Math.min(w*.27,400);
  if(sidebars.length) left=Math.max(left,...sidebars.map(r=>r.right));
  const top=Math.max(48,main?.top ?? 48), right=Math.min(w,main?.right ?? w), bottom=Math.min(h,main?.bottom ?? h);
  Object.assign(panel.style,{left:left+'px',top:top+'px',width:Math.max(0,right-left)+'px',height:Math.max(0,bottom-top)+'px'});
 };
 window.__sandronePersonalLayout(); return true;
}
