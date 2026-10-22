'use client';

type Topic = { topic: string; marks: number };
type TopicProgress = { topic: string; attempts: number; accuracy: number };

export default function SyllabusPage({ syllabus, progress, onPracticeTopic }: { syllabus: Topic[]; progress: any; onPracticeTopic: (topic: string) => void }) {
  const topicStats: TopicProgress[] = progress?.coverage?.byTopic || [];

  return <section className="syllabus-page">
    <div className="eyebrow">YOUR SYLLABUS</div>
    <h1 className="section-title syllabus-title">Topic map</h1>
    <p className="small syllabus-intro">Build familiarity topic by topic. Mastery appears after at least 10 attempts.</p>
    <div className="topic-map" aria-label="Syllabus topics">
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
    </div>
  </section>;
}
