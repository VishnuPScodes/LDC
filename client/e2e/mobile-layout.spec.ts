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
 await expect(page.locator('.feedback-verdict')).toBeVisible();
 await expect(page.locator('.quiz-option.is-correct')).toBeVisible();
 const selected=page.locator('.quiz-option[aria-pressed="true"]');
 const selectedCorrect=await selected.evaluate((node:any)=>node.classList.contains('is-correct'));
 await expect(page.locator('.quiz-option.is-dimmed')).toHaveCount(selectedCorrect?3:2);
 await assertNoHorizontalOverflow(page);
 await page.screenshot({path:`${screenshotDir}/guest-after-answer-390.png`,fullPage:false});
});

test('quitting guest practice reports only questions shown so far',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/practice?topic=arts-literature-culture-sports&count=10');
 const start=page.getByRole('button',{name:/Start practice/i});
 if(await start.count())await start.click();
 const option=page.locator('.guest-options button').first();
 await expect(option).toBeVisible({timeout:15_000});
 await option.click();
 await page.getByRole('button',{name:/Next/i}).click();
 await expect(page.getByRole('button',{name:'Exit practice'})).toBeVisible();
 await page.getByRole('button',{name:'Exit practice'}).click();
 await expect(page.getByRole('heading',{name:'Your practice results'})).toBeVisible();
 await expect(page.getByText(/You answered 1 of 2 questions/)).toBeVisible();
 await expect(page.locator('.guest-results .public-question')).toHaveCount(1);
});

test('public mobile header is compact and opens navigation sheet',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/papers');
 const header=page.locator('.public-header');
 await expect(header).toBeVisible();
 expect(await header.evaluate((node:any)=>node.getBoundingClientRect().height)).toBeLessThanOrEqual(56);
 await expect(page.getByRole('button',{name:'Open menu'})).toBeVisible();
 await page.screenshot({path:`${screenshotDir}/mobile-nav-closed-390.png`,fullPage:false});
 await page.getByRole('button',{name:'Open menu'}).click();
 await expect(page.locator('#public-mobile-menu')).toBeVisible();
 await expect(page.locator('#public-mobile-menu').getByRole('link',{name:'Question Papers'})).toHaveAttribute('href','/papers');
 await expect(page.locator('#public-mobile-menu').getByRole('link',{name:'Sign in'})).toHaveAttribute('href','/login');
 await page.screenshot({path:`${screenshotDir}/mobile-nav-open-390.png`,fullPage:false});
 await assertNoHorizontalOverflow(page);
});

test('signed-in mobile navigation has five usable tabs',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/api/auth/me',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({_id:'mobile-test-user',name:'Student',email:'student@example.test'})}));
 await page.goto('/today');
 const tabs=page.locator('.mobile-bottom-nav');
 await expect(tabs).toBeVisible({timeout:12_000});
 for(const [label,href] of [['Today','/today'],['Practice','/practice'],['Review','/review'],['Progress','/progress']]){
  const link=tabs.getByRole('link',{name:label});
  await expect(link).toHaveAttribute('href',href);
  expect(await link.evaluate((node:any)=>node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 }
 await expect(tabs.getByRole('button',{name:'More'})).toBeVisible();
 await expect(page.locator('.app-header').evaluate((node:any)=>node.getBoundingClientRect().height)).resolves.toBeLessThanOrEqual(56);
 await assertNoHorizontalOverflow(page);
});

test('visible UI version matches the client package release',async({page})=>{
 await page.goto('/');
 await expect(page.locator('footer.app-version')).toContainText('v1.10.17');
});

for(const [width,height] of [[360,740],[390,844]]){
 test(`knowledge swipe card fits ${width}×${height} and explains gestures once`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.goto('/facts');
  const card=page.locator('.knowledge-card:not(.knowledge-card-under)').first();
  await expect(card).toBeVisible();
  await expect(card.locator('button')).toHaveCount(0);
  await expect(card.locator('.knowledge-swipe-hint')).toBeVisible();
  const bounds=await card.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(height);
  await assertNoHorizontalOverflow(page);
  const x=bounds!.x+bounds!.width/2,y=bounds!.y+bounds!.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+Math.min(140,bounds!.width*.4),y,{steps:12});
  await page.mouse.up();
  await expect(page.locator('.knowledge-card-number').last()).toHaveText('02');
  await expect(page.locator('.knowledge-swipe-hint')).toHaveCount(0);
  const nextBounds=await page.locator('.knowledge-card:not(.knowledge-card-under)').last().boundingBox();
  expect(nextBounds!.y+nextBounds!.height).toBeLessThanOrEqual(height);
 });
}

test('public syllabus shows detailed official content and corrected mark distribution',async({page})=>{
 await page.goto('/ldc-syllabus');
 await expect(page.getByRole('heading',{name:'Detailed LDC syllabus and mark distribution'})).toBeVisible();
 await expect(page.getByText('100',{exact:true}).first()).toBeVisible();
 const source=page.getByRole('link',{name:/Open official Kerala PSC syllabus PDF/});
 await expect(source).toHaveAttribute('href','https://www.keralapsc.gov.in/sites/default/files/2024-01/L%20D%20Clerks.pdf');
 expect(await page.locator('#syllabus-part-I').evaluate((node:any)=>node.open)).toBe(true);
 const governance=page.locator('.ldc-syllabus-topic').filter({hasText:'Kerala: Governance and System of Administration'});
 await expect(governance.locator('.ldc-topic-marks')).toHaveText('5 marks');
 const acts=page.locator('.ldc-syllabus-topic').filter({hasText:'Important Acts'});
 await expect(acts.locator('.ldc-topic-marks')).toHaveText('5 marks');
 await acts.locator('summary').click();
 await expect(acts.getByText('Right to Information',{exact:true})).toBeVisible();
 await expect(acts.getByText('Consumer protection',{exact:true})).toBeVisible();
 await assertNoHorizontalOverflow(page);
});

test('analytics active days include the selected range in Malayalam',async({page})=>{
 await page.goto('/analytics-preview?language=ml');
 await expect(page.locator('.analytics-summary')).toContainText('30 ദിവസത്തിൽ 12 ദിവസം');
 await expect(page.locator('.analytics-summary')).toContainText('412');
 await expect(page.locator('.analytics-summary')).toContainText('3');
});

test('rank estimate changes to a retryable error within ten seconds',async({page})=>{
 await page.route('**/api/rank-estimate**',async route=>{
  await page.waitForTimeout(15_000);
  await route.fulfill({status:503,body:'Unavailable'}).catch(()=>{});
 });
 await page.goto('/analytics-preview?rank=1');
 await expect(page.getByText('The estimate took too long to load. Please retry.')).toBeVisible({timeout:12_000});
 await expect(page.getByRole('button',{name:'Retry'})).toBeVisible();
 await page.unrouteAll({behavior:'ignoreErrors'});
});
