// Build/test identity, distinct from the upstream release and client version.
import {readFileSync} from 'node:fs';
export const macVersion='0.3.5';
export const upstream=JSON.parse(readFileSync(new URL('./upstream.json',import.meta.url),'utf8'));
export function bundleName(kind='full'){
 if(!['full','static'].includes(kind))throw Error('Unknown Mac package kind');
 return `Sandrone-ChatGPT-${upstream.tag.replace(/^v/,'')}-${upstream.commit.slice(0,7)}-Mac-${macVersion}-${kind}-Test.app`;
}
