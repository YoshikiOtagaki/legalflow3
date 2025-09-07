"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CaseList } from "@/components/cases/case-list";
import { CaseDetail } from "@/components/cases/case-detail";

export default function CasesPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const handleBackToList = () => {
    setSelectedCaseId(null);
  };

  const handleCreateCase = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">ケース管理</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {selectedCaseId ? (
              <CaseDetail
                caseId={selectedCaseId}
                onBack={handleBackToList}
                onEdit={() => {
                  // TODO: 編集フォームを開く
                  console.log("Edit case:", selectedCaseId);
                }}
              />
            ) : (
              <CaseList
                onCaseSelect={handleCaseSelect}
                onCreateCase={handleCreateCase}
              />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
