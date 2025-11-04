'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/context-new';
import { PagesList } from "@/components/pages/PagesList";
import PageEditor from '@/components/editor/PageEditor';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  return (
    <div className="flex gap-6">
      <div className="w-80 flex-shrink-0">
        <PagesList 
          selectedSlug={selectedSlug}
          onSelectPage={setSelectedSlug}
        />
      </div>
      <div className="flex-1">
        {selectedSlug ? (
          <PageEditor slug={selectedSlug} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            Select a page from the sidebar to start editing
          </div>
        )}
      </div>
    </div>
  );
}