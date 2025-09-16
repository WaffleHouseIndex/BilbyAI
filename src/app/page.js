import TranscriptPanel from '@/components/TranscriptPanel';
import DialPad from '@/components/DialPad';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <DialPad userId="demo" />
        <TranscriptPanel room="agent_demo" />
      </div>
    </div>
  );
}
