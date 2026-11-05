#!/usr/bin/env node
// User-run Mac launcher. Never attaches to, quits, or modifies an existing app.
import {readFile,appendFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {diagnose} from '../macos/doctor.mjs';
import {dataRoot} from '../macos/paths.mjs';
import {appIsRunning,browserIdFromStderr,pageDebuggerUrl} from './macos-skin-utils.mjs';
import {Session} from './cdp.mjs';
import {prepareOriginalTheme,applyOriginalTheme,removeOriginalTheme,replayOriginalOpening} from './macos-upstream.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let logFile,launchedChild;
async function log(event,details={}){if(logFile)await appendFile(logFile,JSON.stringify({time:new Date().toISOString(),event,...details})+'\n',{mode:0o600});}
export function launchOptions(args){
 if(args.some(a=>!['--check','--theme-only'].includes(a))||new Set(args).size!==args.length)throw new Error('Usage: node engine/macos-skin.mjs [--check] [--theme-only]');
 return {check:args.includes('--check'),opening:!args.includes('--theme-only')};
}
export async function metadata(port,resource){
 const r=await fetch(`http://127.0.0.1:${port}${resource}`,{signal:AbortSignal.timeout(2000),redirect:'error'});
 if(!r.ok)throw new Error('Debugger metadata unavailable');const body=await r.text();if(body.length>1024*1024)throw new Error('Metadata too large');return JSON.parse(body);
}
async function main(){
 const options=launchOptions(process.argv.slice(2));
 if(process.platform!=='darwin'||Number(process.versions.node.split('.')[0])<24)throw new Error('需要 macOS 與 Node.js 24。');
 const projectRoot=dataRoot;
 const report=await diagnose();if(!report.app)throw new Error('找不到相容的 ChatGPT/Codex 應用程式。');
 const app=report.app,executable=path.join(app.path,'Contents/MacOS',app.executable);
 const resources=await prepareOriginalTheme();
 if(options.check){console.log(JSON.stringify({pass:true,app,theme:resources.loaded.theme.id,revision:resources.loaded.revision,originalAssets:{signature:Boolean(resources.assets.signature),outline:Boolean(resources.assets.outline),video:Boolean(resources.assets.video),traceVideo:Boolean(resources.assets.traceVideo)},withdrawnCssLoaded:false,launched:false,acceptance:'NOT_TESTED'},null,2));return;}
 // This branch must be run manually by the user after saving and exiting Work.
 const running=spawnSync('/bin/ps',['-axo','comm='],{encoding:'utf8'});
 if(running.status!==0)throw new Error('無法確認 ChatGPT 是否已退出，未啟動。');
 if(appIsRunning(running.stdout,executable))throw new Error('請先儲存工作並完全退出 ChatGPT，再手動執行此實驗啟動器。');
 await mkdir(path.join(projectRoot,'logs'),{recursive:true});await mkdir(path.join(projectRoot,'state'),{recursive:true});
 logFile=path.join(projectRoot,'logs/macos-skin.jsonl');await log('starting',{node:process.versions.node,opening:options.opening});
 const server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const port=server.address().port;await new Promise(resolve=>server.close(resolve));
 const child=spawn(executable,['--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`],{stdio:['ignore','ignore','pipe']});launchedChild=child;
 await log('app-spawned',{port,pid:child.pid});
 let stopped=false,stopRequested=false,browserId=null,buffer='',spawnError=false;
 child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>{buffer=(buffer+chunk).slice(-8192);browserId??=browserIdFromStderr(buffer,port);});
 child.on('exit',()=>{stopped=true;});child.on('error',()=>{stopped=true;spawnError=true;});
 const stop=()=>{stopRequested=true;};process.on('SIGINT',stop);process.on('SIGTERM',stop);
 const sessions=new Map();
 async function identity(){if(stopped)throw new Error('Launched application exited');const v=await metadata(port,'/json/version');if(v.webSocketDebuggerUrl!==`ws://127.0.0.1:${port}/devtools/browser/${browserId}`)throw Object.assign(new Error('Debugger identity changed'),{fatal:true,code:'IDENTITY_MISMATCH'});}
 let disabled=false,ready=false,openingShown=false,lastCommand=null,generation=0,command=null,controlError=null,replayedCommand=null;
 let controlTimer,controlQueue=Promise.resolve();
 const record={port,pid:child.pid,executable,launch:randomUUID(),appVersion:app.version};
 async function removeAll(){let pass=true;for(const s of sessions.values())if(!s.closed){try{await removeOriginalTheme(s);}catch{pass=false;}}return pass;}
 try{
  const deadline=Date.now()+30000;while(!stopped&&!stopRequested&&!browserId&&Date.now()<deadline)await sleep(250);
  if(!browserId)throw new Error(spawnError?'應用啟動失敗。':'未能核對本次啟動的除錯身分；請手動退出本次啟動的 ChatGPT。');
  await identity();record.browserId=browserId;
  await writeFile(path.join(projectRoot,'state/macos-session.json'),JSON.stringify(record,null,2),{mode:0o600});
  async function readControl(){
   let next;try{next=JSON.parse(await readFile(path.join(projectRoot,'state/macos-control.json'),'utf8'));}catch(error){if(error.code==='ENOENT')return;throw error;}
   if(next.launch!==record.launch||next.nonce===lastCommand)return;
   lastCommand=next.nonce;command=next;
   if(next.action==='disable'){disabled=true;generation++;await identity();const cleanupComplete=await removeAll();await log('disabled',{cleanupComplete});}
   if(next.action==='enable'){disabled=false;generation++;await log('enabled');}
  }
  controlTimer=setInterval(()=>{controlQueue=controlQueue.then(()=>stopped||stopRequested?null:readControl()).catch(error=>{controlError=error;});},200);
  await log('debugger-identified');const readyDeadline=Date.now()+30000;
  while(!stopped&&!stopRequested){
   await identity();
   const pages=await metadata(port,'/json/list');if(!Array.isArray(pages))throw new Error('Invalid target list');
   const valid=pages.filter(p=>pageDebuggerUrl(p,port)),ids=new Set(valid.map(p=>p.id));
   for(const [id,s]of sessions)if(!ids.has(id)||s.closed){await s.close();sessions.delete(id);}
   await controlQueue;if(controlError)throw controlError;
   for(const page of valid){
    let session=sessions.get(page.id);
    try{
     if(!session){
      await identity();session=await new Session(pageDebuggerUrl(page,port),{port}).open();sessions.set(page.id,session);
      session.onEvent((method,params)=>{
       if(method!=='Runtime.bindingCalled'||params.name!=='sandroneReplayOpening'||params.payload!=='replay'||disabled||stopped||stopRequested||session.replaying)return;
       session.replaying=true;
       (async()=>{const own=generation;await identity();await replayOriginalOpening(session,resources,{isCancelled:()=>disabled||stopRequested||generation!==own});await log('replay-requested');})().catch(()=>log('replay-failed')).finally(()=>{session.replaying=false;});
      });
      await session.send('Runtime.enable');await session.send('Runtime.addBinding',{name:'sandroneReplayOpening'});
     }
     if(disabled){await removeOriginalTheme(session);continue;}
     const healthy=await session.evaluate(`Boolean(document.documentElement.getAttribute('data-dream-skin')==='active'&&window.__CODEX_DREAM_SKIN_STATE__?.revision===${JSON.stringify(resources.loaded.revision)}&&window.__SANDRONE_MAC_UI__&&document.adoptedStyleSheets.includes(window.__SANDRONE_MAC_UI__.sheet))`);
     if(!healthy){
      const operation=generation;
      const result=await applyOriginalTheme({session,targetId:page.id,resources,opening:options.opening&&!openingShown,isCancelled:()=>disabled||stopRequested||operation!==generation});
      if(result.reason==='ORIGINAL_VERIFICATION_FAILED')throw Object.assign(new Error('原版主題驗證未通過，已撤回。'),{fatal:true});
      if(result.pass){ready=true;openingShown||=Boolean(result.opening?.shown);await log('original-theme-verified',{target:page.id,openingShown,visualAcceptance:'PENDING'});console.log('原版程式驗證通過，仍待手動檢查畫面。');}
     }
     if(command?.launch===record.launch&&command.action==='replay'&&command.nonce===lastCommand&&replayedCommand!==lastCommand){const own=generation;const result=await replayOriginalOpening(session,resources,{isCancelled:()=>disabled||stopRequested||generation!==own});if(result.reason!=='inactive')replayedCommand=lastCommand;}
    }catch(error){
     if(error.fatal)throw error;
     // Context destruction while routing/reloading is retried; never log page contents.
     await log('target-unavailable',{target:page.id,code:error.code||'RENDERER_UNAVAILABLE'});
     await session?.close();sessions.delete(page.id);
    }
   }
   if(!ready&&!disabled&&Date.now()>readyDeadline)throw new Error('30 秒內未能驗證原版主題；請回傳手動診斷。');
   await sleep(1000);
  }
 }finally{
  clearInterval(controlTimer);await controlQueue;
  // Restore only the app this launcher started. Never quit or kill the user's app.
  // On an identity mismatch do not send further renderer commands.
  if(!stopped){try{await identity();await removeAll();}catch{}}
  for(const s of sessions.values())await s.close();
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
  child.unref();child.stderr.unref?.();
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(async error=>{await log('failed',{code:error.code||'LAUNCHER_FAILED'}).catch(()=>{});console.error(error.message);process.exitCode=1;launchedChild?.unref();launchedChild?.stderr?.unref?.();});
