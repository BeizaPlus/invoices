'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after a brief moment
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Invoice Generator
          </h1>
          <p className="text-lg text-gray-600">
            Professional invoice generation with API support
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    </div>
  );
}
