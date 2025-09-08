import React, { useState, useEffect } from "react";
import { useParties, Party, PartySearchFilter } from "../../hooks/use-parties";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Alert, AlertDescription } from "../ui/Alert";
import {
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building,
  User,
} from "lucide-react";

interface PartyListProps {
  onView?: (party: Party) => void;
  onEdit?: (party: Party) => void;
  onDelete?: (party: Party) => void;
  onCreate?: () => void;
}

export const PartyList: React.FC<PartyListProps> = ({
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const { parties, loading, error, fetchParties, searchParties } = useParties();
  const [searchFilter, setSearchFilter] = useState<PartySearchFilter>({});
  const [searchMode, setSearchMode] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // 初期データ読み込み
  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async (loadMore = false) => {
    try {
      const result = await fetchParties({
        limit: 20,
        nextToken: loadMore ? nextToken : undefined,
      });

      setNextToken(result.nextToken);
      setHasMore(!!result.nextToken);
    } catch (err) {
      console.error("Error loading parties:", err);
    }
  };

  const handleSearch = async () => {
    try {
      setSearchMode(true);
      await searchParties(searchFilter);
    } catch (err) {
      console.error("Error searching parties:", err);
    }
  };

  const handleClearSearch = () => {
    setSearchMode(false);
    setSearchFilter({});
    loadParties();
  };

  const handleLoadMore = () => {
    if (hasMore) {
      loadParties(true);
    }
  };

  const getPartyDisplayName = (party: Party): string => {
    if (party.isCorporation && party.corporateProfile) {
      return party.corporateProfile.companyName;
    } else if (party.individualProfile) {
      return `${party.individualProfile.lastName} ${party.individualProfile.firstName}`;
    }
    return "Unknown Party";
  };

  const getPartySubtitle = (party: Party): string => {
    if (party.isCorporation && party.corporateProfile) {
      return party.corporateProfile.industry || "Corporation";
    } else if (party.individualProfile) {
      return party.individualProfile.occupation || "Individual";
    }
    return "";
  };

  const getPrimaryContact = (party: Party): string => {
    const primaryContact = party.contacts.find((contact) => contact.isPrimary);
    if (primaryContact) {
      if (primaryContact.contact.email) {
        return primaryContact.contact.email;
      } else if (primaryContact.contact.phone) {
        return primaryContact.contact.phone;
      } else if (primaryContact.contact.mobile) {
        return primaryContact.contact.mobile;
      }
    }
    return "No contact info";
  };

  const getPrimaryAddress = (party: Party): string => {
    const primaryAddress = party.addresses.find((address) => address.isPrimary);
    if (primaryAddress) {
      const { address } = primaryAddress;
      return `${address.prefecture}${address.city}${address.address1}`;
    }
    return "No address";
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">当事者管理</h1>
          <p className="text-gray-600">個人・法人の当事者情報を管理します</p>
        </div>
        <Button onClick={onCreate} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* 検索フィルタ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            検索・フィルタ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">種別</label>
              <Select
                value={searchFilter.isCorporation?.toString() || ""}
                onValueChange={(value) =>
                  setSearchFilter((prev) => ({
                    ...prev,
                    isCorporation: value === "" ? undefined : value === "true",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべて</SelectItem>
                  <SelectItem value="false">個人</SelectItem>
                  <SelectItem value="true">法人</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">名前・会社名</label>
              <Input
                placeholder="名前または会社名を入力"
                value={searchFilter.name || ""}
                onChange={(e) =>
                  setSearchFilter((prev) => ({
                    ...prev,
                    name: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input
                placeholder="メールアドレスを入力"
                value={searchFilter.email || ""}
                onChange={(e) =>
                  setSearchFilter((prev) => ({
                    ...prev,
                    email: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">電話番号</label>
              <Input
                placeholder="電話番号を入力"
                value={searchFilter.phone || ""}
                onChange={(e) =>
                  setSearchFilter((prev) => ({
                    ...prev,
                    phone: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  検索中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  検索
                </>
              )}
            </Button>
            {searchMode && (
              <Button variant="outline" onClick={handleClearSearch}>
                クリア
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 当事者一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parties.map((party) => (
          <Card key={party.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {party.isCorporation ? (
                    <Building className="h-5 w-5 text-blue-600" />
                  ) : (
                    <User className="h-5 w-5 text-green-600" />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {getPartyDisplayName(party)}
                    </CardTitle>
                    <CardDescription>{getPartySubtitle(party)}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Badge
                    variant={party.isCorporation ? "default" : "secondary"}
                  >
                    {party.isCorporation ? "法人" : "個人"}
                  </Badge>
                  {party.isFormerClient && (
                    <Badge variant="outline">元クライアント</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium">連絡先:</span>
                  <span className="ml-2">{getPrimaryContact(party)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">住所:</span>
                  <span className="ml-2">{getPrimaryAddress(party)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">作成日:</span>
                  <span className="ml-2">
                    {new Date(party.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView?.(party)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit?.(party)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete?.(party)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ローディング表示 */}
      {loading && parties.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      )}

      {/* データなし表示 */}
      {!loading && parties.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">当事者が見つかりませんでした</p>
          {searchMode && (
            <Button
              variant="outline"
              onClick={handleClearSearch}
              className="mt-2"
            >
              検索をクリア
            </Button>
          )}
        </div>
      )}

      {/* さらに読み込みボタン */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                読み込み中...
              </>
            ) : (
              "さらに読み込み"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
