-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Lawyer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Free',
    "status" TEXT NOT NULL,
    "caseCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isCorporation" BOOLEAN NOT NULL DEFAULT false,
    "isFormerClient" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "IndividualProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "lastName" TEXT,
    "firstName" TEXT,
    "lastNameKana" TEXT,
    "firstNameKana" TEXT,
    "honorific" TEXT,
    "formerName" TEXT,
    "dateOfBirth" DATETIME,
    "legalDomicile" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "fax" TEXT,
    "postalCode" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "companyName" TEXT,
    "companyNameKana" TEXT,
    "companyPostalCode" TEXT,
    "companyAddress1" TEXT,
    "companyAddress2" TEXT,
    "companyPhone" TEXT,
    "companyFax" TEXT,
    "department" TEXT,
    "position" TEXT,
    "companyEmail" TEXT,
    "itemsInCustody" TEXT,
    "cautions" TEXT,
    "remarks" TEXT,
    CONSTRAINT "IndividualProfile_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CorporateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partyId" TEXT NOT NULL,
    "name" TEXT,
    "nameKana" TEXT,
    "postalCode" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "websiteURL" TEXT,
    "representativeTitle" TEXT,
    "representativeLastName" TEXT,
    "representativeFirstName" TEXT,
    "contactLastName" TEXT,
    "contactFirstName" TEXT,
    "contactLastNameKana" TEXT,
    "contactFirstNameKana" TEXT,
    "contactDepartment" TEXT,
    "contactPosition" TEXT,
    "contactDirectPhone" TEXT,
    "contactEmail" TEXT,
    "contactMobilePhone" TEXT,
    "contactPostalCode" TEXT,
    "contactAddress1" TEXT,
    "contactAddress2" TEXT,
    "itemsInCustody" TEXT,
    "cautions" TEXT,
    "remarks" TEXT,
    CONSTRAINT "CorporateProfile_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lawyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastName" TEXT,
    "firstName" TEXT,
    "lastNameKana" TEXT,
    "firstNameKana" TEXT,
    "honorific" TEXT,
    "registrationNumber" TEXT,
    "homePhone" TEXT,
    "homePostalCode" TEXT,
    "homeAddress1" TEXT,
    "homeAddress2" TEXT,
    "itemsInCustody" TEXT,
    "cautions" TEXT,
    "remarks" TEXT,
    "officeId" TEXT,
    CONSTRAINT "Lawyer_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "LawFirmOffice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawFirm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LawFirmOffice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lawFirmId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "officeName" TEXT,
    "postalCode" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    CONSTRAINT "LawFirmOffice_lawFirmId_fkey" FOREIGN KEY ("lawFirmId") REFERENCES "LawFirm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Courthouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "postalCode" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "phone" TEXT
);

-- CreateTable
CREATE TABLE "CourtDivision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT,
    "fax" TEXT,
    "courthouseId" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "CourtDivision_courthouseId_fkey" FOREIGN KEY ("courthouseId") REFERENCES "Courthouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CourtDivision_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CourtDivision" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourtPersonnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL,
    "courtDivisionId" TEXT NOT NULL,
    CONSTRAINT "CourtPersonnel_courtDivisionId_fkey" FOREIGN KEY ("courtDivisionId") REFERENCES "CourtDivision" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JurisdictionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lowerCourthouseId" TEXT NOT NULL,
    "superiorCourthouseId" TEXT NOT NULL,
    "caseCategoryId" TEXT,
    CONSTRAINT "JurisdictionRule_lowerCourthouseId_fkey" FOREIGN KEY ("lowerCourthouseId") REFERENCES "Courthouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JurisdictionRule_superiorCourthouseId_fkey" FOREIGN KEY ("superiorCourthouseId") REFERENCES "Courthouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JurisdictionRule_caseCategoryId_fkey" FOREIGN KEY ("caseCategoryId") REFERENCES "CaseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "caseNumber" TEXT,
    "status" TEXT,
    "trialLevel" TEXT,
    "hourlyRate" REAL,
    "firstConsultationDate" DATETIME,
    "engagementDate" DATETIME,
    "caseClosedDate" DATETIME,
    "litigationStartDate" DATETIME,
    "oralArgumentEndDate" DATETIME,
    "judgmentDate" DATETIME,
    "judgmentReceivedDate" DATETIME,
    "hasEngagementLetter" BOOLEAN NOT NULL DEFAULT false,
    "engagementLetterPath" TEXT,
    "remarks" TEXT,
    "customProperties" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "currentPhaseId" TEXT,
    "courtDivisionId" TEXT,
    CONSTRAINT "Case_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CaseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Case_currentPhaseId_fkey" FOREIGN KEY ("currentPhaseId") REFERENCES "CasePhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Case_courtDivisionId_fkey" FOREIGN KEY ("courtDivisionId") REFERENCES "CourtDivision" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Collaborator',

    PRIMARY KEY ("caseId", "userId"),
    CONSTRAINT "CaseAssignment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseParty" (
    "caseId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    PRIMARY KEY ("caseId", "partyId", "role"),
    CONSTRAINT "CaseParty_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseParty_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentCategoryId" TEXT,
    "roleDefinitions" JSONB NOT NULL,
    CONSTRAINT "CaseCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "CaseCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CasePhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "CasePhase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CaseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    CONSTRAINT "Task_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "location" TEXT,
    CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memo_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HearingReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseEventId" TEXT NOT NULL,
    "attendees" JSONB NOT NULL,
    "notes" TEXT,
    CONSTRAINT "HearingReport_caseEventId_fkey" FOREIGN KEY ("caseEventId") REFERENCES "CaseEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubmittedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hearingReportId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    CONSTRAINT "SubmittedDocument_hearingReportId_fkey" FOREIGN KEY ("hearingReportId") REFERENCES "HearingReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "description" TEXT,
    CONSTRAINT "TimesheetEntry_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Expense_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Deposit_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhaseTransitionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromPhaseId" TEXT NOT NULL,
    "toPhaseId" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    CONSTRAINT "PhaseTransitionRule_fromPhaseId_fkey" FOREIGN KEY ("fromPhaseId") REFERENCES "CasePhase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PhaseTransitionRule_toPhaseId_fkey" FOREIGN KEY ("toPhaseId") REFERENCES "CasePhase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PhaseTransitionRule_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TaskTemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskTemplateId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDateOffsetDays" INTEGER NOT NULL,
    CONSTRAINT "TaskTemplateItem_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "placeholders" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualProfile_partyId_key" ON "IndividualProfile"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateProfile_partyId_key" ON "CorporateProfile"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_registrationNumber_key" ON "Lawyer"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CaseCategory_name_key" ON "CaseCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HearingReport_caseEventId_key" ON "HearingReport"("caseEventId");
