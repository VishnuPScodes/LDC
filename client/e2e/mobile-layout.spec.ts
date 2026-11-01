import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const screenshotDir='../artifacts/fix-round';
const routes=['/','/papers','/papers/228-2023','/topics','/topics/history','/ldc-syllabus','/practice','/today','/progress','/review','/facts'];
test.beforeAll(async()=>fs.mkdir(screenshotDir,{recursive:true}));

async function assertNoHorizontalOverflow(page:any){
 const result=await page.evaluate(()=>({
  url:location.pathname+location.search,
  viewport:window.innerWidth,
  document:document.documentElement.scrollWidth,
  body:document.body.scrollWidth,
  bodyMargin:getComputedStyle(document.body).margin,
  stylesheets:[...document.styleSheets].map((sheet:any)=>sheet.href),
  htmlClient:document.documentElement.clientWidth,
  bodyRect:document.body.getBoundingClientRect().toJSON(),
  nodes:['.paper-screen','.public-question-list','.paper-reading-tools','.paper-settings','.booklet-heading','.public-question','.public-question-label','.public-question-label span','.public-options','.public-options li','.answer-check'].flatMap(selector=>[...document.querySelectorAll(selector)].slice(0,2).map((element:any)=>({selector,rect:element.getBoundingClientRect().toJSON(),width:getComputedStyle(element).width,minWidth:getComputedStyle(element).minWidth,display:getComputedStyle(element).display,padding:getComputedStyle(element).padding}))),
  offenders:[...document.querySelectorAll('body *')].map((element:any)=>({tag:element.tagName,className:typeof element.className==='string'?element.className:'',right:element.getBoundingClientRect().right,width:element.getBoundingClientRect().width,scroll:element.scrollWidth,client:element.clientWidth})).filter((item:any)=>item.right>window.innerWidth+1&&item.width>0).sort((a:any,b:any)=>b.right-a.right).slice(0,8),
  scrollable:[...document.querySelectorAll('body *')].map((element:any)=>({tag:element.tagName,className:typeof element.className==='string'?element.className:'',left:element.getBoundingClientRect().left,right:element.getBoundingClientRect().right,scroll:element.scrollWidth,client:element.clientWidth,overflow:getComputedStyle(element).overflowX})).filter((item:any)=>item.scroll>item.client+1).sort((a:any,b:any)=>b.scroll-a.scroll).slice(0,8),
 }));
 expect(result.document,JSON.stringify(result)).toBeLessThanOrEqual(result.viewport);
 expect(result.offenders,JSON.stringify(result)).toEqual([]);
}

test.describe('responsive page bounds',()=>{
 for(const width of [360,390,768,1440]){
  test(`main routes fit ${width}px`,async({page})=>{
   await page.setViewportSize({width,height:width<600?844:900});
   for(const route of routes){
    await page.goto(route,{waitUntil:'domcontentloaded'});
    await page.waitForLoadState('networkidle');
    if(route==='/papers/228-2023'){
     await page.evaluate(()=>window.scrollTo(0,0));
     if(width===390)await page.screenshot({path:`${screenshotDir}/paper-before-answer-${width}.png`,fullPage:false});
     const reveal=page.getByRole('button',{name:/Show answer/}).first();
     if(await reveal.count())await reveal.click();
     await page.waitForTimeout(80);
     if(width===390){const marker=page.locator('.answer-check').filter({hasText:'✓'}).first();await expect(marker).toBeVisible();await marker.scrollIntoViewIfNeeded();await page.screenshot({path:`${screenshotDir}/paper-after-answer-${width}.png`,fullPage:false});}
     await assertNoHorizontalOverflow(page);
    }else await assertNoHorizontalOverflow(page);
   }
  });
 }
});

test('guest answer feedback fits the phone viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/practice?topic=arts-literature-culture-sports&count=10');
 const start=page.getByRole('button',{name:/Start practice/i});
 if(await start.count())await start.click();
 const option=page.locator('.guest-options button').first();
 await expect(option).toBeVisible({timeout:15_000});
 await page.screenshot({path:`${screenshotDir}/guest-before-answer-390.png`,fullPage:false});
 await option.click();
 await expect(page.locator('.guest-feedback')).toBeVisible();
 await assertNoHorizontalOverflow(page);
 await page.screenshot({path:`${screenshotDir}/guest-after-answer-390.png`,fullPage:false});
});
