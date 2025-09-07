
import { prisma } from '../setup';

export async function cleanupDatabase() {
  // Delete records in an order that respects foreign key constraints.
  // Start with models that have the most dependencies on them.
  await prisma.notification.deleteMany();
  await prisma.submittedDocument.deleteMany();
  await prisma.hearingReport.deleteMany();
  await prisma.caseAssignment.deleteMany();
  await prisma.caseParty.deleteMany();
  await prisma.task.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.memo.deleteMany();
  await prisma.caseEvent.deleteMany();

  // Models that are depended upon by the above
  await prisma.phaseTransitionRule.deleteMany();
  await prisma.taskTemplateItem.deleteMany();
  await prisma.taskTemplate.deleteMany();
  await prisma.case.deleteMany();
  await prisma.casePhase.deleteMany();
  await prisma.jurisdictionRule.deleteMany();
  await prisma.caseCategory.deleteMany();

  // Lawyer and Law Firm related
  await prisma.lawyer.deleteMany();
  await prisma.lawFirmOffice.deleteMany();
  await prisma.lawFirm.deleteMany();

  // Court related
  await prisma.courtPersonnel.deleteMany();
  await prisma.courtDivision.deleteMany();
  await prisma.courthouse.deleteMany();

  // Party and Profile related
  await prisma.individualProfile.deleteMany();
  await prisma.corporateProfile.deleteMany();
  await prisma.party.deleteMany();

  // User and Subscription related
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
}
