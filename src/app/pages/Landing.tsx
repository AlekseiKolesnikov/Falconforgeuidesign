export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center text-white">
      <div className="text-center max-w-4xl mx-auto p-8">
        <h1 className="text-6xl font-bold mb-8">Falcon Forge</h1>
        <p className="text-2xl mb-12 opacity-90">Montevallo's Professional Network</p>
        <a href="/login" className="bg-white text-primary px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-gray-100 inline-block">
          Get Started →
        </a>
      </div>
    </div>
  );
}
