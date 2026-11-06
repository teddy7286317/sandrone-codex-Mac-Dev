// Static package verification only. Never invokes the launcher or official app.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {macVersion,bundleName,upstream} from '../macos/package-info.mjs';
const root=path.resolve(import.meta.dirname,'..'),bundle=path.join(root,'dist',bundleName('full')),contents=path.join(bundle,'Contents'),resources=path.join(contents,'Resources');
const plist=JSON.parse(execFileSync('/usr/bin/plutil',['-convert','json','-o','-',path.join(contents,'Info.plist')],{encoding:'utf8'}));
assert.equal(plist.LSUIElement,false);assert.equal(plist.LSMultipleInstancesProhibited,true);assert.equal(plist.CFBundleIdentifier,'local.sandrone.macdev.launcher');assert.equal(plist.CFBundleShortVersionString,macVersion);
assert.ok((await fs.stat(path.join(resources,plist.CFBundleIconFile))).size>0);
const manifest=JSON.parse(await fs.readFile(path.join(resources,'build-manifest.json'),'utf8'));assert.deepEqual(manifest.upstream,upstream);assert.equal(manifest.kind,'full');assert.equal(manifest.startupMode,'baseline');assert.equal(manifest.terminalRequired,false);assert.equal(manifest.visualAcceptance,'PENDING');assert.equal(manifest.officialAppFilesIncluded,false);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const name of ['engine/macos-skin.mjs','macos/launcher-channel.mjs','engine/renderer.mjs','engine/opening-client.mjs','engine/native-ui.css','engine/macos-controls.css','macos/DOCK-LAUNCHER.md','macos/MANUAL-ACCEPTANCE.md','macos/START-HERE.html','macos/PR6-SOURCE.md','LICENSE','ASSET-LICENSE.md','THIRD-PARTY-NOTICES.md','vendor/dream-skin/LICENSE','macos/QUICK-ACCEPTANCE.md'])assert.equal(hash(await fs.readFile(path.join(resources,name))),hash(await fs.readFile(path.join(root,name))),name+' packaged content');
const names=await fs.readdir(resources,{recursive:true});assert.ok(!names.some(name=>/(^|\/)(logs|state|profile|research|tests|static)(\/|$)|app\.asar$/.test(name)));
const binary=await fs.readFile(path.join(contents,'MacOS/SandroneLauncher'));for(const forbidden of ['SANDRONE_TEST_SCRIPT','--self-test','SANDRONE_FIXTURE_MODE'])assert.ok(!binary.includes(Buffer.from(forbidden)));
execFileSync('/usr/bin/codesign',['--verify','--deep','--strict',bundle]);
console.log(JSON.stringify({pass:true,scope:'static package only',checks:['dock-metadata-and-icon','baseline-and-pending-acceptance','source-byte-matches','no-official-app-or-user-data-or-research-or-fixtures','no-test-entry-in-release-binary','codesign-strict']}));
