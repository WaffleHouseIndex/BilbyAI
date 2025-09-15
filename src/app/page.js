import TranscriptPanel from '@/components/TranscriptPanel';

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex items-start justify-center">
      <TranscriptPanel room="agent_demo" />
    </div>
  );
}
