'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DocumentList } from '@/components/documents/document-list'

export default function DocumentsPage() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId)
    // TODO: ドキュメント詳細ページに遷移
    console.log('Document selected:', documentId)
  }

  const handleCreateDocument = () => {
    // TODO: ドキュメント作成ページに遷移
    console.log('Create document')
  }

  const handleUploadDocument = () => {
    // TODO: ドキュメントアップロード機能
    console.log('Upload document')
  }

  const handleGenerateDocument = () => {
    // TODO: ドキュメント生成ページに遷移
    console.log('Generate document')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">ドキュメント管理</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DocumentList
              onDocumentSelect={handleDocumentSelect}
              onCreateDocument={handleCreateDocument}
              onUploadDocument={handleUploadDocument}
              onGenerateDocument={handleGenerateDocument}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
