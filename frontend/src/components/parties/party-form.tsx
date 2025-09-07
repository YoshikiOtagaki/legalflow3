"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParties } from "@/hooks/use-parties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, ArrowLeft } from "lucide-react";

const partyFormSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  type: z.enum(["Individual", "Corporate"], {
    required_error: "タイプを選択してください",
  }),
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type PartyFormData = z.infer<typeof partyFormSchema>;

interface PartyFormProps {
  partyId?: string;
  onSuccess?: (partyId: string) => void;
  onCancel?: () => void;
}

export function PartyForm({ partyId, onSuccess, onCancel }: PartyFormProps) {
  const { parties, createParty, updateParty } = useParties();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingParty = partyId ? parties.find((p) => p.id === partyId) : null;
  const isEdit = !!existingParty;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: {
      name: existingParty?.name || "",
      type: existingParty?.type || "Individual",
      email: existingParty?.email || "",
      phone: existingParty?.phone || "",
      address: existingParty?.address || "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: PartyFormData) => {
    setIsSubmitting(true);

    try {
      const partyData = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      };

      if (isEdit && partyId) {
        await updateParty(partyId, partyData);
      } else {
        const newParty = await createParty(partyData);
        onSuccess?.(newParty.id);
      }
    } catch (error) {
      console.error("当事者保存エラー:", error);
      alert(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        )}
        <h1 className="text-3xl font-bold">
          {isEdit ? "当事者を編集" : "新しい当事者を作成"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              当事者の基本情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前 *</Label>
              <Input
                id="name"
                placeholder="当事者の名前を入力"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>タイプ *</Label>
              <RadioGroup
                value={selectedType}
                onValueChange={(value) =>
                  setValue("type", value as "Individual" | "Corporate")
                }
                disabled={isSubmitting}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Individual" id="individual" />
                  <Label htmlFor="individual">個人</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Corporate" id="corporate" />
                  <Label htmlFor="corporate">法人</Label>
                </div>
              </RadioGroup>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>連絡先情報</CardTitle>
            <CardDescription>
              連絡先情報を入力してください（任意）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@example.com"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="090-1234-5678"
                {...register("phone")}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Textarea
                id="address"
                placeholder="住所を入力"
                rows={3}
                {...register("address")}
                disabled={isSubmitting}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEdit ? "更新中..." : "作成中..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? "更新" : "作成"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
