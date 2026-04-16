import LiveChat from "@/components/LiveChat";

export default function ChatPage() {
  return (
    <div>
      <header className="mb-6">
        <div className="label mb-2">// COMMUNITY</div>
        <h1 className="text-4xl font-bold font-serif">Community Chat</h1>
        <p className="text-muted mt-2">Open 24/7. Talk coins, suggest picks, discuss distributions.</p>
      </header>
      <LiveChat meetingId="general" fullHeight />
    </div>
  );
}
