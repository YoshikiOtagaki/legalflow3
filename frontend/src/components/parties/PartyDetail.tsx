import React from "react";
import { Party } from "../../hooks/use-parties";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Building,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";

interface PartyDetailProps {
  party: Party;
  onEdit?: (party: Party) => void;
  onDelete?: (party: Party) => void;
  onBack?: () => void;
}

export const PartyDetail: React.FC<PartyDetailProps> = ({
  party,
  onEdit,
  onDelete,
  onBack,
}) => {
  const getPartyDisplayName = (): string => {
    if (party.isCorporation && party.corporateProfile) {
      return party.corporateProfile.companyName;
    } else if (party.individualProfile) {
      return `${party.individualProfile.lastName} ${party.individualProfile.firstName}`;
    }
    return "Unknown Party";
  };

  const getPartySubtitle = (): string => {
    if (party.isCorporation && party.corporateProfile) {
      return party.corporateProfile.industry || "Corporation";
    } else if (party.individualProfile) {
      return party.individualProfile.occupation || "Individual";
    }
    return "";
  };

  const getPrimaryContact = () => {
    const primaryContact = party.contacts.find((contact) => contact.isPrimary);
    if (primaryContact) {
      if (primaryContact.contact.email) {
        return { type: "email", value: primaryContact.contact.email };
      } else if (primaryContact.contact.phone) {
        return { type: "phone", value: primaryContact.contact.phone };
      } else if (primaryContact.contact.mobile) {
        return { type: "mobile", value: primaryContact.contact.mobile };
      }
    }
    return null;
  };

  const getPrimaryAddress = () => {
    const primaryAddress = party.addresses.find((address) => address.isPrimary);
    if (primaryAddress) {
      const { address } = primaryAddress;
      return `${address.prefecture}${address.city}${address.address1}${address.address2 ? ` ${address.address2}` : ""}`;
    }
    return null;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← 戻る
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              {party.isCorporation ? (
                <Building className="mr-2 h-6 w-6 text-blue-600" />
              ) : (
                <User className="mr-2 h-6 w-6 text-green-600" />
              )}
              {getPartyDisplayName()}
            </h1>
            <p className="text-gray-600">{getPartySubtitle()}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Badge variant={party.isCorporation ? "default" : "secondary"}>
            {party.isCorporation ? "法人" : "個人"}
          </Badge>
          {party.isFormerClient && (
            <Badge variant="outline">元クライアント</Badge>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex space-x-2">
        {onEdit && (
          <Button onClick={() => onEdit(party)}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" onClick={() => onDelete(party)}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        )}
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {party.isCorporation && party.corporateProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  会社名
                </label>
                <p className="text-lg">{party.corporateProfile.companyName}</p>
              </div>

              {party.corporateProfile.companyNameKana && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    会社名（カナ）
                  </label>
                  <p className="text-lg">
                    {party.corporateProfile.companyNameKana}
                  </p>
                </div>
              )}

              {party.corporateProfile.representativeName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    代表者名
                  </label>
                  <p className="text-lg">
                    {party.corporateProfile.representativeName}
                  </p>
                </div>
              )}

              {party.corporateProfile.establishmentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    設立日
                  </label>
                  <p className="text-lg">
                    {formatDate(party.corporateProfile.establishmentDate)}
                  </p>
                </div>
              )}

              {party.corporateProfile.capital && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    資本金
                  </label>
                  <p className="text-lg">
                    {formatCurrency(party.corporateProfile.capital)}
                  </p>
                </div>
              )}

              {party.corporateProfile.employees && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    従業員数
                  </label>
                  <p className="text-lg">
                    {party.corporateProfile.employees}名
                  </p>
                </div>
              )}

              {party.corporateProfile.industry && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    業界
                  </label>
                  <p className="text-lg">{party.corporateProfile.industry}</p>
                </div>
              )}

              {party.corporateProfile.businessDescription && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    事業内容
                  </label>
                  <p className="text-lg">
                    {party.corporateProfile.businessDescription}
                  </p>
                </div>
              )}
            </div>
          ) : party.individualProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  名前
                </label>
                <p className="text-lg">
                  {party.individualProfile.lastName}{" "}
                  {party.individualProfile.firstName}
                </p>
              </div>

              {(party.individualProfile.firstNameKana ||
                party.individualProfile.lastNameKana) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    名前（カナ）
                  </label>
                  <p className="text-lg">
                    {party.individualProfile.lastNameKana}{" "}
                    {party.individualProfile.firstNameKana}
                  </p>
                </div>
              )}

              {party.individualProfile.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    生年月日
                  </label>
                  <p className="text-lg">
                    {formatDate(party.individualProfile.dateOfBirth)}
                  </p>
                </div>
              )}

              {party.individualProfile.gender &&
                party.individualProfile.gender !== "UNKNOWN" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      性別
                    </label>
                    <p className="text-lg">
                      {party.individualProfile.gender === "MALE"
                        ? "男性"
                        : party.individualProfile.gender === "FEMALE"
                          ? "女性"
                          : party.individualProfile.gender === "OTHER"
                            ? "その他"
                            : "不明"}
                    </p>
                  </div>
                )}

              {party.individualProfile.nationality &&
                party.individualProfile.nationality !== "JP" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      国籍
                    </label>
                    <p className="text-lg">
                      {party.individualProfile.nationality === "US"
                        ? "アメリカ"
                        : party.individualProfile.nationality === "CN"
                          ? "中国"
                          : party.individualProfile.nationality === "KR"
                            ? "韓国"
                            : party.individualProfile.nationality === "OTHER"
                              ? "その他"
                              : "日本"}
                    </p>
                  </div>
                )}

              {party.individualProfile.occupation && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    職業
                  </label>
                  <p className="text-lg">
                    {party.individualProfile.occupation}
                  </p>
                </div>
              )}

              {party.individualProfile.maritalStatus &&
                party.individualProfile.maritalStatus !== "UNKNOWN" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      婚姻状況
                    </label>
                    <p className="text-lg">
                      {party.individualProfile.maritalStatus === "SINGLE"
                        ? "未婚"
                        : party.individualProfile.maritalStatus === "MARRIED"
                          ? "既婚"
                          : party.individualProfile.maritalStatus === "DIVORCED"
                            ? "離婚"
                            : party.individualProfile.maritalStatus ===
                                "WIDOWED"
                              ? "死別"
                              : "不明"}
                    </p>
                  </div>
                )}

              {party.individualProfile.spouseName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    配偶者名
                  </label>
                  <p className="text-lg">
                    {party.individualProfile.spouseName}
                  </p>
                </div>
              )}

              {party.individualProfile.children &&
                party.individualProfile.children.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">
                      子供
                    </label>
                    <div className="space-y-1">
                      {party.individualProfile.children.map((child, index) => (
                        <p key={index} className="text-lg">
                          {child.name}
                          {child.dateOfBirth &&
                            ` (${formatDate(child.dateOfBirth)})`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 連絡先情報 */}
      {party.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              連絡先情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {party.contacts.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {contact.contactType === "PHONE"
                        ? "電話"
                        : contact.contactType === "MOBILE"
                          ? "携帯電話"
                          : contact.contactType === "EMAIL"
                            ? "メール"
                            : contact.contactType === "FAX"
                              ? "FAX"
                              : contact.contactType === "WEBSITE"
                                ? "ウェブサイト"
                                : "その他"}
                    </h4>
                    {contact.isPrimary && (
                      <Badge variant="outline">主連絡先</Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {contact.contact.phone && (
                      <p className="text-sm text-gray-600">
                        <Phone className="inline h-4 w-4 mr-1" />
                        {contact.contact.phone}
                      </p>
                    )}
                    {contact.contact.mobile && (
                      <p className="text-sm text-gray-600">
                        <Phone className="inline h-4 w-4 mr-1" />
                        {contact.contact.mobile}
                      </p>
                    )}
                    {contact.contact.email && (
                      <p className="text-sm text-gray-600">
                        <Mail className="inline h-4 w-4 mr-1" />
                        {contact.contact.email}
                      </p>
                    )}
                    {contact.contact.fax && (
                      <p className="text-sm text-gray-600">
                        <Phone className="inline h-4 w-4 mr-1" />
                        FAX: {contact.contact.fax}
                      </p>
                    )}
                    {contact.contact.website && (
                      <p className="text-sm text-gray-600">
                        <a
                          href={contact.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {contact.contact.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 住所情報 */}
      {party.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              住所情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {party.addresses.map((address, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {address.addressType === "HOME"
                        ? "自宅"
                        : address.addressType === "WORK"
                          ? "勤務先"
                          : address.addressType === "MAILING"
                            ? "郵送先"
                            : address.addressType === "REGISTERED"
                              ? "登記簿"
                              : "その他"}
                    </h4>
                    {address.isPrimary && (
                      <Badge variant="outline">主住所</Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {address.address.postalCode && (
                      <p className="text-sm text-gray-600">
                        〒{address.address.postalCode}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {address.address.prefecture}
                      {address.address.city}
                      {address.address.address1}
                      {address.address.address2 &&
                        ` ${address.address.address2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.address.country}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 関連ケース */}
      {party.cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              関連ケース
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {party.cases.map((caseParty, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">ケース {caseParty.caseId}</h4>
                      <p className="text-sm text-gray-600">
                        役割:{" "}
                        {caseParty.partyRole === "PLAINTIFF"
                          ? "原告"
                          : caseParty.partyRole === "DEFENDANT"
                            ? "被告"
                            : caseParty.partyRole === "THIRD_PARTY"
                              ? "第三者"
                              : caseParty.partyRole === "WITNESS"
                                ? "証人"
                                : caseParty.partyRole === "EXPERT"
                                  ? "専門家"
                                  : "その他"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        割り当て日: {formatDate(caseParty.assignedAt)}
                      </p>
                      {caseParty.isPrimary && (
                        <Badge variant="outline">主当事者</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* メタ情報 */}
      <Card>
        <CardHeader>
          <CardTitle>メタ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">作成日</label>
              <p>{formatDate(party.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">更新日</label>
              <p>{formatDate(party.updatedAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">作成者</label>
              <p>{party.createdBy}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">更新者</label>
              <p>{party.updatedBy}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
