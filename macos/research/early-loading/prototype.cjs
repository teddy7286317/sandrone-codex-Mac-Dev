// Isolated Electron app, not an injector or launcher. Uses only repository media
// and the upstream player. No official application code, profile, or endpoints.
const {app,BrowserWindow,protocol,session,ipcMain}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'../../..');
const output=process.argv.find(a=>a.startsWith('--research-output='))?.slice('--research-output='.length);
if(!output||!path.resolve(output).startsWith(path.join(root,'dist')+path.sep))throw Error('Explicit output under repository dist/ required');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'sandrone-isolated-electron-'));
app.setPath('userData',profile);app.setPath('sessionData',path.join(profile,'session'));
app.setPath('logs',path.join(profile,'logs'));app.setName('Sandrone Isolated Preload Research');
const began=performance.now(),events=[],requests=[],windows=[],reports=[],caseByContents=new Map();
const mark=(event,detail={})=>events.push({event,atMs:Number((performance.now()-began).toFixed(3)),...detail});
let activeCase='early',failure;
const preferences={enabled:true,openingOnLaunch:true,autoEnterOnReady:false};
const mediaNames=['sandrone-startup-intro.mp4','sandrone-startup-idle.mp4','sandrone-startup-poster.jpg','sandrone-startup-still.jpg'];
const media=new Map(mediaNames.map(name=>[path.join(root,'assets/motion',name),name]));
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,stream:true,supportFetchAPI:true}}]);
const {createStartup,startupMedia}=require('../../../native-integration/runtime/startup.cjs');
function rangeResponse(request,file,name){
 const size=fs.statSync(file).size,headers={'Accept-Ranges':'bytes','Content-Type':name.endsWith('.mp4')?'video/mp4':'image/jpeg'};
 let start=0,end=size-1,status=200;const raw=request.headers.get('range');
 if(raw){const m=/^bytes=(\d*)-(\d*)$/.exec(raw);if(!m||(!m[1]&&!m[2]))status=416;else if(!m[1]){const length=Number(m[2]);if(length<=0)status=416;else start=Math.max(size-length,0);}else{start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),size-1):end;if(start>=size||end<start)status=416;}
  if(status!==416){status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;}else headers['Content-Range']=`bytes */${size}`;
 }
 headers['Content-Length']=String(status===416?0:end-start+1);
 requests.push({case:activeCase,name,status,range:raw,bytes:status===416?0:end-start+1});
 if(status===416)return new Response(null,{status,headers});
 return new Response(require('node:stream').Readable.toWeb(fs.createReadStream(file,{start,end})),{status,headers});
}
function serve(request){
 const url=new URL(request.url);
 if(url.host==='-'&&url.pathname==='/index.html')return new Response(fs.readFileSync(path.join(__dirname,'fixture.html')),{headers:{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src app: data:; media-src app:; connect-src app:"}});
 if(url.host!=='fs'||!url.pathname.startsWith('/@fs/'))return new Response(null,{status:404});
 const file=path.resolve(decodeURIComponent(url.pathname.slice('/@fs'.length))),name=media.get(file);
 return name?rangeResponse(request,file,name):new Response(null,{status:404});
}
function secure(ses){
 ses.protocol.handle('app',serve);
 ses.webRequest.onBeforeRequest((details,done)=>{const allowed=details.url.startsWith('app:')||details.url.startsWith('data:')||details.url==='about:blank';if(!allowed)mark('network-blocked',{scheme:details.url.split(':')[0]});done({cancel:!allowed});});
}
ipcMain.on('research:event',(event,value)=>{
 if(event.senderFrame!==event.sender.mainFrame||!['host-preload','first-page-script','first-page-raf','first-paint-observed'].includes(value?.event))return;
 const record={...value,case:caseByContents.get(event.sender.id)||'unknown'};reports.push(record);mark('fixture.'+value.event,{case:record.case,cover:value.cover});
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test,label){const deadline=Date.now()+15000;while(!test()){if(Date.now()>deadline)throw Error('Timed out: '+label);await pause(20);}}
async function load(ses){
 const win=new BrowserWindow({show:false,width:960,height:700,backgroundColor:'#ffffff',webPreferences:{session:ses,preload:path.join(__dirname,'fixture-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,backgroundThrottling:false}});windows.push(win);caseByContents.set(win.webContents.id,activeCase);
 win.webContents.on('console-message',details=>{if(details.level==='error')mark('fixture-console-error',{message:details.message});});
 win.webContents.on('preload-error',(_event,_file,error)=>mark('preload-error',{code:error.name}));
 mark('navigation.start',{case:activeCase});await win.loadURL('app://-/index.html');
 await until(()=>reports.some(e=>e.case===activeCase&&e.event==='first-page-raf'),'first rAF');return win;
}
app.whenReady().then(async()=>{
 mark('app.ready');secure(session.defaultSession);
 createStartup(require('electron'),{themeRoot:root,preferences:()=>preferences,log:(event,error)=>mark(event,{...(error?{errorCode:error.name}:{})}),disable:async()=>{preferences.enabled=false;},retry:()=>{}});
 ipcMain.on('sandrone:startup-bootstrap',event=>mark('fixture.session-bootstrap',{case:caseByContents.get(event.sender.id)||'unknown'}));
 const scripts=session.defaultSession.getPreloadScripts();assert.equal(scripts.length,1);mark('preload.list.confirmed',{count:scripts.length});
 const win=await load(session.defaultSession);
 assert.equal(events.filter(e=>e.event==='fixture.session-bootstrap'&&e.case==='early').length,1);
 await until(()=>events.some(e=>e.event==='startup-first-video-frame'),'actual decoded video frame');
 assert.ok(events.findIndex(e=>e.event==='startup-document-created')>=0&&events.findIndex(e=>e.event==='startup-document-created')<events.findIndex(e=>e.event==='fixture.host-preload'),'session preload handshake precedes host preload');
 for(const event of ['first-page-script','first-page-raf'])assert.equal(reports.find(e=>e.case==='early'&&e.event===event)?.cover,true,event+' covered');
 const video=await win.webContents.executeJavaScript(`(()=>{const h=document.getElementById('sandrone-startup'),v=h.shadowRoot.querySelector('video');return {ready:h.dataset.ready,videoWidth:v.videoWidth,videoHeight:v.videoHeight,paused:v.paused,urlScheme:new URL(v.currentSrc).protocol,posterEmbedded:v.poster.startsWith('data:image/jpeg;base64,'),mountedAtMs:JSON.parse(h.dataset.diagnostics).mountedAt};})()`);
 assert.equal(video.ready,'false','No simulated backend or false ready');assert.equal(video.videoWidth,1920);assert.equal(video.paused,false);assert.equal(video.urlScheme,'app:');assert.equal(video.posterEmbedded,true);
 await until(()=>reports.some(e=>e.case==='early'&&Number.isFinite(e.paintStartMs)),'actual first-paint timing');
 const paint=reports.find(e=>e.case==='early'&&Number.isFinite(e.paintStartMs));assert.ok(video.mountedAtMs<=paint.paintStartMs,'mounted before measured renderer first-paint');
 // Main-process session.fetch exercises actual protocol responses separately
 // from the renderer video's observed 206 request. No CORS bypass is enabled.
 const url=startupMedia(root).intro,ranges=[];
 for(const range of [null,'bytes=0-31','bytes=-16','bytes=999999999-']){
  const response=await session.defaultSession.fetch(url,{headers:range?{Range:range}:{}});
  ranges.push({range,status:response.status,bytes:(await response.arrayBuffer()).byteLength,contentRange:response.headers.get('content-range')});
 }
 const denied=await session.defaultSession.fetch('app://fs/@fs/private/not-allowlisted.mp4');ranges.push({denied:denied.status});
 assert.deepEqual(ranges.map(r=>r.status??r.denied),[200,206,206,416,404]);assert.equal(ranges[1].bytes,32);assert.equal(ranges[2].bytes,16);
 // A different session does NOT inherit defaultSession's registration.
 activeCase='other-session';const other=session.fromPartition('research-other');secure(other);await load(other);
 assert.equal(other.getPreloadScripts().length,0);assert.equal(events.filter(e=>e.event==='fixture.session-bootstrap'&&e.case===activeCase).length,0);assert.equal(reports.find(e=>e.case===activeCase&&e.event==='first-page-script').cover,false);
 // Removing registration affects the next document and leaves host preload.
 session.defaultSession.unregisterPreloadScript(scripts[0].id);assert.equal(session.defaultSession.getPreloadScripts().length,0);
 activeCase='unregistered';await load(session.defaultSession);assert.equal(events.filter(e=>e.event==='fixture.session-bootstrap'&&e.case===activeCase).length,0);assert.equal(reports.find(e=>e.case===activeCase&&e.event==='first-page-script').cover,false);
 const sourceHashes=Object.fromEntries(['native-integration/runtime/startup.cjs','native-integration/runtime/startup-preload.cjs','assets/motion/sandrone-startup-intro.mp4'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
 const result={schema:1,pass:true,scope:'Owned isolated Electron fixture; no installed ChatGPT code or profile loaded; hidden window, not native first-visible acceptance',versions:{electron:process.versions.electron,chrome:process.versions.chrome,node:process.versions.node,platform:process.platform,arch:process.arch},profile:'fresh temporary userData/sessionData/logs, no login',security:{sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,externalNetworkBlocked:true},checks:['real-registerPreloadScript-before-navigation','original-upstream-preload-and-player','session-handshake-before-host-preload-cover-before-page-script-and-first-raf','mounted-before-measured-renderer-first-paint','actual-local-h264-decoded-frame','real-200-206-prefix-suffix-416-and-404','session-partition-negative-control','unregister-negative-control','no-backend-means-not-ready'],video,rangeProbeContext:'main process session.fetch; renderer video independently requested bytes=0-',ranges,sourceHashes,events,reports,requests,nativeWindowFirstVisibleMs:null};
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:true,output,versions:result.versions,checks:result.checks}));
}).catch(error=>{failure=error;fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output.replace(/\.json$/,'.failure.json'),JSON.stringify({pass:false,error:error.message,events,reports,requests},null,2));console.error(error.stack);}).finally(()=>{for(const win of windows)if(!win.isDestroyed())win.destroy();app.exit(failure?1:0);});
