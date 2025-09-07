"use client";

import { useState } from "react";
import { useParties } from "@/hooks/use-parties";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface PartyListProps {
  onPartySelect?: (partyId: string) => void;
  onCreateParty?: () => void;
  onEditParty?: (partyId: string) => void;
  onDeleteParty?: (partyId: string) => void;
}

export function PartyList({
  onPartySelect,
  onCreateParty,
  onEditParty,
  onDeleteParty,
}: PartyListProps) {
  const { parties, loading, error, deleteParty } = useParties();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "Individual" | "Corporate"
  >("all");

  const filteredParties = parties.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.phone?.includes(searchTerm);
    const matchesType = filterType === "all" || party.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (partyId: string) => {
    if (window.confirm("この当事者を削除しますか？")) {
      try {
        await deleteParty(partyId);
        onDeleteParty?.(partyId);
      } catch (error) {
        console.error("削除エラー:", error);
        alert("削除に失敗しました");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">当事者一覧</h2>
        <Button onClick={onCreateParty} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新しい当事者
        </Button>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="名前、メール、電話番号で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">タイプ</label>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  すべて
                </Button>
                <Button
                  variant={filterType === "Individual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("Individual")}
                >
                  個人
                </Button>
                <Button
                  variant={filterType === "Corporate" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("Corporate")}
                >
                  法人
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 当事者一覧 */}
      <div className="grid gap-4">
        {filteredParties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">当事者が見つかりませんでした</p>
              <Button onClick={onCreateParty}>新しい当事者を作成</Button>
            </CardContent>
          </Card>
        ) : (
          filteredParties.map((party) => (
            <Card key={party.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {party.type === "Individual" ? (
                        <User className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Building className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{party.name}</CardTitle>
                      <CardDescription>
                        {party.type === "Individual" ? "個人" : "法人"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {party.type === "Individual" ? "個人" : "法人"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPartySelect?.(party.id)}
                    >
                      詳細
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditParty?.(party.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(party.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {party.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {party.email}
                      </span>
                    </div>
                  )}
                  {party.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {party.phone}
                      </span>
                    </div>
                  )}
                  {party.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {party.address}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  作成日:{" "}
                  {new Date(party.createdAt).toLocaleDateString("ja-JP")}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
