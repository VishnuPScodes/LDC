'use client';
import {useCallback,useEffect,useState} from 'react';
import {Area,AreaChart,Bar,BarChart,CartesianGrid,Legend,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';

type Overview={
 rangeDays:number;
 users:{total:number;newToday:number;new7d:number;new30d:number;weekOverWeekPct:number|null;activated:number};
 active:{today:number;last7d:number;inRange:number};
 practice:{sessions:number;completed:number;answers:number};
 suggestions:{total:number};
 series:{date:string;signups:number;totalUsers:number;activeUsers:number}[];
 recentUsers:{id:string;name:string;email:string;joinedAt:string}[];
};
type Suggestion={id:string;message:string;createdAt:string;user:{name:string;email:string}|null};

async function call(path:string,body?:unknown){
 const response=await fetch(`/api/admin${path}`,{method:body?'POST':'GET',credentials:'include',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error:any=new Error(data.error||'Something went wrong.');error.status=response.status;throw error}
 return data;
}
const num=(value:number)=>value.toLocaleString('en-IN');
const shortDate=(key:string)=>new Date(`${key}T12:00:00+05:30`).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const when=(iso:string)=>new Date(iso).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'});

export default function AdminDashboard(){
 const [state,setState]=useState<'checking'|'login'|'ready'>('checking');
 useEffect(()=>{try{if(localStorage.getItem('ldc-theme')==='dark')document.documentElement.dataset.themeChoice='dark'}catch{}call('/me').then(()=>setState('ready')).catch(()=>setState('login'))},[]);
 if(state==='checking')return <main className="admin-shell"><p className="small" role="status">Checking admin access…</p></main>;
 if(state==='login')return <AdminLogin onDone={()=>setState('ready')}/>;
 return <Dashboard onSignedOut={()=>setState('login')}/>;
}

function AdminLogin({onDone}:{onDone:()=>void}){
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <main className="admin-shell admin-login">
  <form className="card admin-login-card" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');try{await call('/login',{username,password});onDone()}catch(e:any){setError(e.message)}finally{setBusy(false)}}}>
   <div className="eyebrow">LDC PRACTICE</div>
   <h1 className="section-title">Admin sign-in</h1>
   <label className="field">Email or username<input autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={e=>setUsername(e.target.value)}/></label>
   <label className="field">Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
   {error&&<p className="admin-error" role="alert">{error}</p>}
   <button className="button admin-wide" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  </form>
 </main>;
}

function Dashboard({onSignedOut}:{onSignedOut:()=>void}){
 const [range,setRange]=useState(30),[data,setData]=useState<Overview|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [chart,setChart]=useState<'total'|'daily'>('total');
 const load=useCallback(async(days:number)=>{setLoading(true);setError('');try{setData(await call(`/overview?range=${days}`))}catch(e:any){if(e.status===401)onSignedOut();else setError(e.message)}finally{setLoading(false)}},[onSignedOut]);
 useEffect(()=>{load(range)},[range,load]);
 const signOut=async()=>{await call('/logout',{}).catch(()=>{});onSignedOut()};
 const u=data?.users,activationPct=u&&u.total?Math.round(u.activated/u.total*100):0;
 const series=(data?.series||[]).map(row=>({...row,label:shortDate(row.date)}));
 return <main className="admin-shell">
  <header className="admin-header">
   <div><div className="eyebrow">ADMIN</div><h1 className="section-title">Platform overview</h1></div>
   <button type="button" className="ghost admin-signout" onClick={signOut}>Sign out</button>
  </header>
  <div className="progress-range admin-range" role="group" aria-label="Time range">{[7,30,90].map(days=><button key={days} type="button" aria-pressed={range===days} className={range===days?'selected':''} onClick={()=>setRange(days)}>{days} days</button>)}</div>
  {error&&<div className="page-load-error" role="alert"><p>{error}</p><button type="button" className="secondary-button" onClick={()=>load(range)}>Retry</button></div>}
  {!data&&loading&&<p className="small" role="status">Loading stats…</p>}
  {data&&u&&<>
   <section className={`admin-kpis${loading?' admin-loading':''}`} aria-label="Key numbers">
    <article className="admin-kpi admin-kpi-hero"><span>Total users</span><strong>{num(u.total)}</strong><small>+{num(u.new7d)} this week{u.weekOverWeekPct!==null&&<> · <em className={u.weekOverWeekPct>=0?'up':'down'}>{u.weekOverWeekPct>=0?'▲':'▼'} {Math.abs(u.weekOverWeekPct)}% vs last week</em></>}</small></article>
    <article className="admin-kpi"><span>New today</span><strong>{num(u.newToday)}</strong><small>{num(u.new30d)} in 30 days</small></article>
    <article className="admin-kpi"><span>Active today</span><strong>{num(data.active.today)}</strong><small>{num(data.active.last7d)} in 7 days</small></article>
    <article className="admin-kpi"><span>Active in {data.rangeDays} days</span><strong>{num(data.active.inRange)}</strong><small>{u.total?Math.round(data.active.inRange/u.total*100):0}% of users</small></article>
    <article className="admin-kpi"><span>Finished a session</span><strong>{num(u.activated)}</strong><small>{activationPct}% of users</small></article>
    <article className="admin-kpi"><span>Questions answered</span><strong>{num(data.practice.answers)}</strong><small>{num(data.practice.completed)} sessions done</small></article>
    <article className="admin-kpi"><span>Suggestions</span><strong>{num(data.suggestions.total)}</strong><small><a href="#suggestions">Read them ↓</a></small></article>
   </section>

   <section className="card admin-card" aria-labelledby="growth-title">
    <div className="admin-card-head"><h2 id="growth-title">Growth</h2>
     <div className="admin-tabs" role="tablist" aria-label="Growth chart">
      <button type="button" role="tab" aria-selected={chart==='total'} className={chart==='total'?'selected':''} onClick={()=>setChart('total')}>Total users</button>
      <button type="button" role="tab" aria-selected={chart==='daily'} className={chart==='daily'?'selected':''} onClick={()=>setChart('daily')}>Daily</button>
     </div>
    </div>
    <div className="admin-chart">
     <ResponsiveContainer width="100%" height="100%">
      {chart==='total'
       ?<AreaChart data={series} margin={{top:8,right:8,left:-12,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false}/><XAxis dataKey="label" stroke="var(--muted)" tick={{fontSize:12}} minTickGap={24}/><YAxis stroke="var(--muted)" tick={{fontSize:12}} allowDecimals={false} width={44} domain={['dataMin','auto']}/><Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:10}}/><Area type="monotone" dataKey="totalUsers" name="Total users" stroke="var(--green)" fill="var(--green-soft)" strokeWidth={2.5}/></AreaChart>
       :<BarChart data={series} margin={{top:8,right:8,left:-12,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false}/><XAxis dataKey="label" stroke="var(--muted)" tick={{fontSize:12}} minTickGap={24}/><YAxis stroke="var(--muted)" tick={{fontSize:12}} allowDecimals={false} width={44}/><Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:10}}/><Legend wrapperStyle={{fontSize:13}}/><Bar dataKey="signups" name="New sign-ups" fill="var(--green)" radius={[4,4,0,0]}/><Bar dataKey="activeUsers" name="Active learners" fill="var(--amber)" radius={[4,4,0,0]}/></BarChart>}
     </ResponsiveContainer>
    </div>
    {chart==='daily'&&<p className="small">Active learners practised a session or read Knowledge cards that day (IST).</p>}
   </section>

   <Suggestions total={data.suggestions.total} onUnauthorized={onSignedOut}/>

   <details className="card admin-card admin-recent">
    <summary><h2>Newest users</h2><span className="small">Last {data.recentUsers.length}</span></summary>
    <ul className="admin-list">{data.recentUsers.map(user=><li key={user.id}><div><strong>{user.name}</strong><span className="small admin-email">{user.email}</span></div><time className="small" dateTime={user.joinedAt}>{when(user.joinedAt)}</time></li>)}</ul>
   </details>
  </>}
 </main>;
}

function Suggestions({total,onUnauthorized}:{total:number;onUnauthorized:()=>void}){
 const [items,setItems]=useState<Suggestion[]>([]),[hasMore,setHasMore]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const load=useCallback(async(before?:string)=>{setBusy(true);setError('');try{const data=await call(`/suggestions${before?`?before=${encodeURIComponent(before)}`:''}`);setItems(current=>before?[...current,...data.items]:data.items);setHasMore(data.hasMore)}catch(e:any){if(e.status===401)onUnauthorized();else setError(e.message)}finally{setBusy(false)}},[onUnauthorized]);
 useEffect(()=>{load()},[load]);
 return <section id="suggestions" className="card admin-card" aria-labelledby="suggestions-title">
  <div className="admin-card-head"><h2 id="suggestions-title">Suggestions</h2><span className="small">{num(total)} total</span></div>
  {error&&<p className="admin-error" role="alert">{error}</p>}
  {!busy&&!error&&items.length===0&&<p className="small">No suggestions yet. Learners can send them from the Feedback page.</p>}
  <ul className="admin-suggestions">{items.map(item=><li key={item.id}>
   <p className="admin-message">{item.message}</p>
   <div className="admin-meta small"><span>{item.user?<>{item.user.name} · <span className="admin-email">{item.user.email}</span></>:'Deleted user'}</span><time dateTime={item.createdAt}>{when(item.createdAt)}</time></div>
  </li>)}</ul>
  {busy&&<p className="small" role="status">Loading suggestions…</p>}
  {hasMore&&!busy&&<button type="button" className="secondary-button admin-wide" onClick={()=>load(items[items.length-1]?.createdAt)}>Load older suggestions</button>}
 </section>;
}
