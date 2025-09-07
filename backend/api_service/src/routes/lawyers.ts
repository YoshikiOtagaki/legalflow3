import { Router, Request, Response } from 'express';
import { LawyerService, CreateLawyerData, UpdateLawyerData } from '../models';

const router = Router();

// GET /lawyers - 弁護士一覧を取得
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, officeId, lastName, firstName, registrationNumber } = req.query;

    let lawyers;
    let total = 0;

    if (officeId) {
      lawyers = await LawyerService.findByOfficeId(officeId as string);
      total = lawyers.length;
    } else if (lastName || firstName) {
      lawyers = await LawyerService.findByName(
        lastName as string,
        firstName as string
      );
      total = lawyers.length;
    } else if (registrationNumber) {
      const lawyer = await LawyerService.findByRegistrationNumber(registrationNumber as string);
      lawyers = lawyer ? [lawyer] : [];
      total = lawyers.length;
    } else {
      lawyers = await LawyerService.findAll();
      total = lawyers.length;
    }

    // ページネーション適用
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedLawyers = lawyers.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedLawyers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lawyers',
      message: 'Internal server error'
    });
  }
});

// GET /lawyers/:id - 特定の弁護士を取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid lawyer ID',
        message: 'Lawyer ID is required and must be a string'
      });
    }

    const lawyer = await LawyerService.findById(id);

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        error: 'Lawyer not found',
        message: `Lawyer with ID ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: lawyer
    });
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lawyer',
      message: 'Internal server error'
    });
  }
});

// POST /lawyers - 新しい弁護士を作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      honorific,
      registrationNumber,
      homePhone,
      homePostalCode,
      homeAddress1,
      homeAddress2,
      itemsInCustody,
      cautions,
      remarks,
      officeId,
    } = req.body;

    // 登録番号の重複チェック
    if (registrationNumber) {
      const existingLawyer = await LawyerService.findByRegistrationNumber(registrationNumber);
      if (existingLawyer) {
        return res.status(400).json({
          success: false,
          error: 'Registration number already exists',
          message: `Lawyer with registration number ${registrationNumber} already exists`
        });
      }
    }

    const lawyerData: CreateLawyerData = {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      honorific,
      registrationNumber,
      homePhone,
      homePostalCode,
      homeAddress1,
      homeAddress2,
      itemsInCustody,
      cautions,
      remarks,
      officeId,
    };

    const lawyer = await LawyerService.create(lawyerData);

    res.status(201).json({
      success: true,
      data: lawyer,
      message: 'Lawyer created successfully'
    });
  } catch (error: any) {
    console.error('Error creating lawyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lawyer',
      message: 'Internal server error'
    });
  }
});

// PUT /lawyers/:id - 弁護士を更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      honorific,
      registrationNumber,
      homePhone,
      homePostalCode,
      homeAddress1,
      homeAddress2,
      itemsInCustody,
      cautions,
      remarks,
      officeId,
    } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid lawyer ID',
        message: 'Lawyer ID is required and must be a string'
      });
    }

    const existingLawyer = await LawyerService.findById(id);
    if (!existingLawyer) {
      return res.status(404).json({
        success: false,
        error: 'Lawyer not found',
        message: `Lawyer with ID ${id} does not exist`
      });
    }

    // 登録番号の重複チェック（他の弁護士で使用されている場合）
    if (registrationNumber && registrationNumber !== existingLawyer.registrationNumber) {
      const lawyerWithSameNumber = await LawyerService.findByRegistrationNumber(registrationNumber);
      if (lawyerWithSameNumber) {
        return res.status(400).json({
          success: false,
          error: 'Registration number already exists',
          message: `Lawyer with registration number ${registrationNumber} already exists`
        });
      }
    }

    const updateData: UpdateLawyerData = {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      honorific,
      registrationNumber,
      homePhone,
      homePostalCode,
      homeAddress1,
      homeAddress2,
      itemsInCustody,
      cautions,
      remarks,
      officeId,
    };

    const lawyer = await LawyerService.update(id, updateData);

    res.json({
      success: true,
      data: lawyer,
      message: 'Lawyer updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating lawyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lawyer',
      message: 'Internal server error'
    });
  }
});

// DELETE /lawyers/:id - 弁護士を削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid lawyer ID',
        message: 'Lawyer ID is required and must be a string'
      });
    }

    const existingLawyer = await LawyerService.findById(id);
    if (!existingLawyer) {
      return res.status(404).json({
        success: false,
        error: 'Lawyer not found',
        message: `Lawyer with ID ${id} does not exist`
      });
    }

    await LawyerService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Lawyer deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting lawyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lawyer',
      message: 'Internal server error'
    });
  }
});

export default router;
