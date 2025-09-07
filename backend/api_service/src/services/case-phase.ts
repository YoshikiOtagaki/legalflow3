import { PrismaClient } from '@prisma/client';
import { CaseService, CasePhaseService, TaskService, PhaseTransitionRuleService } from '../models';

const prisma = new PrismaClient();

// ケースフェーズの定義
export enum CasePhase {
  INITIAL_CONSULTATION = 'Initial Consultation',
  CASE_ACCEPTANCE = 'Case Acceptance',
  INVESTIGATION = 'Investigation',
  PREPARATION = 'Preparation',
  NEGOTIATION = 'Negotiation',
  LITIGATION = 'Litigation',
  SETTLEMENT = 'Settlement',
  TRIAL = 'Trial',
  APPEAL = 'Appeal',
  CLOSURE = 'Closure'
}

// フェーズ遷移の型定義
export interface PhaseTransition {
  fromPhase: CasePhase;
  toPhase: CasePhase;
  conditions: string[];
  requiredTasks: string[];
  optionalTasks: string[];
  estimatedDuration: number; // 日数
  isAutomatic: boolean;
}

// タスクテンプレートの型定義
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  phase: CasePhase;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedHours: number;
  requiredSkills: string[];
  dependencies: string[];
  isRecurring: boolean;
  recurrencePattern?: string;
}

// フェーズ遷移ルールの定義
export const PHASE_TRANSITIONS: PhaseTransition[] = [
  {
    fromPhase: CasePhase.INITIAL_CONSULTATION,
    toPhase: CasePhase.CASE_ACCEPTANCE,
    conditions: ['Client agreement signed', 'Retainer paid'],
    requiredTasks: ['Review case details', 'Prepare retainer agreement', 'Collect initial payment'],
    optionalTasks: ['Conduct conflict check', 'Prepare case strategy'],
    estimatedDuration: 3,
    isAutomatic: false
  },
  {
    fromPhase: CasePhase.CASE_ACCEPTANCE,
    toPhase: CasePhase.INVESTIGATION,
    conditions: ['Case file opened', 'Client onboarding completed'],
    requiredTasks: ['Open case file', 'Gather initial documents', 'Identify key witnesses'],
    optionalTasks: ['Conduct preliminary research', 'Schedule client meeting'],
    estimatedDuration: 7,
    isAutomatic: true
  },
  {
    fromPhase: CasePhase.INVESTIGATION,
    toPhase: CasePhase.PREPARATION,
    conditions: ['Investigation completed', 'Evidence gathered'],
    requiredTasks: ['Complete investigation report', 'Organize evidence', 'Prepare case timeline'],
    optionalTasks: ['Conduct additional research', 'Interview additional witnesses'],
    estimatedDuration: 14,
    isAutomatic: true
  },
  {
    fromPhase: CasePhase.PREPARATION,
    toPhase: CasePhase.NEGOTIATION,
    conditions: ['Case strategy finalized', 'Negotiation plan prepared'],
    requiredTasks: ['Finalize case strategy', 'Prepare negotiation materials', 'Schedule negotiation meeting'],
    optionalTasks: ['Conduct mock negotiations', 'Prepare alternative strategies'],
    estimatedDuration: 10,
    isAutomatic: false
  },
  {
    fromPhase: CasePhase.NEGOTIATION,
    toPhase: CasePhase.SETTLEMENT,
    conditions: ['Settlement agreement reached'],
    requiredTasks: ['Draft settlement agreement', 'Review terms with client', 'Execute settlement'],
    optionalTasks: ['Prepare settlement documentation', 'Schedule settlement meeting'],
    estimatedDuration: 5,
    isAutomatic: false
  },
  {
    fromPhase: CasePhase.NEGOTIATION,
    toPhase: CasePhase.LITIGATION,
    conditions: ['Negotiation failed', 'Client authorizes litigation'],
    requiredTasks: ['File lawsuit', 'Serve defendant', 'Prepare litigation strategy'],
    optionalTasks: ['Conduct additional discovery', 'Prepare for court appearances'],
    estimatedDuration: 3,
    isAutomatic: false
  },
  {
    fromPhase: CasePhase.LITIGATION,
    toPhase: CasePhase.TRIAL,
    conditions: ['Discovery completed', 'Trial date set'],
    requiredTasks: ['Complete discovery', 'Prepare trial materials', 'Schedule trial'],
    optionalTasks: ['Conduct mock trials', 'Prepare witnesses'],
    estimatedDuration: 30,
    isAutomatic: true
  },
  {
    fromPhase: CasePhase.TRIAL,
    toPhase: CasePhase.APPEAL,
    conditions: ['Trial completed', 'Client authorizes appeal'],
    requiredTasks: ['File notice of appeal', 'Prepare appellate brief', 'Schedule oral arguments'],
    optionalTasks: ['Conduct additional research', 'Prepare for appellate court'],
    estimatedDuration: 7,
    isAutomatic: false
  },
  {
    fromPhase: CasePhase.SETTLEMENT,
    toPhase: CasePhase.CLOSURE,
    conditions: ['Settlement executed', 'All obligations fulfilled'],
    requiredTasks: ['Execute settlement', 'Close case file', 'Send final bill'],
    optionalTasks: ['Prepare case summary', 'Archive documents'],
    estimatedDuration: 2,
    isAutomatic: true
  },
  {
    fromPhase: CasePhase.TRIAL,
    toPhase: CasePhase.CLOSURE,
    conditions: ['Trial completed', 'Judgment entered'],
    requiredTasks: ['Enter judgment', 'Close case file', 'Send final bill'],
    optionalTasks: ['Prepare case summary', 'Archive documents'],
    estimatedDuration: 3,
    isAutomatic: true
  },
  {
    fromPhase: CasePhase.APPEAL,
    toPhase: CasePhase.CLOSURE,
    conditions: ['Appeal completed', 'Final judgment entered'],
    requiredTasks: ['Enter final judgment', 'Close case file', 'Send final bill'],
    optionalTasks: ['Prepare case summary', 'Archive documents'],
    estimatedDuration: 2,
    isAutomatic: true
  }
];

// フェーズ別タスクテンプレート
export const PHASE_TASK_TEMPLATES: Record<CasePhase, TaskTemplate[]> = {
  [CasePhase.INITIAL_CONSULTATION]: [
    {
      id: 'consult-001',
      name: 'Initial Client Meeting',
      description: 'Conduct initial consultation with client',
      phase: CasePhase.INITIAL_CONSULTATION,
      priority: 'High',
      estimatedHours: 2,
      requiredSkills: ['Client communication', 'Legal analysis'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'consult-002',
      name: 'Case Assessment',
      description: 'Assess case merits and potential outcomes',
      phase: CasePhase.INITIAL_CONSULTATION,
      priority: 'High',
      estimatedHours: 3,
      requiredSkills: ['Legal research', 'Case analysis'],
      dependencies: ['consult-001'],
      isRecurring: false
    }
  ],
  [CasePhase.CASE_ACCEPTANCE]: [
    {
      id: 'accept-001',
      name: 'Prepare Retainer Agreement',
      description: 'Draft and prepare retainer agreement',
      phase: CasePhase.CASE_ACCEPTANCE,
      priority: 'Critical',
      estimatedHours: 2,
      requiredSkills: ['Contract drafting'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'accept-002',
      name: 'Client Onboarding',
      description: 'Complete client onboarding process',
      phase: CasePhase.CASE_ACCEPTANCE,
      priority: 'High',
      estimatedHours: 1,
      requiredSkills: ['Client communication'],
      dependencies: ['accept-001'],
      isRecurring: false
    }
  ],
  [CasePhase.INVESTIGATION]: [
    {
      id: 'invest-001',
      name: 'Gather Evidence',
      description: 'Collect and organize case evidence',
      phase: CasePhase.INVESTIGATION,
      priority: 'High',
      estimatedHours: 8,
      requiredSkills: ['Evidence collection', 'Document review'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'invest-002',
      name: 'Interview Witnesses',
      description: 'Conduct witness interviews',
      phase: CasePhase.INVESTIGATION,
      priority: 'High',
      estimatedHours: 6,
      requiredSkills: ['Interviewing', 'Legal analysis'],
      dependencies: ['invest-001'],
      isRecurring: false
    }
  ],
  [CasePhase.PREPARATION]: [
    {
      id: 'prep-001',
      name: 'Case Strategy Development',
      description: 'Develop comprehensive case strategy',
      phase: CasePhase.PREPARATION,
      priority: 'Critical',
      estimatedHours: 12,
      requiredSkills: ['Strategic thinking', 'Legal analysis'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'prep-002',
      name: 'Prepare Legal Documents',
      description: 'Draft necessary legal documents',
      phase: CasePhase.PREPARATION,
      priority: 'High',
      estimatedHours: 10,
      requiredSkills: ['Legal drafting'],
      dependencies: ['prep-001'],
      isRecurring: false
    }
  ],
  [CasePhase.NEGOTIATION]: [
    {
      id: 'negot-001',
      name: 'Prepare Negotiation Strategy',
      description: 'Develop negotiation approach and tactics',
      phase: CasePhase.NEGOTIATION,
      priority: 'High',
      estimatedHours: 4,
      requiredSkills: ['Negotiation', 'Strategic thinking'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'negot-002',
      name: 'Conduct Negotiations',
      description: 'Engage in settlement negotiations',
      phase: CasePhase.NEGOTIATION,
      priority: 'Critical',
      estimatedHours: 6,
      requiredSkills: ['Negotiation', 'Client communication'],
      dependencies: ['negot-001'],
      isRecurring: false
    }
  ],
  [CasePhase.LITIGATION]: [
    {
      id: 'litig-001',
      name: 'File Lawsuit',
      description: 'Prepare and file initial lawsuit documents',
      phase: CasePhase.LITIGATION,
      priority: 'Critical',
      estimatedHours: 4,
      requiredSkills: ['Legal drafting', 'Court procedures'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'litig-002',
      name: 'Discovery Process',
      description: 'Conduct discovery and respond to requests',
      phase: CasePhase.LITIGATION,
      priority: 'High',
      estimatedHours: 20,
      requiredSkills: ['Discovery', 'Document review'],
      dependencies: ['litig-001'],
      isRecurring: false
    }
  ],
  [CasePhase.SETTLEMENT]: [
    {
      id: 'settle-001',
      name: 'Draft Settlement Agreement',
      description: 'Prepare comprehensive settlement agreement',
      phase: CasePhase.SETTLEMENT,
      priority: 'Critical',
      estimatedHours: 3,
      requiredSkills: ['Contract drafting'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'settle-002',
      name: 'Execute Settlement',
      description: 'Finalize and execute settlement agreement',
      phase: CasePhase.SETTLEMENT,
      priority: 'High',
      estimatedHours: 1,
      requiredSkills: ['Client communication'],
      dependencies: ['settle-001'],
      isRecurring: false
    }
  ],
  [CasePhase.TRIAL]: [
    {
      id: 'trial-001',
      name: 'Trial Preparation',
      description: 'Prepare for trial proceedings',
      phase: CasePhase.TRIAL,
      priority: 'Critical',
      estimatedHours: 16,
      requiredSkills: ['Trial preparation', 'Evidence organization'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'trial-002',
      name: 'Conduct Trial',
      description: 'Represent client in trial proceedings',
      phase: CasePhase.TRIAL,
      priority: 'Critical',
      estimatedHours: 24,
      requiredSkills: ['Trial advocacy', 'Court procedures'],
      dependencies: ['trial-001'],
      isRecurring: false
    }
  ],
  [CasePhase.APPEAL]: [
    {
      id: 'appeal-001',
      name: 'Prepare Appellate Brief',
      description: 'Draft appellate brief and supporting documents',
      phase: CasePhase.APPEAL,
      priority: 'Critical',
      estimatedHours: 12,
      requiredSkills: ['Legal research', 'Brief writing'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'appeal-002',
      name: 'Oral Arguments',
      description: 'Present oral arguments before appellate court',
      phase: CasePhase.APPEAL,
      priority: 'Critical',
      estimatedHours: 2,
      requiredSkills: ['Oral advocacy', 'Court procedures'],
      dependencies: ['appeal-001'],
      isRecurring: false
    }
  ],
  [CasePhase.CLOSURE]: [
    {
      id: 'close-001',
      name: 'Case File Closure',
      description: 'Close case file and archive documents',
      phase: CasePhase.CLOSURE,
      priority: 'High',
      estimatedHours: 2,
      requiredSkills: ['File management'],
      dependencies: [],
      isRecurring: false
    },
    {
      id: 'close-002',
      name: 'Final Billing',
      description: 'Prepare and send final bill to client',
      phase: CasePhase.CLOSURE,
      priority: 'High',
      estimatedHours: 1,
      requiredSkills: ['Billing', 'Client communication'],
      dependencies: ['close-001'],
      isRecurring: false
    }
  ]
};

// ケースフェーズ管理サービスクラス
export class CasePhaseManagementService {
  /**
   * ケースのフェーズを遷移
   * @param caseId ケースID
   * @param newPhase 新しいフェーズ
   * @param transitionedBy 遷移者ID
   * @param reason 遷移理由
   * @returns 遷移結果
   */
  static async transitionPhase(
    caseId: string,
    newPhase: CasePhase,
    transitionedBy: string,
    reason?: string
  ): Promise<{
    success: boolean;
    oldPhase: string;
    newPhase: string;
    generatedTasks: any[];
    message: string;
  }> {
    try {
      // ケース情報を取得
      const caseData = await CaseService.findById(caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      const oldPhase = caseData.phase || CasePhase.INITIAL_CONSULTATION;

      // 遷移の妥当性をチェック
      const isValidTransition = await this.validatePhaseTransition(oldPhase, newPhase);
      if (!isValidTransition) {
        throw new Error(`Invalid phase transition from ${oldPhase} to ${newPhase}`);
      }

      // 遷移ルールを取得
      const transitionRule = this.getTransitionRule(oldPhase, newPhase);
      if (!transitionRule) {
        throw new Error(`No transition rule found for ${oldPhase} to ${newPhase}`);
      }

      // 条件をチェック
      const conditionsMet = await this.checkTransitionConditions(caseId, transitionRule);
      if (!conditionsMet) {
        throw new Error('Transition conditions not met');
      }

      // トランザクションで実行
      const result = await prisma.$transaction(async (tx) => {
        // ケースのフェーズを更新
        const updatedCase = await tx.case.update({
          where: { id: caseId },
          data: {
            phase: newPhase,
            updatedAt: new Date()
          }
        });

        // フェーズ遷移履歴を記録
        await tx.caseEvent.create({
          data: {
            caseId,
            type: 'PhaseTransition',
            title: `Phase transitioned from ${oldPhase} to ${newPhase}`,
            description: reason || `Case phase changed from ${oldPhase} to ${newPhase}`,
            eventDate: new Date(),
            createdBy: transitionedBy
          }
        });

        // 自動タスクを生成
        const generatedTasks = await this.generatePhaseTasks(
          caseId,
          newPhase,
          transitionedBy,
          tx
        );

        return {
          updatedCase,
          generatedTasks
        };
      });

      return {
        success: true,
        oldPhase,
        newPhase,
        generatedTasks: result.generatedTasks,
        message: `Successfully transitioned case from ${oldPhase} to ${newPhase}`
      };
    } catch (error) {
      console.error('Error transitioning phase:', error);
      throw new Error('Failed to transition case phase');
    }
  }

  /**
   * フェーズ遷移の妥当性をチェック
   * @param fromPhase 現在のフェーズ
   * @param toPhase 遷移先のフェーズ
   * @returns 遷移可能かどうか
   */
  private static async validatePhaseTransition(
    fromPhase: string,
    toPhase: CasePhase
  ): Promise<boolean> {
    // 同じフェーズへの遷移は不可
    if (fromPhase === toPhase) {
      return false;
    }

    // クロージャーフェーズからの遷移は不可
    if (fromPhase === CasePhase.CLOSURE) {
      return false;
    }

    // 有効な遷移ルールが存在するかチェック
    const transitionRule = this.getTransitionRule(fromPhase as CasePhase, toPhase);
    return !!transitionRule;
  }

  /**
   * 遷移ルールを取得
   * @param fromPhase 現在のフェーズ
   * @param toPhase 遷移先のフェーズ
   * @returns 遷移ルール
   */
  private static getTransitionRule(
    fromPhase: CasePhase,
    toPhase: CasePhase
  ): PhaseTransition | undefined {
    return PHASE_TRANSITIONS.find(
      rule => rule.fromPhase === fromPhase && rule.toPhase === toPhase
    );
  }

  /**
   * 遷移条件をチェック
   * @param caseId ケースID
   * @param transitionRule 遷移ルール
   * @returns 条件を満たすかどうか
   */
  private static async checkTransitionConditions(
    caseId: string,
    transitionRule: PhaseTransition
  ): Promise<boolean> {
    // 基本的な条件チェック（実際の実装では、より詳細な条件チェックが必要）
    // ここでは簡易的な実装として、常にtrueを返す
    return true;
  }

  /**
   * フェーズ用のタスクを生成
   * @param caseId ケースID
   * @param phase フェーズ
   * @param createdBy 作成者ID
   * @param tx トランザクション
   * @returns 生成されたタスク
   */
  private static async generatePhaseTasks(
    caseId: string,
    phase: CasePhase,
    createdBy: string,
    tx: any
  ): Promise<any[]> {
    const taskTemplates = PHASE_TASK_TEMPLATES[phase];
    const generatedTasks = [];

    for (const template of taskTemplates) {
      const task = await tx.task.create({
        data: {
          caseId,
          title: template.name,
          description: template.description,
          priority: template.priority,
          status: 'Pending',
          estimatedHours: template.estimatedHours,
          assignedTo: createdBy,
          dueDate: new Date(Date.now() + template.estimatedHours * 24 * 60 * 60 * 1000),
          createdBy,
          phase
        }
      });

      generatedTasks.push(task);
    }

    return generatedTasks;
  }

  /**
   * ケースのフェーズ履歴を取得
   * @param caseId ケースID
   * @returns フェーズ履歴
   */
  static async getPhaseHistory(caseId: string): Promise<any[]> {
    try {
      const history = await prisma.caseEvent.findMany({
        where: {
          caseId,
          type: 'PhaseTransition'
        },
        orderBy: { eventDate: 'desc' }
      });

      return history;
    } catch (error) {
      console.error('Error getting phase history:', error);
      throw new Error('Failed to get phase history');
    }
  }

  /**
   * フェーズ別の統計情報を取得
   * @param userId ユーザーID
   * @returns 統計情報
   */
  static async getPhaseStatistics(userId: string): Promise<{
    phaseDistribution: Record<string, number>;
    averagePhaseDuration: Record<string, number>;
    phaseTransitionCounts: Record<string, number>;
  }> {
    try {
      // フェーズ分布を取得
      const phaseDistribution = await prisma.case.groupBy({
        by: ['phase'],
        where: { userId },
        _count: { phase: true }
      });

      // フェーズ別の平均期間を計算
      const averagePhaseDuration: Record<string, number> = {};
      for (const phase of Object.values(CasePhase)) {
        const cases = await prisma.case.findMany({
          where: {
            userId,
            phase
          },
          select: {
            createdAt: true,
            updatedAt: true
          }
        });

        if (cases.length > 0) {
          const totalDuration = cases.reduce((sum, caseData) => {
            const duration = caseData.updatedAt.getTime() - caseData.createdAt.getTime();
            return sum + duration;
          }, 0);

          averagePhaseDuration[phase] = totalDuration / cases.length / (1000 * 60 * 60 * 24); // 日数
        }
      }

      // フェーズ遷移回数を取得
      const phaseTransitionCounts = await prisma.caseEvent.groupBy({
        by: ['title'],
        where: {
          type: 'PhaseTransition',
          case: { userId }
        },
        _count: { title: true }
      });

      return {
        phaseDistribution: phaseDistribution.reduce((acc, item) => {
          acc[item.phase || 'Unknown'] = item._count.phase;
          return acc;
        }, {} as Record<string, number>),
        averagePhaseDuration,
        phaseTransitionCounts: phaseTransitionCounts.reduce((acc, item) => {
          acc[item.title] = item._count.title;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error getting phase statistics:', error);
      throw new Error('Failed to get phase statistics');
    }
  }

  /**
   * 自動フェーズ遷移を実行
   * @param caseId ケースID
   * @returns 遷移結果
   */
  static async executeAutomaticTransitions(caseId: string): Promise<{
    transitions: any[];
    message: string;
  }> {
    try {
      const caseData = await CaseService.findById(caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      const currentPhase = caseData.phase as CasePhase;
      const automaticTransitions = PHASE_TRANSITIONS.filter(
        rule => rule.fromPhase === currentPhase && rule.isAutomatic
      );

      const transitions = [];

      for (const transitionRule of automaticTransitions) {
        const conditionsMet = await this.checkTransitionConditions(caseId, transitionRule);

        if (conditionsMet) {
          const result = await this.transitionPhase(
            caseId,
            transitionRule.toPhase,
            'system',
            'Automatic transition based on conditions'
          );
          transitions.push(result);
        }
      }

      return {
        transitions,
        message: `Executed ${transitions.length} automatic transitions`
      };
    } catch (error) {
      console.error('Error executing automatic transitions:', error);
      throw new Error('Failed to execute automatic transitions');
    }
  }

  /**
   * フェーズ遷移ルールを更新
   * @param ruleId ルールID
   * @param updates 更新内容
   * @returns 更新されたルール
   */
  static async updateTransitionRule(
    ruleId: string,
    updates: Partial<PhaseTransition>
  ): Promise<any> {
    try {
      const updatedRule = await PhaseTransitionRuleService.update(ruleId, updates);
      return updatedRule;
    } catch (error) {
      console.error('Error updating transition rule:', error);
      throw new Error('Failed to update transition rule');
    }
  }
}
