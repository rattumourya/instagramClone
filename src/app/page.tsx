import { Feed } from '@/components/feed';
import { Header } from '@/components/layout/header';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto max-w-5xl px-4">
        <Feed />
      </div>
    </main>
  );
}
