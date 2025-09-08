import React, { useState, useEffect } from "react";
import {
  Party,
  IndividualProfile,
  CorporateProfile,
  Address,
  Contact,
} from "../../hooks/use-parties";
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
import { Alert, AlertDescription } from "../ui/Alert";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

interface PartyFormProps {
  party?: Party;
  onSubmit: (data: PartyFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface PartyFormData {
  isCorporation: boolean;
  isFormerClient: boolean;
  individualProfile?: IndividualProfile;
  corporateProfile?: CorporateProfile;
  addresses: Address[];
  contacts: Contact[];
}

export const PartyForm: React.FC<PartyFormProps> = ({
  party,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<PartyFormData>({
    isCorporation: false,
    isFormerClient: false,
    individualProfile: {
      firstName: "",
      lastName: "",
      firstNameKana: "",
      lastNameKana: "",
      dateOfBirth: "",
      gender: "UNKNOWN",
      nationality: "JP",
      occupation: "",
      maritalStatus: "UNKNOWN",
      spouseName: "",
      children: [],
    },
    corporateProfile: {
      companyName: "",
      companyNameKana: "",
      representativeName: "",
      establishmentDate: "",
      capital: 0,
      employees: 0,
      industry: "",
      businessDescription: "",
      registrationNumber: "",
      taxId: "",
    },
    addresses: [],
    contacts: [],
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (party) {
      setFormData({
        isCorporation: party.isCorporation,
        isFormerClient: party.isFormerClient,
        individualProfile: party.individualProfile || {
          firstName: "",
          lastName: "",
          firstNameKana: "",
          lastNameKana: "",
          dateOfBirth: "",
          gender: "UNKNOWN",
          nationality: "JP",
          occupation: "",
          maritalStatus: "UNKNOWN",
          spouseName: "",
          children: [],
        },
        corporateProfile: party.corporateProfile || {
          companyName: "",
          companyNameKana: "",
          representativeName: "",
          establishmentDate: "",
          capital: 0,
          employees: 0,
          industry: "",
          businessDescription: "",
          registrationNumber: "",
          taxId: "",
        },
        addresses: party.addresses.map((addr) => addr.address),
        contacts: party.contacts.map((contact) => contact.contact),
      });
    }
  }, [party]);

  const handleInputChange = (path: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split(".");
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // バリデーションエラーをクリア
    if (validationErrors[path]) {
      setValidationErrors((prev) => ({
        ...prev,
        [path]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.isCorporation) {
      if (!formData.corporateProfile?.companyName) {
        errors["corporateProfile.companyName"] = "会社名は必須です";
      }
    } else {
      if (!formData.individualProfile?.firstName) {
        errors["individualProfile.firstName"] = "名前は必須です";
      }
      if (!formData.individualProfile?.lastName) {
        errors["individualProfile.lastName"] = "姓は必須です";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          postalCode: "",
          prefecture: "",
          city: "",
          address1: "",
          address2: "",
          country: "JP",
          isValid: true,
        },
      ],
    }));
  };

  const removeAddress = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          phone: "",
          mobile: "",
          email: "",
          fax: "",
          website: "",
          isValid: true,
        },
      ],
    }));
  };

  const removeContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">種別 *</label>
              <Select
                value={formData.isCorporation.toString()}
                onValueChange={(value) =>
                  handleInputChange("isCorporation", value === "true")
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">個人</SelectItem>
                  <SelectItem value="true">法人</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">元クライアント</label>
              <Select
                value={formData.isFormerClient.toString()}
                onValueChange={(value) =>
                  handleInputChange("isFormerClient", value === "true")
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">いいえ</SelectItem>
                  <SelectItem value="true">はい</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 個人情報 */}
      {!formData.isCorporation && (
        <Card>
          <CardHeader>
            <CardTitle>個人情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">名前 *</label>
                <Input
                  value={formData.individualProfile?.firstName || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "individualProfile.firstName",
                      e.target.value,
                    )
                  }
                  placeholder="太郎"
                  className={
                    validationErrors["individualProfile.firstName"]
                      ? "border-red-500"
                      : ""
                  }
                  disabled={loading}
                />
                {validationErrors["individualProfile.firstName"] && (
                  <p className="text-sm text-red-500">
                    {validationErrors["individualProfile.firstName"]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">姓 *</label>
                <Input
                  value={formData.individualProfile?.lastName || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "individualProfile.lastName",
                      e.target.value,
                    )
                  }
                  placeholder="田中"
                  className={
                    validationErrors["individualProfile.lastName"]
                      ? "border-red-500"
                      : ""
                  }
                  disabled={loading}
                />
                {validationErrors["individualProfile.lastName"] && (
                  <p className="text-sm text-red-500">
                    {validationErrors["individualProfile.lastName"]}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">名前（カナ）</label>
                <Input
                  value={formData.individualProfile?.firstNameKana || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "individualProfile.firstNameKana",
                      e.target.value,
                    )
                  }
                  placeholder="タロウ"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">姓（カナ）</label>
                <Input
                  value={formData.individualProfile?.lastNameKana || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "individualProfile.lastNameKana",
                      e.target.value,
                    )
                  }
                  placeholder="タナカ"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">生年月日</label>
                <Input
                  type="date"
                  value={formData.individualProfile?.dateOfBirth || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "individualProfile.dateOfBirth",
                      e.target.value,
                    )
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">性別</label>
                <Select
                  value={formData.individualProfile?.gender || "UNKNOWN"}
                  onValueChange={(value) =>
                    handleInputChange("individualProfile.gender", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNKNOWN">不明</SelectItem>
                    <SelectItem value="MALE">男性</SelectItem>
                    <SelectItem value="FEMALE">女性</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">国籍</label>
                <Select
                  value={formData.individualProfile?.nationality || "JP"}
                  onValueChange={(value) =>
                    handleInputChange("individualProfile.nationality", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JP">日本</SelectItem>
                    <SelectItem value="US">アメリカ</SelectItem>
                    <SelectItem value="CN">中国</SelectItem>
                    <SelectItem value="KR">韓国</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">職業</label>
                <Input
                  value={formData.individualProfile?.occupation || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "individualProfile.occupation",
                      e.target.value,
                    )
                  }
                  placeholder="会社員"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">婚姻状況</label>
                <Select
                  value={formData.individualProfile?.maritalStatus || "UNKNOWN"}
                  onValueChange={(value) =>
                    handleInputChange("individualProfile.maritalStatus", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNKNOWN">不明</SelectItem>
                    <SelectItem value="SINGLE">未婚</SelectItem>
                    <SelectItem value="MARRIED">既婚</SelectItem>
                    <SelectItem value="DIVORCED">離婚</SelectItem>
                    <SelectItem value="WIDOWED">死別</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 法人情報 */}
      {formData.isCorporation && (
        <Card>
          <CardHeader>
            <CardTitle>法人情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">会社名 *</label>
              <Input
                value={formData.corporateProfile?.companyName || ""}
                onChange={(e) =>
                  handleInputChange(
                    "corporateProfile.companyName",
                    e.target.value,
                  )
                }
                placeholder="株式会社サンプル"
                className={
                  validationErrors["corporateProfile.companyName"]
                    ? "border-red-500"
                    : ""
                }
                disabled={loading}
              />
              {validationErrors["corporateProfile.companyName"] && (
                <p className="text-sm text-red-500">
                  {validationErrors["corporateProfile.companyName"]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">会社名（カナ）</label>
              <Input
                value={formData.corporateProfile?.companyNameKana || ""}
                onChange={(e) =>
                  handleInputChange(
                    "corporateProfile.companyNameKana",
                    e.target.value,
                  )
                }
                placeholder="カブシキガイシャサンプル"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">代表者名</label>
                <Input
                  value={formData.corporateProfile?.representativeName || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "corporateProfile.representativeName",
                      e.target.value,
                    )
                  }
                  placeholder="代表取締役 田中太郎"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">設立日</label>
                <Input
                  type="date"
                  value={formData.corporateProfile?.establishmentDate || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "corporateProfile.establishmentDate",
                      e.target.value,
                    )
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">資本金</label>
                <Input
                  type="number"
                  value={formData.corporateProfile?.capital || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "corporateProfile.capital",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="10000000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">従業員数</label>
                <Input
                  type="number"
                  value={formData.corporateProfile?.employees || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "corporateProfile.employees",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="50"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">業界</label>
              <Input
                value={formData.corporateProfile?.industry || ""}
                onChange={(e) =>
                  handleInputChange("corporateProfile.industry", e.target.value)
                }
                placeholder="IT"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">事業内容</label>
              <Input
                value={formData.corporateProfile?.businessDescription || ""}
                onChange={(e) =>
                  handleInputChange(
                    "corporateProfile.businessDescription",
                    e.target.value,
                  )
                }
                placeholder="ソフトウェア開発"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 住所情報 */}
      <Card>
        <CardHeader>
          <CardTitle>住所情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.addresses.map((address, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">住所 {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAddress(index)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">郵便番号</label>
                  <Input
                    value={address.postalCode || ""}
                    onChange={(e) => {
                      const newAddresses = [...formData.addresses];
                      newAddresses[index] = {
                        ...address,
                        postalCode: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        addresses: newAddresses,
                      }));
                    }}
                    placeholder="100-0001"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">都道府県 *</label>
                  <Input
                    value={address.prefecture}
                    onChange={(e) => {
                      const newAddresses = [...formData.addresses];
                      newAddresses[index] = {
                        ...address,
                        prefecture: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        addresses: newAddresses,
                      }));
                    }}
                    placeholder="東京都"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">市区町村 *</label>
                  <Input
                    value={address.city}
                    onChange={(e) => {
                      const newAddresses = [...formData.addresses];
                      newAddresses[index] = {
                        ...address,
                        city: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        addresses: newAddresses,
                      }));
                    }}
                    placeholder="千代田区"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">番地 *</label>
                  <Input
                    value={address.address1}
                    onChange={(e) => {
                      const newAddresses = [...formData.addresses];
                      newAddresses[index] = {
                        ...address,
                        address1: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        addresses: newAddresses,
                      }));
                    }}
                    placeholder="千代田1-1-1"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">建物名・部屋番号</label>
                <Input
                  value={address.address2 || ""}
                  onChange={(e) => {
                    const newAddresses = [...formData.addresses];
                    newAddresses[index] = {
                      ...address,
                      address2: e.target.value,
                    };
                    setFormData((prev) => ({
                      ...prev,
                      addresses: newAddresses,
                    }));
                  }}
                  placeholder="サンプルビル 5F"
                  disabled={loading}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addAddress}
            disabled={loading}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            住所を追加
          </Button>
        </CardContent>
      </Card>

      {/* 連絡先情報 */}
      <Card>
        <CardHeader>
          <CardTitle>連絡先情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.contacts.map((contact, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">連絡先 {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeContact(index)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">電話番号</label>
                  <Input
                    value={contact.phone || ""}
                    onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index] = {
                        ...contact,
                        phone: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        contacts: newContacts,
                      }));
                    }}
                    placeholder="03-1234-5678"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">携帯電話</label>
                  <Input
                    value={contact.mobile || ""}
                    onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index] = {
                        ...contact,
                        mobile: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        contacts: newContacts,
                      }));
                    }}
                    placeholder="090-1234-5678"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">メールアドレス</label>
                <Input
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => {
                    const newContacts = [...formData.contacts];
                    newContacts[index] = { ...contact, email: e.target.value };
                    setFormData((prev) => ({ ...prev, contacts: newContacts }));
                  }}
                  placeholder="tanaka@example.com"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">FAX</label>
                  <Input
                    value={contact.fax || ""}
                    onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index] = { ...contact, fax: e.target.value };
                      setFormData((prev) => ({
                        ...prev,
                        contacts: newContacts,
                      }));
                    }}
                    placeholder="03-1234-5679"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ウェブサイト</label>
                  <Input
                    value={contact.website || ""}
                    onChange={(e) => {
                      const newContacts = [...formData.contacts];
                      newContacts[index] = {
                        ...contact,
                        website: e.target.value,
                      };
                      setFormData((prev) => ({
                        ...prev,
                        contacts: newContacts,
                      }));
                    }}
                    placeholder="https://example.com"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addContact}
            disabled={loading}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            連絡先を追加
          </Button>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
