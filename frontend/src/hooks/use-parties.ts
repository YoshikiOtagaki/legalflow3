import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

// 当事者の型定義
export interface Party {
  id: string;
  isCorporation: boolean;
  isFormerClient: boolean;
  individualProfile?: IndividualProfile;
  corporateProfile?: CorporateProfile;
  addresses: PartyAddress[];
  contacts: PartyContact[];
  relations: PartyRelation[];
  cases: CaseParty[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface IndividualProfile {
  firstName: string;
  lastName: string;
  firstNameKana?: string;
  lastNameKana?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  nationality?: "JP" | "US" | "CN" | "KR" | "OTHER";
  occupation?: string;
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "UNKNOWN";
  spouseName?: string;
  children?: Child[];
}

export interface CorporateProfile {
  companyName: string;
  companyNameKana?: string;
  representativeName?: string;
  establishmentDate?: string;
  capital?: number;
  employees?: number;
  industry?: string;
  businessDescription?: string;
  registrationNumber?: string;
  taxId?: string;
}

export interface Child {
  name: string;
  dateOfBirth?: string;
}

export interface PartyAddress {
  id: string;
  partyId: string;
  addressType: "HOME" | "WORK" | "MAILING" | "REGISTERED" | "OTHER";
  isPrimary: boolean;
  address: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  postalCode?: string;
  prefecture: string;
  city: string;
  address1: string;
  address2?: string;
  country: string;
  isValid: boolean;
  validationDate?: string;
}

export interface PartyContact {
  id: string;
  partyId: string;
  contactType: "PHONE" | "MOBILE" | "EMAIL" | "FAX" | "WEBSITE" | "OTHER";
  isPrimary: boolean;
  contact: Contact;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  phone?: string;
  mobile?: string;
  email?: string;
  fax?: string;
  website?: string;
  isValid: boolean;
  validationDate?: string;
}

export interface PartyRelation {
  id: string;
  partyId1: string;
  partyId2: string;
  relationType:
    | "SPOUSE"
    | "CHILD"
    | "PARENT"
    | "SIBLING"
    | "BUSINESS_PARTNER"
    | "EMPLOYEE"
    | "EMPLOYER"
    | "OTHER";
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseParty {
  id: string;
  caseId: string;
  partyId: string;
  partyRole:
    | "PLAINTIFF"
    | "DEFENDANT"
    | "THIRD_PARTY"
    | "WITNESS"
    | "EXPERT"
    | "OTHER";
  isPrimary: boolean;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
  party?: Party;
  case?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PartySearchFilter {
  isCorporation?: boolean;
  isFormerClient?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  createdBy?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

// 当事者管理フック
export const useParties = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当事者一覧取得
  const fetchParties = useCallback(
    async (
      params: {
        limit?: number;
        nextToken?: string;
        isCorporation?: boolean;
        isFormerClient?: boolean;
      } = {},
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          query ListParties($limit: Int, $nextToken: String, $isCorporation: Boolean, $isFormerClient: Boolean) {
            listParties(limit: $limit, nextToken: $nextToken, isCorporation: $isCorporation, isFormerClient: $isFormerClient) {
              success
              parties {
                id
                isCorporation
                isFormerClient
                individualProfile {
                  firstName
                  lastName
                  firstNameKana
                  lastNameKana
                  dateOfBirth
                  gender
                  nationality
                  occupation
                  maritalStatus
                  spouseName
                  children {
                    name
                    dateOfBirth
                  }
                }
                corporateProfile {
                  companyName
                  companyNameKana
                  representativeName
                  establishmentDate
                  capital
                  employees
                  industry
                  businessDescription
                  registrationNumber
                  taxId
                }
                addresses {
                  id
                  addressType
                  isPrimary
                  address {
                    postalCode
                    prefecture
                    city
                    address1
                    address2
                    country
                    isValid
                    validationDate
                  }
                }
                contacts {
                  id
                  contactType
                  isPrimary
                  contact {
                    phone
                    mobile
                    email
                    fax
                    website
                    isValid
                    validationDate
                  }
                }
                createdAt
                updatedAt
              }
              nextToken
              totalCount
              error {
                message
                code
              }
            }
          }
        `,
          variables: params,
        });

        if (result.data.listParties.success) {
          setParties(result.data.listParties.parties);
          return {
            parties: result.data.listParties.parties,
            nextToken: result.data.listParties.nextToken,
            totalCount: result.data.listParties.totalCount,
          };
        } else {
          throw new Error(result.data.listParties.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 当事者検索
  const searchParties = useCallback(
    async (
      filter: PartySearchFilter,
      params: {
        limit?: number;
        nextToken?: string;
      } = {},
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          query SearchParties($filter: PartySearchFilter!, $limit: Int, $nextToken: String) {
            searchParties(filter: $filter, limit: $limit, nextToken: $nextToken) {
              success
              parties {
                id
                isCorporation
                isFormerClient
                individualProfile {
                  firstName
                  lastName
                  firstNameKana
                  lastNameKana
                  dateOfBirth
                  gender
                  nationality
                  occupation
                  maritalStatus
                  spouseName
                  children {
                    name
                    dateOfBirth
                  }
                }
                corporateProfile {
                  companyName
                  companyNameKana
                  representativeName
                  establishmentDate
                  capital
                  employees
                  industry
                  businessDescription
                  registrationNumber
                  taxId
                }
                addresses {
                  id
                  addressType
                  isPrimary
                  address {
                    postalCode
                    prefecture
                    city
                    address1
                    address2
                    country
                    isValid
                    validationDate
                  }
                }
                contacts {
                  id
                  contactType
                  isPrimary
                  contact {
                    phone
                    mobile
                    email
                    fax
                    website
                    isValid
                    validationDate
                  }
                }
                createdAt
                updatedAt
              }
              nextToken
              totalCount
              error {
                message
                code
              }
            }
          }
        `,
          variables: {
            filter,
            ...params,
          },
        });

        if (result.data.searchParties.success) {
          setParties(result.data.searchParties.parties);
          return {
            parties: result.data.searchParties.parties,
            nextToken: result.data.searchParties.nextToken,
            totalCount: result.data.searchParties.totalCount,
          };
        } else {
          throw new Error(result.data.searchParties.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 当事者詳細取得
  const getParty = useCallback(async (id: string): Promise<Party> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: `
          query GetParty($id: ID!) {
            getParty(id: $id) {
              success
              party {
                id
                isCorporation
                isFormerClient
                individualProfile {
                  firstName
                  lastName
                  firstNameKana
                  lastNameKana
                  dateOfBirth
                  gender
                  nationality
                  occupation
                  maritalStatus
                  spouseName
                  children {
                    name
                    dateOfBirth
                  }
                }
                corporateProfile {
                  companyName
                  companyNameKana
                  representativeName
                  establishmentDate
                  capital
                  employees
                  industry
                  businessDescription
                  registrationNumber
                  taxId
                }
                addresses {
                  id
                  addressType
                  isPrimary
                  address {
                    postalCode
                    prefecture
                    city
                    address1
                    address2
                    country
                    isValid
                    validationDate
                  }
                }
                contacts {
                  id
                  contactType
                  isPrimary
                  contact {
                    phone
                    mobile
                    email
                    fax
                    website
                    isValid
                    validationDate
                  }
                }
                relations {
                  id
                  partyId1
                  partyId2
                  relationType
                  description
                  isActive
                  createdAt
                  updatedAt
                }
                cases {
                  id
                  caseId
                  partyId
                  partyRole
                  isPrimary
                  assignedAt
                  assignedBy
                  isActive
                  createdAt
                  updatedAt
                }
                createdAt
                updatedAt
                createdBy
                updatedBy
              }
              error {
                message
                code
              }
            }
          }
        `,
        variables: { id },
      });

      if (result.data.getParty.success) {
        return result.data.getParty.party;
      } else {
        throw new Error(result.data.getParty.error.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 当事者作成
  const createParty = useCallback(
    async (input: {
      isCorporation: boolean;
      isFormerClient?: boolean;
      individualProfile?: IndividualProfile;
      corporateProfile?: CorporateProfile;
      addresses?: Address[];
      contacts?: Contact[];
    }): Promise<Party> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          mutation CreateParty($input: CreatePartyInput!) {
            createParty(input: $input) {
              success
              party {
                id
                isCorporation
                isFormerClient
                individualProfile {
                  firstName
                  lastName
                  firstNameKana
                  lastNameKana
                  dateOfBirth
                  gender
                  nationality
                  occupation
                  maritalStatus
                  spouseName
                  children {
                    name
                    dateOfBirth
                  }
                }
                corporateProfile {
                  companyName
                  companyNameKana
                  representativeName
                  establishmentDate
                  capital
                  employees
                  industry
                  businessDescription
                  registrationNumber
                  taxId
                }
                addresses {
                  id
                  addressType
                  isPrimary
                  address {
                    postalCode
                    prefecture
                    city
                    address1
                    address2
                    country
                    isValid
                    validationDate
                  }
                }
                contacts {
                  id
                  contactType
                  isPrimary
                  contact {
                    phone
                    mobile
                    email
                    fax
                    website
                    isValid
                    validationDate
                  }
                }
                createdAt
                updatedAt
                createdBy
                updatedBy
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { input },
        });

        if (result.data.createParty.success) {
          const newParty = result.data.createParty.party;
          setParties((prev) => [newParty, ...prev]);
          return newParty;
        } else {
          throw new Error(result.data.createParty.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 当事者更新
  const updateParty = useCallback(
    async (input: {
      id: string;
      isCorporation?: boolean;
      isFormerClient?: boolean;
      individualProfile?: IndividualProfile;
      corporateProfile?: CorporateProfile;
    }): Promise<Party> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.graphql({
          query: `
          mutation UpdateParty($input: UpdatePartyInput!) {
            updateParty(input: $input) {
              success
              party {
                id
                isCorporation
                isFormerClient
                individualProfile {
                  firstName
                  lastName
                  firstNameKana
                  lastNameKana
                  dateOfBirth
                  gender
                  nationality
                  occupation
                  maritalStatus
                  spouseName
                  children {
                    name
                    dateOfBirth
                  }
                }
                corporateProfile {
                  companyName
                  companyNameKana
                  representativeName
                  establishmentDate
                  capital
                  employees
                  industry
                  businessDescription
                  registrationNumber
                  taxId
                }
                addresses {
                  id
                  addressType
                  isPrimary
                  address {
                    postalCode
                    prefecture
                    city
                    address1
                    address2
                    country
                    isValid
                    validationDate
                  }
                }
                contacts {
                  id
                  contactType
                  isPrimary
                  contact {
                    phone
                    mobile
                    email
                    fax
                    website
                    isValid
                    validationDate
                  }
                }
                createdAt
                updatedAt
                createdBy
                updatedBy
              }
              error {
                message
                code
              }
            }
          }
        `,
          variables: { input },
        });

        if (result.data.updateParty.success) {
          const updatedParty = result.data.updateParty.party;
          setParties((prev) =>
            prev.map((party) =>
              party.id === updatedParty.id ? updatedParty : party,
            ),
          );
          return updatedParty;
        } else {
          throw new Error(result.data.updateParty.error.message);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 当事者削除
  const deleteParty = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: `
          mutation DeleteParty($id: ID!) {
            deleteParty(id: $id) {
              success
              party {
                id
              }
              message
              error {
                message
                code
              }
            }
          }
        `,
        variables: { id },
      });

      if (result.data.deleteParty.success) {
        setParties((prev) => prev.filter((party) => party.id !== id));
      } else {
        throw new Error(result.data.deleteParty.error.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    parties,
    loading,
    error,
    fetchParties,
    searchParties,
    getParty,
    createParty,
    updateParty,
    deleteParty,
  };
};
