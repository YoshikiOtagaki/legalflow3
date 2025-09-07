'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Party } from '@/types/case'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export function useParties() {
  const { accessToken } = useAuthStore()
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchParties = async () => {
    if (!accessToken) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/parties`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('当事者の取得に失敗しました')
      }

      const data = await response.json()
      setParties(data.parties || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const createParty = async (partyData: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/parties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(partyData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '当事者の作成に失敗しました')
      }

      const newParty = await response.json()
      setParties(prev => [...prev, newParty])
      return newParty
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  const updateParty = async (id: string, partyData: Partial<Omit<Party, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/parties/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(partyData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '当事者の更新に失敗しました')
      }

      const updatedParty = await response.json()
      setParties(prev => prev.map(party => party.id === id ? updatedParty : party))
      return updatedParty
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  const deleteParty = async (id: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${API_BASE_URL}/parties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '当事者の削除に失敗しました')
      }

      setParties(prev => prev.filter(party => party.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      throw err
    }
  }

  useEffect(() => {
    fetchParties()
  }, [accessToken])

  return {
    parties,
    loading,
    error,
    fetchParties,
    createParty,
    updateParty,
    deleteParty,
  }
}
