'use client';

import { useUser } from '@clerk/clerk-react';
import { AlertCircle } from 'lucide-react';
import DocumentManager from '../../src/components/DocumentManager.jsx';

export default function DocumentsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="animate-pulse p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Please sign in to view your documents.</p>
      </div>
    );
  }

  return <DocumentManager userId={user.id} />;
}