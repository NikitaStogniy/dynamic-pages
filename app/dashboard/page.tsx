'use client';

import { useState } from 'react';
import { PagesList } from "@/components/pages/PagesList";
import PageEditor from '@/components/editor/PageEditor';

export default function Dashboard() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* PagesList - Full width on mobile, fixed width on desktop */}
      <div className="w-full md:w-80 md:flex-shrink-0">
        <PagesList
          selectedSlug={selectedSlug}
          onSelectPage={setSelectedSlug}
        />
      </div>

      {/* PageEditor - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex md:flex-1">
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