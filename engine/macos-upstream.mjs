// Mac adapter around the original theme, verifier and cached opening client.
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadPayload,verifySession} from '../vendor/dream-skin/windows/scripts/injector.mjs';
import {openingAssets} from './assets.mjs';
import {prepareOpening,showOpening,releaseOpening} from './opening-client.mjs';
import {removeNativeUi,setStartupPhase} from './renderer.mjs';
import {installMacUi,removeMacUi} from './macos-ui.mjs';
import {modeToggleAuditEntries} from './macos-controls.mjs';
const root=new URL('../',import.meta.url);
const contract=JSON.parse(await fs.readFile(new URL('vendor/dream-skin/windows/assets/selectors.json',root),'utf8'));
export const call=(fn,...args)=>`(${fn.toString()})(${args.map(x=>JSON.stringify(x)).join(',')})`;
const evaluators=new WeakMap();
export function evaluateFor(session){if(!evaluators.has(session))evaluators.set(session,(code,options)=>session.evaluate(code,options));return evaluators.get(session);}

export function auditSurface(entries) {
 // Allowlisted geometry, counts and colors only: no text, HTML, values or URLs.
 const describe=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:Math.round(r.width),height:Math.round(r.height),inViewport:r.right>0&&r.bottom>0&&r.x<innerWidth&&r.y<innerHeight,background:s.backgroundColor,color:s.color,opacity:s.opacity,display:s.display,visibility:s.visibility,borderColor:s.borderColor,outlineColor:s.outlineColor,outlineStyle:s.outlineStyle,outlineWidth:s.outlineWidth,outlineOffset:s.outlineOffset,pressed:e.getAttribute?.('aria-pressed')??null,focusVisible:e.matches?.(':focus-visible')??false,hovered:e.matches?.(':hover')??false};};
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.x<innerWidth&&r.y<innerHeight&&s.display!=='none'&&s.visibility!=='hidden'&&s.contentVisibility!=='hidden'&&Number(s.opacity)!==0;};
 const matches=entries.map(({key,selector,tier,scope})=>{
  const elements=Array.from(document.querySelectorAll(selector)),active=elements.filter(e=>!e.closest('[data-app-shell-active-page="false"]')),shown=active.filter(visible);
  return {key,tier,scope,count:elements.length,active:active.length,visible:shown.length,samples:shown.slice(0,3).map(e=>{
   const backgrounds=[];for(let a=e;a&&backgrounds.length<6;a=a.parentElement)backgrounds.push(getComputedStyle(a).backgroundColor);
   return {...describe(e),backgrounds};
  })};
 });
 const cache=window.__SANDRONE_MEDIA_CACHE__;
 return {matches,visibility:document.visibilityState,viewport:{width:innerWidth,height:innerHeight},version:window.__CODEX_DREAM_SKIN_STATE__?.version??null,
  skin:document.documentElement.getAttribute('data-dream-skin'),opening:{stage:window.__SANDRONE_OPENING_STATE__?.stage??null,reason:window.__SANDRONE_OPENING_STATE__?.reason??null,cached:Boolean(cache&&!cache.disposed),videos:[cache?.color,cache?.trace].filter(Boolean).map(v=>({paused:v.paused,readyState:v.readyState,width:v.videoWidth,height:v.videoHeight,hasSource:Boolean(v.getAttribute('src'))}))},replay:{present:Boolean(document.getElementById('sandrone-mac-replay')),hidden:document.getElementById('sandrone-mac-replay')?.hidden??true}};
}
export async function prepareOriginalTheme({opening=true}={}){
 const [loaded,nativeCss,controlsCss,assets]=await Promise.all([loadPayload(fileURLToPath(new URL('themes/sandrone',root))),fs.readFile(new URL('engine/native-ui.css',root),'utf8'),fs.readFile(new URL('engine/macos-controls.css',root),'utf8'),opening?openingAssets():null]);
 return {loaded,css:nativeCss+'\n'+controlsCss,assets};
}
export async function auditOriginalTargets(session){
 const entries=[...contract.selectors,...modeToggleAuditEntries,{key:'code',selector:'pre,code',tier:'L2',scope:'thread'},{key:'input',selector:'textarea,[contenteditable="true"]',tier:'L2',scope:'home+thread'}];
 return session.evaluate(call(auditSurface,entries));
}
export async function removeOriginalTheme(session){
 const failures=[];
 // A failed media command must not prevent theme/style cleanup attempts.
 for(const operation of [()=>releaseOpening(evaluateFor(session)),()=>session.evaluate(call(removeMacUi)),()=>session.evaluate(call(removeNativeUi)),()=>session.evaluate(`(()=>{window.__CODEX_DREAM_SKIN_DISABLED__=true;return Boolean(window.__CODEX_DREAM_SKIN_STATE__?.cleanup?.());})()`)]){
  try{await operation();}catch(error){failures.push(error);}
 }
 if(failures.length)throw Object.assign(new Error('Theme cleanup incomplete'),{code:'CLEANUP_INCOMPLETE'});
 return {removed:true};
}
export async function replayOriginalOpening(session,resources,{isCancelled=()=>false}={}){
 if(!resources.assets)return {shown:false,reason:'theme-only'};
 if(!await session.evaluate(`document.visibilityState==='visible'&&document.documentElement.getAttribute('data-dream-skin')==='active'&&Boolean(document.querySelector('[data-ds-part="main"]'))`))return {shown:false,reason:'inactive'};
 if(isCancelled())return {shown:false,reason:'cancelled'};
 const prepared=await prepareOpening(evaluateFor(session),resources.assets);
 if(isCancelled()){await releaseOpening(evaluateFor(session));return {shown:false,reason:'cancelled'};}
 return showOpening(evaluateFor(session),resources.assets,{replay:true},prepared);
}
export async function applyOriginalTheme({session,targetId,resources,verify=verifySession,opening=false,isCancelled=()=>false}){
 const audit=await auditOriginalTargets(session);
 if(audit.visibility==='hidden'||!audit.matches.find(e=>e.key==='shell-main'&&e.visible>0))return {pass:false,reason:'MAIN_SURFACE_UNMATCHED',audit};
 const {loaded,css,assets}=resources;
 const guard=()=>{if(isCancelled())throw Object.assign(new Error('Theme operation cancelled'),{code:'THEME_CANCELLED'});};
 let preparation;
 try {
  guard();
  await session.evaluate(`(()=>{window.__SANDRONE_MAC_BACKGROUND__?.dispose?.();window.__CODEX_DREAM_SKIN_DISABLED__=false;})()`);
  guard();
  // Prepare media alongside original theme installation. Consume rejection
  // immediately; rollback below cancels renderer preparation before returning.
  if(opening&&assets)preparation=prepareOpening(evaluateFor(session),assets).then(value=>({value}),error=>({error}));
  await session.evaluate(call(setStartupPhase,'applying'));
  guard();
  await session.evaluate(loaded.payload);
  guard();
  const header=contract.selectors.find(e=>e.key==='header-tint').selector;
  await session.evaluate(call(installMacUi,css,header));
  guard();
  const result=await verify(session,targetId,loaded.theme.id,loaded.revision);
  guard();
  if(!result?.pass){await removeOriginalTheme(session);if(preparation)await preparation;return {pass:false,reason:'ORIGINAL_VERIFICATION_FAILED',audit};}
  await session.evaluate(call(setStartupPhase,'ready'));
  guard();
  let shown;
  if(preparation){const prepared=await preparation;guard();if(prepared.error)throw prepared.error;shown=await showOpening(evaluateFor(session),assets,{},prepared.value);guard();}
  return {pass:true,audit,opening:shown};
 }catch(error){await removeOriginalTheme(session).catch(()=>{});if(preparation)await preparation;throw error;}
}
