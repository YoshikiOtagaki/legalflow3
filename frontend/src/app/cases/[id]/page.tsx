"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CaseDetail } from "@/components/cases/case-detail";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const handleBack = () => {
    window.history.back();
  };

  const handleEdit = () => {
    // TODO: 編集フォームを開く
    console.log("Edit case:", caseId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">ケース詳細</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <CaseDetail
              caseId={caseId}
              onBack={handleBack}
              onEdit={handleEdit}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
