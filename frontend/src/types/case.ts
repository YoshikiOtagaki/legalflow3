export interface Option {
  id: string;
  name: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  category: CaseCategory;
  status: CaseStatus;
  phase: CasePhase;
  priority: CasePriority;
  courtId?: string;
  court?: Court;
  lawFirmId: string;
  lawFirm?: LawFirm;
  assignedLawyerId?: string;
  assignedLawyer?: Lawyer;
  clientId?: string;
  client?: Party;
  opposingPartyId?: string;
  opposingParty?: Party;
  startDate: string;
  endDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CasePhase {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CasePriority {
  id: string;
  name: string;
  description?: string;
  level: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  jurisdiction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LawFirm {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  barNumber?: string;
  specialization?: string;
  lawFirmId?: string;
  lawFirm?: LawFirm;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  name: string;
  type: "Individual" | "Corporate";
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseListResponse {
  cases: Case[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CaseFilters {
  search?: string;
  categoryId?: string;
  statusId?: string;
  phaseId?: string;
  priorityId?: string;
  assignedLawyerId?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
