import { Router, Request, Response } from 'express';
import { LawFirmService, LawFirmOfficeService, CreateLawFirmData, UpdateLawFirmData, CreateLawFirmOfficeData, UpdateLawFirmOfficeData } from '../models';

const router = Router();

// GET /law-firms - 法律事務所一覧を取得
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, name } = req.query;

    let lawFirms;
    let total = 0;

    if (name) {
      lawFirms = await LawFirmService.findByName(name as string);
      total = lawFirms.length;
    } else {
      lawFirms = await LawFirmService.findAll();
      total = lawFirms.length;
    }

    // ページネーション適用
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedLawFirms = lawFirms.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedLawFirms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching law firms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch law firms',
      message: 'Internal server error'
    });
  }
});

// GET /law-firms/:id - 特定の法律事務所を取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid law firm ID',
        message: 'Law firm ID is required and must be a string'
      });
    }

    const lawFirm = await LawFirmService.findById(id);

    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        error: 'Law firm not found',
        message: `Law firm with ID ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: lawFirm
    });
  } catch (error) {
    console.error('Error fetching law firm:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch law firm',
      message: 'Internal server error'
    });
  }
});

// POST /law-firms - 新しい法律事務所を作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Name is required',
        details: {
          name: name ? 'Valid' : 'Required'
        }
      });
    }

    // 名前の重複チェック
    const existingLawFirm = await LawFirmService.findByName(name);
    if (existingLawFirm.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Law firm name already exists',
        message: `Law firm with name ${name} already exists`
      });
    }

    const lawFirmData: CreateLawFirmData = {
      name,
    };

    const lawFirm = await LawFirmService.create(lawFirmData);

    res.status(201).json({
      success: true,
      data: lawFirm,
      message: 'Law firm created successfully'
    });
  } catch (error: any) {
    console.error('Error creating law firm:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create law firm',
      message: 'Internal server error'
    });
  }
});

// PUT /law-firms/:id - 法律事務所を更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid law firm ID',
        message: 'Law firm ID is required and must be a string'
      });
    }

    const existingLawFirm = await LawFirmService.findById(id);
    if (!existingLawFirm) {
      return res.status(404).json({
        success: false,
        error: 'Law firm not found',
        message: `Law firm with ID ${id} does not exist`
      });
    }

    // 名前の重複チェック（他の法律事務所で使用されている場合）
    if (name && name !== existingLawFirm.name) {
      const lawFirmsWithSameName = await LawFirmService.findByName(name);
      if (lawFirmsWithSameName.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Law firm name already exists',
          message: `Law firm with name ${name} already exists`
        });
      }
    }

    const updateData: UpdateLawFirmData = {
      name,
    };

    const lawFirm = await LawFirmService.update(id, updateData);

    res.json({
      success: true,
      data: lawFirm,
      message: 'Law firm updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating law firm:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update law firm',
      message: 'Internal server error'
    });
  }
});

// DELETE /law-firms/:id - 法律事務所を削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid law firm ID',
        message: 'Law firm ID is required and must be a string'
      });
    }

    const existingLawFirm = await LawFirmService.findById(id);
    if (!existingLawFirm) {
      return res.status(404).json({
        success: false,
        error: 'Law firm not found',
        message: `Law firm with ID ${id} does not exist`
      });
    }

    await LawFirmService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Law firm deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting law firm:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete law firm',
      message: 'Internal server error'
    });
  }
});

// GET /law-firms/:id/offices - 法律事務所のオフィス一覧を取得
router.get('/:id/offices', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid law firm ID',
        message: 'Law firm ID is required and must be a string'
      });
    }

    const offices = await LawFirmOfficeService.findByLawFirmId(id);

    res.json({
      success: true,
      data: offices
    });
  } catch (error) {
    console.error('Error fetching law firm offices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch law firm offices',
      message: 'Internal server error'
    });
  }
});

// POST /law-firms/:id/offices - 法律事務所にオフィスを追加
router.post('/:id/offices', async (req: Request, res: Response) => {
  try {
    const { id: lawFirmId } = req.params;
    const {
      isPrimary = false,
      officeName,
      postalCode,
      address1,
      address2,
      phone,
      fax,
    } = req.body;

    if (!lawFirmId || typeof lawFirmId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid law firm ID',
        message: 'Law firm ID is required and must be a string'
      });
    }

    // 法律事務所の存在チェック
    const lawFirm = await LawFirmService.findById(lawFirmId);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        error: 'Law firm not found',
        message: `Law firm with ID ${lawFirmId} does not exist`
      });
    }

    const officeData: CreateLawFirmOfficeData = {
      lawFirmId,
      isPrimary: Boolean(isPrimary),
      officeName,
      postalCode,
      address1,
      address2,
      phone,
      fax,
    };

    const office = await LawFirmOfficeService.create(officeData);

    res.status(201).json({
      success: true,
      data: office,
      message: 'Office created successfully'
    });
  } catch (error: any) {
    console.error('Error creating office:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create office',
      message: 'Internal server error'
    });
  }
});

// PUT /law-firms/:id/offices/:officeId - オフィスを更新
router.put('/:id/offices/:officeId', async (req: Request, res: Response) => {
  try {
    const { id: lawFirmId, officeId } = req.params;
    const {
      isPrimary,
      officeName,
      postalCode,
      address1,
      address2,
      phone,
      fax,
    } = req.body;

    if (!lawFirmId || typeof lawFirmId !== 'string' || !officeId || typeof officeId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid IDs',
        message: 'Law firm ID and office ID are required and must be strings'
      });
    }

    const office = await LawFirmOfficeService.findById(officeId);
    if (!office) {
      return res.status(404).json({
        success: false,
        error: 'Office not found',
        message: `Office with ID ${officeId} does not exist`
      });
    }

    const updateData: UpdateLawFirmOfficeData = {
      isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : undefined,
      officeName,
      postalCode,
      address1,
      address2,
      phone,
      fax,
    };

    const updatedOffice = await LawFirmOfficeService.update(officeId, updateData);

    res.json({
      success: true,
      data: updatedOffice,
      message: 'Office updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating office:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update office',
      message: 'Internal server error'
    });
  }
});

// DELETE /law-firms/:id/offices/:officeId - オフィスを削除
router.delete('/:id/offices/:officeId', async (req: Request, res: Response) => {
  try {
    const { officeId } = req.params;

    if (!officeId || typeof officeId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid office ID',
        message: 'Office ID is required and must be a string'
      });
    }

    const office = await LawFirmOfficeService.findById(officeId);
    if (!office) {
      return res.status(404).json({
        success: false,
        error: 'Office not found',
        message: `Office with ID ${officeId} does not exist`
      });
    }

    await LawFirmOfficeService.delete(officeId);

    res.status(200).json({
      success: true,
      message: 'Office deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting office:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete office',
      message: 'Internal server error'
    });
  }
});

export default router;
