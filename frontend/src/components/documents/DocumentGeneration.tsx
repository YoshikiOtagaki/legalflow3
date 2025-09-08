// Document Generation Component
// Handles document generation from templates

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useDocumentGeneration,
  useDocumentTemplates,
} from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

// Form validation schema
const generationSchema = z.object({
  templateId: z.string().min(1, "テンプレートは必須です"),
  caseId: z.string().min(1, "ケースは必須です"),
  outputFormat: z.enum(["DOCX", "PDF"], {
    required_error: "出力形式は必須です",
  }),
  data: z.record(z.unknown()).optional(),
});

type GenerationFormData = z.infer<typeof generationSchema>;

interface DocumentGenerationProps {
  caseId: string;
  onSuccess?: (document: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface PlaceholderData {
  [key: string]: string | number | boolean;
}

export function DocumentGeneration({
  caseId,
  onSuccess,
  onCancel,
  className = "",
}: DocumentGenerationProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [placeholderData, setPlaceholderData] = useState<PlaceholderData>({});
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const {
    generateDocument,
    isGenerating,
    error: generationError,
  } = useDocumentGeneration();
  const {
    templates,
    loading: templatesLoading,
    refetch: refetchTemplates,
  } = useDocumentTemplates();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<GenerationFormData>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      caseId,
      outputFormat: "PDF",
      data: {},
    },
  });

  const watchedTemplateId = watch("templateId");
  const watchedOutputFormat = watch("outputFormat");

  // Load template when selected
  useEffect(() => {
    if (watchedTemplateId) {
      const template = templates.find((t) => t.id === watchedTemplateId);
      if (template) {
        setSelectedTemplate(template);
        // Initialize placeholder data
        const initialData: PlaceholderData = {};
        template.placeholders?.forEach((placeholder: string) => {
          initialData[placeholder] = "";
        });
        setPlaceholderData(initialData);
        setValue("data", initialData);
      }
    }
  }, [watchedTemplateId, templates, setValue]);

  const onSubmit = async (data: GenerationFormData) => {
    try {
      const result = await generateDocument({
        templateId: data.templateId,
        caseId: data.caseId,
        data: { ...data.data, ...placeholderData },
        outputFormat: data.outputFormat,
      });

      setGeneratedDocument(result);
      onSuccess?.(result);
    } catch (err) {
      console.error("Error generating document:", err);
    }
  };

  const handlePlaceholderChange = (placeholder: string, value: string) => {
    const newData = { ...placeholderData, [placeholder]: value };
    setPlaceholderData(newData);
    setValue("data", newData);
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const handleDownload = () => {
    if (generatedDocument?.downloadUrl) {
      window.open(generatedDocument.downloadUrl, "_blank");
    }
  };

  const handleRegenerate = () => {
    setGeneratedDocument(null);
    reset();
  };

  const getPlaceholderType = (
    placeholder: string,
  ): "text" | "number" | "date" | "textarea" => {
    if (
      placeholder.toLowerCase().includes("date") ||
      placeholder.toLowerCase().includes("日付")
    ) {
      return "date";
    }
    if (
      placeholder.toLowerCase().includes("amount") ||
      placeholder.toLowerCase().includes("金額")
    ) {
      return "number";
    }
    if (
      placeholder.toLowerCase().includes("description") ||
      placeholder.toLowerCase().includes("説明")
    ) {
      return "textarea";
    }
    return "text";
  };

  const formatPlaceholderLabel = (placeholder: string): string => {
    return placeholder
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (generatedDocument) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            ドキュメント生成完了
          </CardTitle>
          <CardDescription>ドキュメントが正常に生成されました</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                生成されたドキュメント
              </span>
            </div>
            <p className="text-sm text-green-700">
              ドキュメントID: {generatedDocument.documentId}
            </p>
            <p className="text-sm text-green-700">
              ファイルパス: {generatedDocument.filePath}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              ダウンロード
            </Button>
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              再生成
            </Button>
            <Button variant="outline" onClick={onCancel}>
              閉じる
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ドキュメント生成
        </CardTitle>
        <CardDescription>
          テンプレートからドキュメントを生成します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {generationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">テンプレート選択</TabsTrigger>
              <TabsTrigger value="data" disabled={!selectedTemplate}>
                データ入力
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  テンプレート <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watchedTemplateId}
                  onValueChange={(value) => setValue("templateId", value)}
                >
                  <SelectTrigger
                    className={errors.templateId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="テンプレートを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesLoading ? (
                      <SelectItem value="" disabled>
                        読み込み中...
                      </SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            {template.description && (
                              <span className="text-xs text-gray-500">
                                {template.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.templateId && (
                  <p className="text-sm text-red-500">
                    {errors.templateId.message}
                  </p>
                )}
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  出力形式 <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watchedOutputFormat}
                  onValueChange={(value) =>
                    setValue("outputFormat", value as "DOCX" | "PDF")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="出力形式を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOCX">Word (DOCX)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.outputFormat && (
                  <p className="text-sm text-red-500">
                    {errors.outputFormat.message}
                  </p>
                )}
              </div>

              {/* Template Info */}
              {selectedTemplate && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium mb-2">テンプレート情報</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedTemplate.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedTemplate.category}
                    </Badge>
                    <Badge variant="outline">v{selectedTemplate.version}</Badge>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              {selectedTemplate && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">プレースホルダーデータ</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      プレビュー
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {selectedTemplate.placeholders?.map(
                      (placeholder: string) => {
                        const type = getPlaceholderType(placeholder);
                        const label = formatPlaceholderLabel(placeholder);
                        const value = placeholderData[placeholder] || "";

                        return (
                          <div key={placeholder} className="space-y-2">
                            <label className="text-sm font-medium">
                              {label} <span className="text-red-500">*</span>
                            </label>
                            {type === "textarea" ? (
                              <Textarea
                                value={value}
                                onChange={(e) =>
                                  handlePlaceholderChange(
                                    placeholder,
                                    e.target.value,
                                  )
                                }
                                placeholder={`${label}を入力してください`}
                                rows={3}
                              />
                            ) : (
                              <Input
                                type={
                                  type === "date"
                                    ? "date"
                                    : type === "number"
                                      ? "number"
                                      : "text"
                                }
                                value={value}
                                onChange={(e) =>
                                  handlePlaceholderChange(
                                    placeholder,
                                    e.target.value,
                                  )
                                }
                                placeholder={`${label}を入力してください`}
                              />
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>

                  {previewMode && (
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <h5 className="font-medium mb-2">プレビュー</h5>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                        {selectedTemplate.content
                          ?.replace(
                            /\{\{([^}]+)\}\}/g,
                            (match: string, placeholder: string) => {
                              return placeholderData[placeholder] || match;
                            },
                          )
                          .substring(0, 500)}
                        {selectedTemplate.content?.length > 500 && "..."}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isGenerating || !selectedTemplate}>
              {isGenerating && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              ドキュメント生成
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
