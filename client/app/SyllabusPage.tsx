'use client';

type Topic = { topic: string; marks: number };
type TopicProgress = { topic: string; attempts: number; accuracy: number };

export default function SyllabusPage({ syllabus, progress, loading=false, error='', onRetry, onPracticeTopic }: { syllabus: Topic[]; progress: any; loading?:boolean; error?:string; onRetry?:()=>void; onPracticeTopic: (topic: string) => void }) {
  const topicStats: TopicProgress[] = progress?.coverage?.byTopic || [];

  return <section className="syllabus-page">
    <div className="eyebrow">YOUR SYLLABUS</div>
    <h1 className="section-title syllabus-title">Topic map</h1>
    <p className="small syllabus-intro">Build familiarity topic by topic. Mastery appears after at least 10 attempts.</p>
    {loading&&<div className="topic-map-skeleton" role="status" aria-label="Loading syllabus">{Array.from({length:8},(_,i)=><span key={i}/>)}</div>}
    {!loading&&error&&<div className="page-load-error" role="alert"><p>Couldn’t load topics.</p><button type="button" className="secondary-button" onClick={onRetry}>Retry</button></div>}
    {!loading&&!error&&syllabus.length===0&&<div className="page-empty-state">No syllabus topics are available right now.</div>}
    {!loading&&!error&&syllabus.length>0&&<div className="topic-map" aria-label="Syllabus topics">
      {syllabus.map(topic => {
        const stats = topicStats.find(row => row.topic === topic.topic);
        const attempts = stats?.attempts || 0;
        const accuracy = Math.round(stats?.accuracy || 0);
        const level = attempts < 10 ? 'Not enough data yet' : accuracy >= 80 ? 'Strong' : accuracy >= 60 ? 'Practising' : 'Beginner';
        return <button className="topic-card" key={topic.topic} type="button" onClick={() => onPracticeTopic(topic.topic)}>
          <span className="topic-card-top"><strong>{topic.topic}</strong><span>{topic.marks} marks</span></span>
          <span className="topic-meter" aria-label={attempts < 10 ? 'Mastery not yet measured' : `${accuracy}% mastery`}><span style={{ width: `${attempts < 10 ? 0 : accuracy}%` }}/></span>
          <span className="topic-card-bottom"><span>{level}</span><span>{attempts} attempts</span></span>
        </button>;
      })}
    </div>}
  </section>;
}
