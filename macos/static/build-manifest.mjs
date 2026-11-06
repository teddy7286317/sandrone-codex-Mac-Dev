// Static build receipts only. No app launch or debugger access.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {macVersion,upstream} from '../package-info.mjs';
if(process.argv.length!==3)throw Error('Usage: node macos/static/build-manifest.mjs <resources>');
const resources=process.argv[2],contents=['macos-skin.mjs','macos-skin-utils.mjs','renderer.mjs','Sandrone-background.png','applet.icns','node-path.txt','README.txt','LICENSE','ASSET-LICENSE.md','THIRD-PARTY-NOTICES.md','macos/PR6-SOURCE.md','macos/upstream.json','docs/MACOS.zh-CN.md','themes/sandrone/LICENSE.txt','assets/LICENSE.txt'];
const hashes=Object.fromEntries(await Promise.all(contents.map(async name=>[name,createHash('sha256').update(await readFile(path.join(resources,name))).digest('hex')])));
await writeFile(path.join(resources,'build-manifest.json'),JSON.stringify({version:macVersion,kind:'static',upstream,nodeRuntime:'external-build-time-path',officialProgramFilesIncluded:false,icon:'local-build-icon; never redistributed as repository source',visualAcceptance:'PENDING',contributor:'wsqUsaqi537, PR #6',contents,hashes},null,2)+'\n');
