// PR #6's real extracted renderer in an isolated synthetic page. No app access.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {installStaticBackground} from '../macos/static/renderer.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),art='data:image/png;base64,'+(await readFile(new URL('../themes/sandrone/background.png',import.meta.url))).toString('base64');
 await page.setContent('<html><body></body></html>');
 const install=()=>page.evaluate(`(${installStaticBackground.toString()})(${JSON.stringify(art)})`);
 assert.equal(await install(),false);assert.equal(await page.locator('#sandrone-personal-overlay').count(),0);
 await page.setContent('<html><body style="margin:0"><aside style="position:fixed;left:0;top:0;width:260px;height:100vh"><button>Fixture sidebar</button></aside><main style="position:fixed;left:260px;top:48px;right:0;bottom:0"><button>Fixture control</button><textarea aria-label="Fixture input"></textarea></main></body></html>');
 const before=await page.locator('textarea').evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}));
 assert.equal(await install(),true);assert.equal(await install(),true);
 assert.equal(await page.locator('#sandrone-personal-overlay').count(),1);assert.equal(await page.locator('#sandrone-personal-style').count(),1);
 const panel=page.locator('#sandrone-personal-overlay');assert.deepEqual(await panel.boundingBox(),{x:260,y:48,width:1020,height:752});
 assert.equal(await panel.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 await page.getByRole('textbox').fill('Fixture text');assert.equal(await page.getByRole('textbox').inputValue(),'Fixture text');
 assert.deepEqual(await page.locator('textarea').evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})),before);
 await page.evaluate(()=>{const d=document.createElement('div');d.role='dialog';d.id='fixture-dialog';document.body.append(d);});assert.equal(await panel.evaluate(e=>getComputedStyle(e).display),'none');
 await page.locator('#fixture-dialog').evaluate(e=>e.remove());assert.notEqual(await panel.evaluate(e=>getComputedStyle(e).display),'none');
 await page.setViewportSize({width:650,height:800});await page.evaluate(()=>window.__sandronePersonalLayout());assert.equal(await panel.evaluate(e=>getComputedStyle(e).display),'none');
 console.log(JSON.stringify({pass:true,browser:browser.version(),scope:'PR #6 static renderer in synthetic page; no real-app acceptance',checks:['no-install-without-anchor','owned-overlay-idempotency','unchanged-static-layout','input-and-colors-untouched','dialog-and-narrow-hiding']}));
}finally{await browser.close();}
