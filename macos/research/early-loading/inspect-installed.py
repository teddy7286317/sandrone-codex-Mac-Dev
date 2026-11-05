#!/usr/bin/env python3
"""Read-only bundle inspection. Never imports/executes official JS or native code.
Writes JSON to stdout only; does not inspect processes, debugger ports or profiles.
"""
import argparse, hashlib, json, mmap, plistlib, re, struct, subprocess
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--app',type=Path,default=Path('/Applications/ChatGPT.app'))
args=parser.parse_args()
contents=args.app/'Contents'
def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''): h.update(block)
    return h.hexdigest()
def command(argv):
    result=subprocess.run(argv,capture_output=True,text=True,check=False)
    return {'exitCode':result.returncode,'stdout':result.stdout.strip(),'stderr':result.stderr.strip()}
plist=plistlib.loads((contents/'Info.plist').read_bytes())
asar=contents/'Resources/app.asar'
with asar.open('rb') as f:
    prefix=f.read(16)
    _,header_size,_,json_size=struct.unpack('<IIII',prefix)
    if json_size>64*1024*1024: raise ValueError('Unexpected ASAR header size')
    header_bytes=f.read(json_size)
    header=json.loads(header_bytes)
    def flatten(tree,prefix=''):
        for name,entry in tree.get('files',{}).items():
            name=prefix+name
            if 'files' in entry:yield from flatten(entry,name+'/')
            else:yield name,entry
    entries=dict(flatten(header))
    def read(name):
        entry=entries[name]
        if entry.get('unpacked') or 'offset' not in entry: raise ValueError('Expected packed file')
        f.seek(8+header_size+int(entry['offset']))
        return f.read(entry['size'])
    package=json.loads(read('package.json'))
    needles=['registerPreloadScript','setPreloads','PreloadInjection','sparkle.node','windows-updater.node','protocol.handle("app"','registerSchemesAsPrivileged','Accept-Ranges','Content-Range','/@fs','preload:this.options.preloadPath','new ea.BrowserWindow','show:u','loadURL(','getPath("userData")']
    scanned=[]
    for name in entries:
        if not(name.startswith('.vite/build/early-bootstrap') and name.endswith('.js')):continue
        data=read(name)
        hits={needle:[m.start() for m in re.finditer(re.escape(needle.encode()),data)] for needle in needles}
        scanned.append({'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'byteOffsets':{k:v for k,v in hits.items() if v}})
framework=contents/'Frameworks/Codex Framework.framework/Codex Framework'
with framework.open('rb') as f,mmap.mmap(f.fileno(),0,access=mmap.ACCESS_READ) as data:
    marker=b'dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX'
    offset=data.find(marker)
    if offset<0:raise ValueError('Fuse wire not found')
    start=offset+len(marker);version,length=data[start:start+2]
    states=list(data[start+2:start+2+length])
    names=['RunAsNode','EnableCookieEncryption','EnableNodeOptionsEnvironmentVariable','EnableNodeCliInspectArguments','EnableEmbeddedAsarIntegrityValidation','OnlyLoadAppFromAsar','LoadBrowserProcessSpecificV8Snapshot','GrantFileProtocolExtraPrivileges','WasmTrapHandlers']
    fuses={'offset':offset,'version':version,'length':length,'rawBytes':states,'states':{names[i] if i<len(names) else 'unknown_'+str(i):{48:'disabled',49:'enabled',114:'removed',144:'inherit'}.get(value,'unknown') for i,value in enumerate(states)}}
resources=plistlib.loads((contents/'_CodeSignature/CodeResources').read_bytes())
sealed={}
for name in ['Resources/app.asar','Resources/native/sparkle.node','Resources/native/windows-updater.node']:
    entry=resources.get('files2',{}).get(name)
    sealed[name]={'present':entry is not None,'sha256MatchesResourceSeal':entry.get('hash2').hex()==sha(contents/name) if isinstance(entry,dict) and isinstance(entry.get('hash2'),bytes) and (contents/name).is_file() else None}

native=contents/'Resources/native'
entitlements=command(['/usr/bin/codesign','-d','--entitlements','-',str(args.app)])
result={'schema':1,'scope':'Static read-only bundle inspection; no installed application code executed or live process accessed','bundle':{'id':plist.get('CFBundleIdentifier'),'version':plist.get('CFBundleShortVersionString'),'main':package.get('main'),'asarSha256':sha(asar),'asarHeaderSha256':hashlib.sha256(header_bytes).hexdigest(),'embeddedAsarIntegrity':plist.get('ElectronAsarIntegrity'),'frameworkSha256':sha(framework)},'fuses':fuses,'resourceSealEntries':sealed,'nativeModules':sorted(p.name for p in native.iterdir()),'sparkleSha256':sha(native/'sparkle.node'),'pluginDirectory':sorted(p.name for p in (contents/'PlugIns').iterdir()),'dockTilePlugin':plist.get('NSDockTilePlugIn'),'codesignDisplay':command(['/usr/bin/codesign','-dv','--verbose=4',str(args.app)]),'codesignRequirement':command(['/usr/bin/codesign','-d','-r-',str(args.app)]),'codesignVerification':command(['/usr/bin/codesign','--verify','--deep','--strict',str(args.app)]),'entitlementsDisplay':entitlements,'scannedSourceFiles':scanned}
print(json.dumps(result,indent=2))
