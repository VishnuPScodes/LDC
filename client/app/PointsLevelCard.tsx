'use client';
export default function PointsLevelCard({stats,language='en'}:{stats:any;language?:'en'|'ml'}){
 if(!stats)return <section className="points-level-card points-level-loading" aria-label={language==='ml'?'പോയിന്റുകൾ ലോഡ് ചെയ്യുന്നു':'Loading points'}><span className="skeleton-line"/><span className="skeleton-line short"/></section>;
 const ml=language==='ml';
 return <section className="points-level-card" aria-label={ml?`ലെവൽ ${stats.level}, ${stats.points} പോയിന്റുകൾ`:`Level ${stats.level}, ${stats.points} points`}>
  <div className="points-level-heading"><span className="level-badge">{ml?'ലെവൽ':'LEVEL'} {stats.level}</span><span className="points-total">{stats.points} {ml?'പോയിന്റുകൾ':'points'}</span></div>
  <div className="points-level-meter" role="progressbar" aria-label={ml?'അടുത്ത ലെവലിലേക്കുള്ള പുരോഗതി':'Progress to next level'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stats.levelProgress)}><span style={{width:`${stats.levelProgress}%`}}/></div>
  <p>{ml?`അടുത്ത ലെവലിന് ${stats.pointsToNextLevel} പോയിന്റുകൾ കൂടി`:`${stats.pointsToNextLevel} pts to next level`}</p>
 </section>;
}
