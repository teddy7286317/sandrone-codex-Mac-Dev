// Reproducible local bundle: trusted source assets only, no official app files.
import {access,cp,mkdir,mkdtemp,readFile,writeFile,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const version='0.3.2',target=path.join(root,`dist/Sandrone-ChatGPT-${version}-Mac-Test.app`);
if(process.platform!=='darwin')throw new Error('Build requires macOS');
try{await access(target);throw new Error('Output already exists; it was not overwritten: '+target);}catch(error){if(error.code!=='ENOENT')throw error;}
execFileSync(process.execPath,[path.join(root,'engine/macos-skin.mjs'),'--check'],{stdio:'inherit'});
await mkdir(path.join(root,'dist'),{recursive:true});
const stage=await mkdtemp(path.join(root,'dist/.mac-build-'));
try{
 const bundle=path.join(stage,path.basename(target)),contents=path.join(bundle,'Contents'),resources=path.join(contents,'Resources');
 await mkdir(path.join(contents,'MacOS'),{recursive:true});await mkdir(resources,{recursive:true});
 const engines=['assets.mjs','cdp.mjs','renderer.mjs','opening-client.mjs','native-ui.css','macos-skin.mjs','macos-skin-utils.mjs','macos-ui.mjs','macos-upstream.mjs','macos-theme.css','macos-controls.css','macos-controls.mjs','macos-early-document.mjs','macos-startup-trace.mjs','watch-signal.mjs'];
 const mac=['doctor.mjs','paths.mjs','control.mjs','session-record.mjs','audit-current.mjs','startup-report.mjs'];
 const copied=[];
 for(const relative of [...engines.map(f=>'engine/'+f),...mac.map(f=>'macos/'+f),'themes/sandrone','assets','vendor/dream-skin','LICENSE','ASSET-LICENSE.md','THIRD-PARTY-NOTICES.md','macos/README.md','macos/HOME-MODE-TOGGLE.md','macos/STARTUP-TIMING.md','macos/VALIDATION.md','macos/UPSTREAM.md','macos/upstream.json','macos/PR6-SOURCE.md','docs/OPENING-PERFORMANCE.zh-CN.md','docs/STARTUP-READINESS.zh-CN.md']){
  const dest=path.join(resources,relative);await mkdir(path.dirname(dest),{recursive:true});await cp(path.join(root,relative),dest,{recursive:true});copied.push(relative);
 }
 await writeFile(path.join(resources,'node-path.txt'),process.execPath);
 await writeFile(path.join(resources,'build-manifest.json'),JSON.stringify({version,arch:os.arch(),node:process.version,upstream:JSON.parse(await readFile(path.join(root,'macos/upstream.json'),'utf8')),contents:copied,officialAppFilesIncluded:false,visualAcceptance:'PENDING'},null,2));
 execFileSync('/usr/bin/clang',['-fobjc-arc','-framework','Cocoa',path.join(root,'macos/Launcher.m'),'-o',path.join(contents,'MacOS/SandroneLauncher')],{stdio:'inherit'});
 await writeFile(path.join(contents,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>SandroneLauncher</string><key>CFBundleIdentifier</key><string>local.sandrone.macdev.launcher</string><key>CFBundleName</key><string>Sandrone Mac Test</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>${version}</string><key>CFBundleVersion</key><string>${version}</string><key>LSUIElement</key><true/><key>NSHighResolutionCapable</key><true/></dict></plist>`);
 // Resolve every packaged runtime dependency without connecting to any app.
 execFileSync(process.execPath,[path.join(resources,'engine/macos-skin.mjs'),'--check'],{stdio:'inherit'});
 execFileSync('/usr/bin/codesign',['--force','--deep','--sign','-',bundle],{stdio:'inherit'});
 execFileSync('/usr/bin/codesign',['--verify','--deep','--strict',bundle],{stdio:'inherit'});
 await rename(bundle,target);console.log('Built experimental, ad-hoc signed bundle: '+target);
}finally{await rm(stage,{recursive:true,force:true});}
