import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('CaseEvent and HearingReport Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create CaseEvent', () => {
    let caseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト事件',
          categoryId: category.id,
        },
      });
      caseId = case_.id;
    });

    it('should create a new case event with required fields', async () => {
      const eventData = {
        caseId: caseId,
        eventType: 'hearing',
        dateTime: new Date('2024-12-15T10:00:00Z'),
        location: '東京地方裁判所',
      };

      const event = await prisma.caseEvent.create({
        data: eventData,
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.caseId).toBe(caseId);
      expect(event.eventType).toBe(eventData.eventType);
      expect(event.dateTime).toEqual(eventData.dateTime);
      expect(event.location).toBe(eventData.location);
    });

    it('should create a case event with minimal required fields', async () => {
      const event = await prisma.caseEvent.create({
        data: {
          caseId: caseId,
          eventType: 'meeting',
          dateTime: new Date('2024-12-20T14:00:00Z'),
        },
      });

      expect(event).toBeDefined();
      expect(event.caseId).toBe(caseId);
      expect(event.eventType).toBe('meeting');
      expect(event.location).toBeNull();
    });

    it('should create a case event with different event types', async () => {
      const eventTypes = ['hearing', 'meeting', 'deposition', 'mediation', 'settlement'];

      for (const eventType of eventTypes) {
        const event = await prisma.caseEvent.create({
          data: {
            caseId: caseId,
            eventType: eventType,
            dateTime: new Date('2024-12-15T10:00:00Z'),
          },
        });

        expect(event.eventType).toBe(eventType);
      }
    });

    it('should fail to create event without case', async () => {
      await expect(
        prisma.caseEvent.create({
          data: {
            caseId: 'non-existent-case-id',
            eventType: 'hearing',
            dateTime: new Date('2024-12-15T10:00:00Z'),
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CaseEvent', () => {
    let eventId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '読取テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
          location: '東京地方裁判所',
        },
      });
      eventId = event.id;
    });

    it('should find case event by id', async () => {
      const foundEvent = await prisma.caseEvent.findUnique({
        where: { id: eventId },
      });

      expect(foundEvent).toBeDefined();
      expect(foundEvent?.id).toBe(eventId);
      expect(foundEvent?.eventType).toBe('hearing');
    });

    it('should find case event with case relation', async () => {
      const foundEvent = await prisma.caseEvent.findUnique({
        where: { id: eventId },
        include: {
          case: true,
        },
      });

      expect(foundEvent?.case).toBeDefined();
      expect(foundEvent?.case.name).toBe('読取テスト事件');
    });

    it('should find case event with hearing report relation', async () => {
      await prisma.hearingReport.create({
        data: {
          caseEventId: eventId,
          attendees: {
            judge: '田中裁判官',
            clerk: '佐藤書記官',
            plaintiff: '山田原告',
            defendant: '鈴木被告',
          },
          notes: '重要な証言が得られた',
        },
      });

      const foundEvent = await prisma.caseEvent.findUnique({
        where: { id: eventId },
        include: {
          report: true,
        },
      });

      expect(foundEvent?.report).toBeDefined();
      expect(foundEvent?.report?.notes).toBe('重要な証言が得られた');
    });

    it('should find all case events', async () => {
      const events = await prisma.caseEvent.findMany();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hearing');
    });

    it('should find case events by event type', async () => {
      const hearingEvents = await prisma.caseEvent.findMany({
        where: { eventType: 'hearing' },
      });

      const meetingEvents = await prisma.caseEvent.findMany({
        where: { eventType: 'meeting' },
      });

      expect(hearingEvents).toHaveLength(1);
      expect(meetingEvents).toHaveLength(0);
    });

    it('should find case events by case', async () => {
      const caseEvents = await prisma.caseEvent.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(caseEvents).toHaveLength(1);
      expect(caseEvents[0].eventType).toBe('hearing');
    });

    it('should find case events by date range', async () => {
      const events = await prisma.caseEvent.findMany({
        where: {
          dateTime: {
            gte: new Date('2024-12-01'),
            lte: new Date('2024-12-31'),
          },
        },
      });

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('hearing');
    });

    it('should return null for non-existent event', async () => {
      const foundEvent = await prisma.caseEvent.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundEvent).toBeNull();
    });
  });

  describe('Update CaseEvent', () => {
    let eventId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '更新テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'meeting',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });
      eventId = event.id;
    });

    it('should update case event type', async () => {
      const updatedEvent = await prisma.caseEvent.update({
        where: { id: eventId },
        data: {
          eventType: 'hearing',
        },
      });

      expect(updatedEvent.eventType).toBe('hearing');
    });

    it('should update case event date time', async () => {
      const newDateTime = new Date('2024-12-20T14:00:00Z');
      const updatedEvent = await prisma.caseEvent.update({
        where: { id: eventId },
        data: {
          dateTime: newDateTime,
        },
      });

      expect(updatedEvent.dateTime).toEqual(newDateTime);
    });

    it('should update case event location', async () => {
      const updatedEvent = await prisma.caseEvent.update({
        where: { id: eventId },
        data: {
          location: '大阪地方裁判所',
        },
      });

      expect(updatedEvent.location).toBe('大阪地方裁判所');
    });

    it('should fail to update non-existent event', async () => {
      await expect(
        prisma.caseEvent.update({
          where: { id: 'non-existent-id' },
          data: { eventType: 'hearing' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CaseEvent', () => {
    let eventId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '削除テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });
      eventId = event.id;
    });

    it('should delete case event by id', async () => {
      const deletedEvent = await prisma.caseEvent.delete({
        where: { id: eventId },
      });

      expect(deletedEvent.id).toBe(eventId);
      expect(deletedEvent.eventType).toBe('hearing');

      const foundEvent = await prisma.caseEvent.findUnique({
        where: { id: eventId },
      });
      expect(foundEvent).toBeNull();
    });

    it('should fail to delete non-existent event', async () => {
      await expect(
        prisma.caseEvent.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create HearingReport', () => {
    let eventId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '報告書テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '報告書テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });
      eventId = event.id;
    });

    it('should create a new hearing report with required fields', async () => {
      const reportData = {
        caseEventId: eventId,
        attendees: {
          judge: '田中裁判官',
          clerk: '佐藤書記官',
          plaintiff: '山田原告',
          defendant: '鈴木被告',
        },
        notes: '重要な証言が得られた',
      };

      const report = await prisma.hearingReport.create({
        data: reportData,
      });

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.caseEventId).toBe(eventId);
      expect(report.attendees).toEqual(reportData.attendees);
      expect(report.notes).toBe(reportData.notes);
    });

    it('should create a hearing report with minimal required fields', async () => {
      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: eventId,
          attendees: {
            judge: '田中裁判官',
          },
        },
      });

      expect(report).toBeDefined();
      expect(report.caseEventId).toBe(eventId);
      expect(report.notes).toBeNull();
    });

    it('should create a hearing report with complex attendees data', async () => {
      const complexAttendees = {
        judge: '田中裁判官',
        clerk: '佐藤書記官',
        plaintiff: {
          name: '山田原告',
          lawyer: '田中弁護士',
        },
        defendant: {
          name: '鈴木被告',
          lawyer: '佐藤弁護士',
        },
        witnesses: [
          { name: '証人A', role: '目撃者' },
          { name: '証人B', role: '専門家' },
        ],
      };

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: eventId,
          attendees: complexAttendees,
        },
      });

      expect(report.attendees).toEqual(complexAttendees);
    });

    it('should fail to create report without case event', async () => {
      await expect(
        prisma.hearingReport.create({
          data: {
            caseEventId: 'non-existent-event-id',
            attendees: { judge: '田中裁判官' },
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create duplicate report for same event', async () => {
      await prisma.hearingReport.create({
        data: {
          caseEventId: eventId,
          attendees: { judge: '田中裁判官' },
        },
      });

      await expect(
        prisma.hearingReport.create({
          data: {
            caseEventId: eventId,
            attendees: { judge: '佐藤裁判官' },
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read HearingReport', () => {
    let reportId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '報告書読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '報告書読取テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
            clerk: '佐藤書記官',
          },
          notes: '読取テスト備考',
        },
      });
      reportId = report.id;
    });

    it('should find hearing report by id', async () => {
      const foundReport = await prisma.hearingReport.findUnique({
        where: { id: reportId },
      });

      expect(foundReport).toBeDefined();
      expect(foundReport?.id).toBe(reportId);
      expect(foundReport?.notes).toBe('読取テスト備考');
    });

    it('should find hearing report with case event relation', async () => {
      const foundReport = await prisma.hearingReport.findUnique({
        where: { id: reportId },
        include: {
          caseEvent: {
            include: {
              case: true,
            },
          },
        },
      });

      expect(foundReport?.caseEvent).toBeDefined();
      expect(foundReport?.caseEvent.eventType).toBe('hearing');
      expect(foundReport?.caseEvent.case.name).toBe('報告書読取テスト事件');
    });

    it('should find all hearing reports', async () => {
      const reports = await prisma.hearingReport.findMany();

      expect(reports).toHaveLength(1);
      expect(reports[0].notes).toBe('読取テスト備考');
    });

    it('should return null for non-existent report', async () => {
      const foundReport = await prisma.hearingReport.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundReport).toBeNull();
    });
  });

  describe('Update HearingReport', () => {
    let reportId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '報告書更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '報告書更新テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
          notes: '更新前備考',
        },
      });
      reportId = report.id;
    });

    it('should update hearing report attendees', async () => {
      const newAttendees = {
        judge: '佐藤裁判官',
        clerk: '田中書記官',
        plaintiff: '山田原告',
      };

      const updatedReport = await prisma.hearingReport.update({
        where: { id: reportId },
        data: {
          attendees: newAttendees,
        },
      });

      expect(updatedReport.attendees).toEqual(newAttendees);
    });

    it('should update hearing report notes', async () => {
      const updatedReport = await prisma.hearingReport.update({
        where: { id: reportId },
        data: {
          notes: '更新後備考',
        },
      });

      expect(updatedReport.notes).toBe('更新後備考');
    });

    it('should fail to update non-existent report', async () => {
      await expect(
        prisma.hearingReport.update({
          where: { id: 'non-existent-id' },
          data: { notes: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete HearingReport', () => {
    let reportId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '報告書削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '報告書削除テスト事件',
          categoryId: category.id,
        },
      });

      const event = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const report = await prisma.hearingReport.create({
        data: {
          caseEventId: event.id,
          attendees: {
            judge: '田中裁判官',
          },
          notes: '削除テスト備考',
        },
      });
      reportId = report.id;
    });

    it('should delete hearing report by id', async () => {
      const deletedReport = await prisma.hearingReport.delete({
        where: { id: reportId },
      });

      expect(deletedReport.id).toBe(reportId);
      expect(deletedReport.notes).toBe('削除テスト備考');

      const foundReport = await prisma.hearingReport.findUnique({
        where: { id: reportId },
      });
      expect(foundReport).toBeNull();
    });

    it('should fail to delete non-existent report', async () => {
      await expect(
        prisma.hearingReport.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('CaseEvent and HearingReport Relations', () => {
    it('should find case with events and reports', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '関係テスト事件',
          categoryId: category.id,
        },
      });

      const event1 = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'hearing',
          dateTime: new Date('2024-12-15T10:00:00Z'),
        },
      });

      const event2 = await prisma.caseEvent.create({
        data: {
          caseId: case_.id,
          eventType: 'meeting',
          dateTime: new Date('2024-12-20T14:00:00Z'),
        },
      });

      await prisma.hearingReport.create({
        data: {
          caseEventId: event1.id,
          attendees: { judge: '田中裁判官' },
          notes: 'ヒアリング報告',
        },
      });

      const caseWithEvents = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          events: {
            include: {
              report: true,
            },
          },
        },
      });

      expect(caseWithEvents?.events).toHaveLength(2);
      expect(caseWithEvents?.events[0].report).toBeDefined();
      expect(caseWithEvents?.events[1].report).toBeNull();
    });
  });
});
