import { Router, Request, Response } from 'express';
import { CaseService, CreateCaseData, UpdateCaseData } from '../models';

const router = Router();

// GET /cases - 案件一覧を取得
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, categoryId, status, name } = req.query;

    let cases;
    let total = 0;

    if (categoryId) {
      cases = await CaseService.findByCategoryId(categoryId as string);
      total = cases.length;
    } else if (status) {
      cases = await CaseService.findByStatus(status as string);
      total = cases.length;
    } else if (name) {
      cases = await CaseService.findByName(name as string);
      total = cases.length;
    } else {
      cases = await CaseService.findAll();
      total = cases.length;
    }

    // ページネーション適用
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedCases = cases.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedCases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cases',
      message: 'Internal server error'
    });
  }
});

// GET /cases/:id - 特定の案件を取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // IDの形式チェック
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid case ID',
        message: 'Case ID is required and must be a string'
      });
    }

    const case_ = await CaseService.findById(id);

    if (!case_) {
      return res.status(404).json({
        success: false,
        error: 'Case not found',
        message: `Case with ID ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: case_
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch case',
      message: 'Internal server error'
    });
  }
});

// POST /cases - 新しい案件を作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      caseNumber,
      categoryId,
      status,
      trialLevel,
      hourlyRate,
      firstConsultationDate,
      engagementDate,
      caseClosedDate,
      litigationStartDate,
      oralArgumentEndDate,
      judgmentDate,
      judgmentReceivedDate,
      hasEngagementLetter,
      engagementLetterPath,
      remarks,
      customProperties,
      currentPhaseId,
      courtDivisionId,
    } = req.body;

    // 必須フィールドの検証
    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Name and categoryId are required',
        details: {
          name: name ? 'Valid' : 'Required',
          categoryId: categoryId ? 'Valid' : 'Required'
        }
      });
    }

    // 事件番号の重複チェック
    if (caseNumber) {
      const existingCase = await CaseService.findByCaseNumber(caseNumber);
      if (existingCase) {
        return res.status(400).json({
          success: false,
          error: 'Case number already exists',
          message: `Case with number ${caseNumber} already exists`
        });
      }
    }

    const caseData: CreateCaseData = {
      name,
      caseNumber,
      categoryId,
      status,
      trialLevel,
      hourlyRate,
      firstConsultationDate: firstConsultationDate ? new Date(firstConsultationDate) : undefined,
      engagementDate: engagementDate ? new Date(engagementDate) : undefined,
      caseClosedDate: caseClosedDate ? new Date(caseClosedDate) : undefined,
      litigationStartDate: litigationStartDate ? new Date(litigationStartDate) : undefined,
      oralArgumentEndDate: oralArgumentEndDate ? new Date(oralArgumentEndDate) : undefined,
      judgmentDate: judgmentDate ? new Date(judgmentDate) : undefined,
      judgmentReceivedDate: judgmentReceivedDate ? new Date(judgmentReceivedDate) : undefined,
      hasEngagementLetter: hasEngagementLetter || false,
      engagementLetterPath,
      remarks,
      customProperties: customProperties || {},
      currentPhaseId,
      courtDivisionId,
    };

    const case_ = await CaseService.create(caseData);

    res.status(201).json({
      success: true,
      data: case_,
      message: 'Case created successfully'
    });
  } catch (error: any) {
    console.error('Error creating case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create case',
      message: 'Internal server error'
    });
  }
});

// PUT /cases/:id - 案件を更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      caseNumber,
      status,
      trialLevel,
      hourlyRate,
      firstConsultationDate,
      engagementDate,
      caseClosedDate,
      litigationStartDate,
      oralArgumentEndDate,
      judgmentDate,
      judgmentReceivedDate,
      hasEngagementLetter,
      engagementLetterPath,
      remarks,
      customProperties,
      categoryId,
      currentPhaseId,
      courtDivisionId,
    } = req.body;

    // IDの形式チェック
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid case ID',
        message: 'Case ID is required and must be a string'
      });
    }

    // 事件の存在チェック
    const existingCase = await CaseService.findById(id);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        error: 'Case not found',
        message: `Case with ID ${id} does not exist`
      });
    }

    // 事件番号の重複チェック（他の事件で使用されている場合）
    if (caseNumber && caseNumber !== existingCase.caseNumber) {
      const caseWithSameNumber = await CaseService.findByCaseNumber(caseNumber);
      if (caseWithSameNumber) {
        return res.status(400).json({
          success: false,
          error: 'Case number already exists',
          message: `Case with number ${caseNumber} already exists`
        });
      }
    }

    const updateData: UpdateCaseData = {
      name,
      caseNumber,
      status,
      trialLevel,
      hourlyRate,
      firstConsultationDate: firstConsultationDate ? new Date(firstConsultationDate) : undefined,
      engagementDate: engagementDate ? new Date(engagementDate) : undefined,
      caseClosedDate: caseClosedDate ? new Date(caseClosedDate) : undefined,
      litigationStartDate: litigationStartDate ? new Date(litigationStartDate) : undefined,
      oralArgumentEndDate: oralArgumentEndDate ? new Date(oralArgumentEndDate) : undefined,
      judgmentDate: judgmentDate ? new Date(judgmentDate) : undefined,
      judgmentReceivedDate: judgmentReceivedDate ? new Date(judgmentReceivedDate) : undefined,
      hasEngagementLetter,
      engagementLetterPath,
      remarks,
      customProperties,
      categoryId,
      currentPhaseId,
      courtDivisionId,
    };

    const case_ = await CaseService.update(id, updateData);

    res.json({
      success: true,
      data: case_,
      message: 'Case updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update case',
      message: 'Internal server error'
    });
  }
});

// DELETE /cases/:id - 案件を削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // IDの形式チェック
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid case ID',
        message: 'Case ID is required and must be a string'
      });
    }

    // 事件の存在チェック
    const existingCase = await CaseService.findById(id);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        error: 'Case not found',
        message: `Case with ID ${id} does not exist`
      });
    }

    await CaseService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete case',
      message: 'Internal server error'
    });
  }
});

// GET /cases/:id/parties - 案件の当事者一覧を取得
router.get('/:id/parties', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const caseParties = await CaseService.getCaseParties(id);

    res.json({ data: caseParties });
  } catch (error) {
    console.error('Error fetching case parties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /cases/:id/parties - 案件に当事者を追加
router.post('/:id/parties', async (req: Request, res: Response) => {
  try {
    const { id: caseId } = req.params;
    const { partyId, role } = req.body;

    if (!partyId || !role) {
      return res.status(400).json({
        error: 'partyId and role are required'
      });
    }

    const caseParty = await CaseService.addPartyToCase(caseId, partyId, role);

    res.status(201).json({ data: caseParty });
  } catch (error: any) {
    console.error('Error adding party to case:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Party already exists in this case with this role' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid caseId or partyId' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /cases/:id/parties/:partyId/:role - 案件から当事者を削除
router.delete('/:id/parties/:partyId/:role', async (req: Request, res: Response) => {
  try {
    const { id: caseId, partyId, role } = req.params;

    await CaseService.removePartyFromCase(caseId, partyId, role);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing party from case:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Case party not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
