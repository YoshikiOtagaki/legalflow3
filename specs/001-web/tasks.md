# Tasks: Lawyer Case Management Web Service

**Input**: Design documents from `/specs/001-web/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup
- [X] T001 Create project structure: `backend/api_service`, `backend/docgen_service`, `frontend`
- [X] T002 Initialize Node.js project in `backend/api_service` (npm, Express.js, Prisma)
- [X] T003 Initialize Python project in `backend/docgen_service` (pipenv/poetry, FastAPI, python-docx)
- [X] T004 Initialize Next.js project in `frontend` (npm/yarn, React, Tailwind CSS)
- [X] T003 [P] Configure linting (ESLint, Prettier) for `backend/api_service` and `frontend`
- [X] T006 [P] Configure linting (Flake8, Black) for `backend/docgen_service`
- [X] T007 [P] Configure Git pre-commit hooks for linting and formatting

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

### Data Model Tests (Prisma Schema)
- [X] T008 [P] Write CRUD tests for `User` model in `backend/api_service/tests/models/user.test.ts`
- [X] T009 [P] Write CRUD tests for `Subscription` model in `backend/api_service/tests/models/subscription.test.ts`
- [X] T010 [P] Write CRUD tests for `Party` and `IndividualProfile` models in `backend/api_service/tests/models/party_individual.test.ts`
- [X] T011 [P] Write CRUD tests for `Party` and `CorporateProfile` models in `backend/api_service/tests/models/party_corporate.test.ts`
- [X] T012 [P] Write CRUD tests for `Lawyer` model in `backend/api_service/tests/models/lawyer.test.ts`
- [X] T013 [P] Write CRUD tests for `LawFirm` and `LawFirmOffice` models in `backend/api_service/tests/models/law_firm.test.ts`
- [X] T014 [P] Write CRUD tests for `Courthouse`, `CourtDivision`, `CourtPersonnel` models in `backend/api_service/tests/models/court.test.ts`
- [X] T015 [P] Write CRUD tests for `JurisdictionRule` model in `backend/api_service/tests/models/jurisdiction_rule.test.ts`
- [X] T016 [P] Write CRUD tests for `Case` model in `backend/api_service/tests/models/case.test.ts`
- [X] T017 [P] Write CRUD tests for `CaseAssignment` model in `backend/api_service/tests/models/case_assignment.test.ts`
- [X] T018 [P] Write CRUD tests for `CaseParty` model in `backend/api_service/tests/models/case_party.test.ts`
- [X] T019 [P] Write CRUD tests for `CaseCategory` and `CasePhase` models in `backend/api_service/tests/models/case_workflow.test.ts`
- [X] T020 [P] Write CRUD tests for `Task` model in `backend/api_service/tests/models/task.test.ts`
- [X] T021 [P] Write CRUD tests for `CaseEvent` and `HearingReport` models in `backend/api_service/tests/models/event_report.test.ts`
- [X] T022 [P] Write CRUD tests for `SubmittedDocument` model in `backend/api_service/tests/models/submitted_document.test.ts`
- [X] T023 [P] Write CRUD tests for `TimesheetEntry` model in `backend/api_service/tests/models/timesheet.test.ts`
- [X] T024 [P] Write CRUD tests for `Expense` and `Deposit` models in `backend/api_service/tests/models/finance.test.ts`
- [X] T025 [P] Write CRUD tests for `Memo` model in `backend/api_service/tests/models/memo.test.ts`
- [X] T026 [P] Write CRUD tests for `PhaseTransitionRule`, `TaskTemplate`, `TaskTemplateItem` models in `backend/api_service/tests/models/automation.test.ts`
- [X] T027 [P] Write CRUD tests for `DocumentTemplate` model in `backend/api_service/tests/models/document_template.test.ts`
- [X] T049 Implement basic CRUD services for `Notification`

### API Contract Tests (public_api.yaml)
- [X] T029 [P] Write contract tests for `/cases` endpoints in `backend/api_service/tests/api/cases.test.ts`
- [X] T030 [P] Write contract tests for `/parties` endpoints in `backend/api_service/tests/api/parties.test.ts`
- [X] T031 [P] Write contract tests for `/lawyers` endpoints in `backend/api_service/tests/api/lawyers.test.ts`
- [X] T032 [P] Write contract tests for `/law-firms` endpoints in `backend/api_service/tests/api/law_firms.test.ts`
- [X] T033 [P] Write contract tests for `/courthouses` endpoints in `backend/api_service/tests/api/courthouses.test.ts`

### Integration Tests (from Quickstart)
- [X] T034 Write integration test for User Registration and Login flow in `backend/api_service/tests/integration/auth.test.ts`
- [X] T035 Write integration test for Case Creation and Category Selection flow in `backend/api_service/tests/integration/case_creation.test.ts`
- [X] T036 Write integration test for Adding Parties to Case flow in `backend/api_service/tests/integration/case_parties.test.ts`
- [X] T037 Write integration test for Time Logging flow in `backend/api_service/tests/integration/time_logging.test.ts`
- [X] T038 Write integration test for Document Generation flow in `backend/api_service/tests/integration/document_generation.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Model & Database
- [X] T039 Implement Prisma schema migrations for all models in `backend/api_service/src/models/schema.prisma`
- [X] T040 Implement basic CRUD services for `User`, `Subscription`
- [X] T041 Implement basic CRUD services for `Party`, `IndividualProfile`, `CorporateProfile`
- [X] T042 Implement basic CRUD services for `Lawyer`, `LawFirm`, `LawFirmOffice`
- [X] T043 Implement basic CRUD services for `Courthouse`, `CourtDivision`, `CourtPersonnel`, `JurisdictionRule`
- [X] T044 Implement basic CRUD services for `Case`, `CaseAssignment`, `CaseParty`
- [X] T045 Implement basic CRUD services for `CaseCategory`, `CasePhase`
- [X] T046 Implement basic CRUD services for `Task`, `CaseEvent`, `Memo`, `HearingReport`, `SubmittedDocument`
- [X] T047 Implement basic CRUD services for `TimesheetEntry`, `Expense`, `Deposit`
- [X] T048 Implement basic CRUD services for `PhaseTransitionRule` (`phase-transition-rule.ts`), `TaskTemplate` (`task-template.ts`), `TaskTemplateItem` (`task-template-item.ts`), `DocumentTemplate` (`document-template.ts`) in `backend/api_service/src/models/`
- [X] T049 Implement basic CRUD services for `Notification` (`notification.ts`) in `backend/api_service/src/models/`

### API Endpoints (Node.js - backend/api_service)
- [X] T050 Implement `/cases` API endpoints (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})
- [X] T051 Implement `/parties` API endpoints (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})
- [X] T052 Implement `/lawyers` API endpoints (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})
- [X] T053 Implement `/law-firms` API endpoints (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})
- [X] T054 Implement `/courthouses` API endpoints (GET, POST, GET/{id}, PUT/{id}, DELETE/{id})

### Core Logic & Features
- [X] T055 Implement User Authentication and Authorization (Login, Logout, Session Management)
- [X] T056 Implement Role-Based Access Control (RBAC) logic based on `User.role`
- [X] T057 Implement Collaboration logic for `CaseAssignment`
- [X] T058 Implement Subscription tier logic and case count limits
- [X] T059 Implement Case Phase transition logic and automated task generation
- [X] T060 Implement Timesheet global and case-specific timer logic
- [X] T061 Implement Notification system (triggers, preferences, LINE integration) in `backend/api_service/src/services/notification.ts`

### Document Generation Service (Python - backend/docgen_service)
- [X] T062 Implement internal API endpoint for document generation requests
- [X] T063 Implement `python-docx` based document generation logic
- [X] T064 Implement PDF text extraction and OCR (using Gemini API)
- [X] T065 Implement extracted data mapping to placeholders

### Frontend (Next.js - frontend)
- [x] T066 Implement User Authentication UI (Login, Registration)
- [x] T067 Implement Case List and Detail UI
- [x] T068 Implement Case Creation UI (with category selection)
- [x] T069 Implement Party Management UI (Individual/Corporate forms)
- [x] T070 Implement Lawyer Management UI
- [x] T071 Implement Law Firm Management UI
- [x] T072 Implement Court Management UI
- [x] T073 Implement Timesheet UI (global timer, case-specific timer)
- [x] T074 Implement Document Generation UI (template selection, upload, download)
- [x] T075 Implement Notification Preferences UI

## Phase 3.4: Integration
- [x] T076 Connect `frontend` to `backend/api_service` APIs
- [x] T077 Connect `backend/api_service` to `backend/docgen_service` internal API
- [x] T078 Integrate with LINE Messaging API for notifications
- [x] T079 Integrate with Google Calendar API
- [x] T080 Integrate with Microsoft Outlook Calendar API
- [x] T081 Implement centralized error handling and logging
- [x] T082 Implement CORS and security headers

## Phase 3.5: Polish
- [x] T083 [P] Write unit tests for complex business logic functions
- [x] T084 Performance testing and optimization
- [x] T085 Update API documentation (OpenAPI spec comments)
- [x] T086 User Manual / Help Documentation
- [x] T087 Remove any code duplication or technical debt
- [x] T088 Run manual testing based on `quickstart.md`

## Dependencies
- Phase 3.2 (Tests First) MUST be completed before Phase 3.3 (Core Implementation)
- Model CRUD services (T040-T049) block API Endpoints (T050-T054)
- Core Logic (T055-T061) depends on relevant CRUD services
- Document Generation Service (T062-T065) depends on its own setup (T003, T006)
- Frontend (T066-T075) depends on API Endpoints (T050-T054)
- Integration (T076-T082) depends on respective service implementations
- Polish (T083-T088) depends on all prior implementation

## Parallel Example
```
# Many tasks marked with [P] can be worked on in parallel.
# Example: After T007 (Setup) is done, T008-T028 (Data Model Tests) can be worked on in parallel.
# Similarly, T029-T033 (API Contract Tests) can be parallelized.
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Validation Checklist
- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
k specifies exact file path
- [ ] No task modifies same file as another [P] task
