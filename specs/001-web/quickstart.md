# Quickstart Guide: Lawyer Case Management Web Service

This guide provides a step-by-step walkthrough of the core functionalities of the LegalFlow application, demonstrating a typical user journey.

## Scenario: Managing a New Civil Litigation Case

### Step 1: User Registration and Login
1.  **Access the Application**: Open your web browser and navigate to the application URL.
2.  **Register a New Account**: If you don't have an account, click on "Sign Up" and fill in your details (email, password, name).
    -   *API Call*: `POST /users` (with user registration data)
3.  **Login**: After registration (or if you already have an account), enter your credentials to log in.
    -   *API Call*: `POST /auth/login` (with email and password)

### Step 2: Create a New Civil Litigation Case
1.  **Navigate to Case Management**: From the dashboard, click on "Cases" or "New Case".
2.  **Select Case Category**: Choose "民事訴訟" (Civil Litigation) as the case category.
    -   *API Call*: `GET /case-categories` (to fetch available categories)
3.  **Enter Case Details**: Provide the basic case name (e.g., "損害賠償請求事件").
4.  **Confirm Creation**: Click "Create Case". The system will automatically set the initial phase (e.g., "受任前").
    -   *API Call*: `POST /cases` (with `name`, `categoryId`)

### Step 3: Add Parties to the Case (Plaintiff and Defendant)
1.  **Access Case Details**: Navigate to the newly created case's detail page.
2.  **Add Plaintiff**: Click "Add Party" and select "個人" (Individual).
    -   Enter plaintiff's details (氏, 名, 住所など).
    -   Assign role: "原告" (Plaintiff).
    -   *API Call*: `POST /parties` (with `isCorporation: false`, `individual` data)
    -   *API Call*: `POST /cases/{caseId}/parties` (to link party to case with role)
3.  **Add Defendant**: Repeat the process for the defendant, selecting "個人" or "法人" as appropriate.
    -   Assign role: "被告" (Defendant).
    -   *API Call*: `POST /parties` (if new party) or `PUT /parties/{partyId}` (if existing)
    -   *API Call*: `POST /cases/{caseId}/parties` (to link party to case with role)

### Step 4: Log Time for the Case
1.  **Start Global Timer**: From the top navigation bar, click the "Start Timer" button.
2.  **Perform Work**: Work on the case.
3.  **Stop Timer**: Click "Stop Timer". A dialog appears.
4.  **Assign Time to Case**: In the dialog, confirm the duration and select the current case from the dropdown.
    -   *API Call*: `POST /timesheet-entries` (with `caseId`, `startTime`, `endTime`, `description`)

### Step 5: Generate a Document (e.g., Complaint)
1.  **Navigate to Document Generation**: From the case detail page, click "Generate Document".
2.  **Select Template**: Choose a template (e.g., "訴状テンプレート").
    -   *API Call*: `GET /document-templates`
3.  **Upload Source Document (Optional)**: Upload a PDF or DOCX document containing relevant information.
    -   *API Call*: `POST /document-processing` (to extract data)
4.  **Review and Confirm Data**: Review the extracted and pre-filled data. Make any necessary adjustments.
5.  **Generate Document**: Click "Generate". The system will create the document and offer a download link.
    -   *API Call*: `POST /document-generation` (with `templateId`, `caseId`, `dataOverrides`)

## Conclusion
This quickstart guide demonstrates the core flow of managing a case from creation to document generation. Further features like task management, detailed reporting, and notification settings can be explored within the application.
