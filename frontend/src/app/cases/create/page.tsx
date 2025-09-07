'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CaseCreateForm } from '@/components/cases/case-create-form';

export default function CaseCreatePage() {
  const router = useRouter();

  const handleSuccess = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  const handleCancel = () => {
    router.push('/cases');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">ケース作成</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <CaseCreateForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
