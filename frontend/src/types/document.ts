export interface Document {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  caseId: string;
  case?: Case;
  templateId?: string;
  template?: DocumentTemplate;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  isLatest: boolean;
  parentDocumentId?: string;
  parentDocument?: Document;
  childDocuments?: Document[];
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: User;
  updatedById: string;
  updatedBy?: User;
}

export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  category: string;
  mimeTypes: string[];
  maxFileSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  content: string;
  placeholders: string[];
  category: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: User;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocumentFilters {
  search?: string;
  typeId?: string;
  statusId?: string;
  caseId?: string;
  templateId?: string;
  tags?: string[];
  createdById?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentGenerationRequest {
  templateId: string;
  caseId: string;
  data: Record<string, any>;
  outputFormat: 'docx' | 'pdf';
}

export interface DocumentGenerationResponse {
  documentId: string;
  filePath: string;
  downloadUrl: string;
}
