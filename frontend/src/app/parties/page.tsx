"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PartyList } from "@/components/parties/party-list";
import { PartyForm } from "@/components/parties/party-form";

export default function PartiesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  const handleCreateParty = () => {
    setEditingPartyId(null);
    setShowCreateForm(true);
  };

  const handleEditParty = (partyId: string) => {
    setEditingPartyId(partyId);
    setShowCreateForm(true);
  };

  const handleSuccess = (partyId: string) => {
    setShowCreateForm(false);
    setEditingPartyId(null);
    // リストを更新するためにページをリロード
    window.location.reload();
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingPartyId(null);
  };

  const handleDeleteParty = (partyId: string) => {
    // 削除後の処理（必要に応じて）
    console.log("Party deleted:", partyId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">当事者管理</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {showCreateForm ? (
              <PartyForm
                partyId={editingPartyId || undefined}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            ) : (
              <PartyList
                onCreateParty={handleCreateParty}
                onEditParty={handleEditParty}
                onDeleteParty={handleDeleteParty}
              />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
