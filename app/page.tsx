import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold text-yellow-500 mb-4 tracking-tighter">INTEGRA</h1>
      <p className="text-xl text-gray-400 mb-8">Il tuo ecosistema di business.</p>
      
      <Link 
        href="/login" 
        className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition"
      >
        Entra nella Piattaforma
      </Link>
    </main>
  );
}