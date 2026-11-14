// Builds the Knowledge card files the app loads, from the editable sources in content/knowledge/.
//
//   content/knowledge/topics.json      topic order: [{slug, topic}]
//   content/knowledge/<slug>.json      {topic, cards:[{id,title,body,memo,source,url}]}
//
// Output (committed, so any build command serves it):
//   public/knowledge/index.json        the reading rotation: blocks of ~10 same-topic cards, card ids only
//   public/knowledge/b-<hash>.json     one block's cards; the name changes whenever its content does
//
// Each card keeps a permanent id (k0001…). A new card may leave out "id"; this script gives it the next free
// one and writes it back to the source file. Never reuse or renumber ids: readers' saved places point at them.
//
// Run: node scripts/build-knowledge.mjs          (also runs before `next build`/`next dev`)
//      node scripts/build-knowledge.mjs --check  (exit 1 if public/knowledge is out of date)
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const src=join(root,'content/knowledge'),out=join(root,'public/knowledge');
const check=process.argv.includes('--check');
const BLOCK=10;
const fail=message=>{console.error(`build-knowledge: ${message}`);process.exit(1)};

const topics=JSON.parse(readFileSync(join(src,'topics.json'),'utf8'));
const sources=topics.map(({slug,topic})=>{const file=join(src,`${slug}.json`);const data=JSON.parse(readFileSync(file,'utf8'));if(data.topic!==topic)fail(`${slug}.json topic "${data.topic}" ≠ topics.json "${topic}"`);return {slug,topic,file,data}});

// Ids: validate, then fill in any missing ones.
const seen=new Set();let maxId=0;
for(const {slug,data} of sources)for(const card of data.cards){
 for(const field of ['title','body','source','url'])if(typeof card[field]!=='string'||!card[field].trim())fail(`${slug}: card ${card.id||card.title} has no ${field}`);
 if(card.id===undefined)continue;
 if(!/^k\d{4,}$/.test(card.id))fail(`${slug}: bad id "${card.id}"`);
 if(seen.has(card.id))fail(`duplicate id ${card.id}`);
 seen.add(card.id);maxId=Math.max(maxId,Number(card.id.slice(1)));
}
for(const source of sources){
 let changed=false;
 source.data.cards=source.data.cards.map(card=>{if(card.id!==undefined)return card;if(check)fail(`${source.slug}: a card has no id`);changed=true;return {id:`k${String(++maxId).padStart(4,'0')}`,...card}});
 if(changed){writeFileSync(source.file,JSON.stringify(source.data,null,1)+'\n');console.log(`build-knowledge: gave new ids in ${source.slug}.json`)}
}

// Split each topic into evenly sized blocks of about ten cards (8–13), so a day's reading stays on one topic.
const blocks=[];
for(const {slug,topic,data} of sources){
 const cards=data.cards,count=Math.max(1,Math.round(cards.length/BLOCK));
 for(let i=0,start=0;i<count;i++){const end=Math.round(cards.length*(i+1)/count);blocks.push({slug,topic,index:i,count,cards:cards.slice(start,end)});start=end}
}
// Spread every topic evenly across the rotation (by each block's fractional position within its topic), then
// make sure no two neighbouring blocks — including last→first — share a topic.
blocks.sort((a,b)=>(a.index+.5)/a.count-(b.index+.5)/b.count||topics.findIndex(t=>t.slug===a.slug)-topics.findIndex(t=>t.slug===b.slug));
const clash=i=>blocks[i].slug===blocks[(i+1)%blocks.length].slug;
for(let pass=0;pass<blocks.length;pass++){
 const i=blocks.findIndex((_,k)=>clash(k));if(i<0)break;
 const j=blocks.findIndex((b,k)=>k!==i+1&&b.slug!==blocks[i].slug&&blocks[(k+blocks.length-1)%blocks.length].slug!==blocks[(i+1)%blocks.length].slug&&blocks[(k+1)%blocks.length].slug!==blocks[(i+1)%blocks.length].slug);
 if(j<0)break;const moved=blocks.splice((i+1)%blocks.length,1)[0];blocks.splice(j>(i+1)%blocks.length?j-1:j,0,moved);
}
if(blocks.length>1&&blocks.some((_,i)=>clash(i)))console.warn('build-knowledge: warning: two neighbouring blocks share a topic (one topic dominates)');

const files=new Map();
const index={total:0,blocks:blocks.map(block=>{
 const body=JSON.stringify(block.cards.map(({id,title,body,memo,source,url})=>({id,topic:block.topic,title,body,...(memo?{memo}:{}),source,url})));
 const file=`b-${createHash('sha256').update(body).digest('hex').slice(0,10)}.json`;files.set(file,body);
 return {id:`${block.slug}-${block.index+1}`,topic:block.topic,file,cards:block.cards.map(card=>card.id)};
})};
index.total=index.blocks.reduce((sum,block)=>sum+block.cards.length,0);
files.set('index.json',JSON.stringify(index));

const existing=existsSync(out)?readdirSync(out).filter(name=>name.endsWith('.json')):[];
const stale=existing.filter(name=>!files.has(name)),differ=[...files].filter(([name,body])=>!existing.includes(name)||readFileSync(join(out,name),'utf8')!==body).map(([name])=>name);
if(check){if(stale.length||differ.length)fail(`public/knowledge is out of date (${[...differ,...stale].join(', ')}); run node scripts/build-knowledge.mjs`);console.log('build-knowledge: up to date');process.exit(0)}
mkdirSync(out,{recursive:true});
for(const name of stale)rmSync(join(out,name));
for(const name of differ)writeFileSync(join(out,name),files.get(name));
console.log(`build-knowledge: ${index.total} cards in ${index.blocks.length} blocks (${differ.length} written, ${stale.length} removed)`);
