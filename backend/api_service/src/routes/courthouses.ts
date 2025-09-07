import { Router, Request, Response } from 'express';
import { CourthouseService, CourtDivisionService, CourtPersonnelService, CreateCourthouseData, UpdateCourthouseData, CreateCourtDivisionData, UpdateCourtDivisionData, CreateCourtPersonnelData, UpdateCourtPersonnelData } from '../models';

const router = Router();

// GET /courthouses - 裁判所一覧を取得
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, name } = req.query;

    let courthouses;
    let total = 0;

    if (name) {
      courthouses = await CourthouseService.findByName(name as string);
      total = courthouses.length;
    } else {
      courthouses = await CourthouseService.findAll();
      total = courthouses.length;
    }

    // ページネーション適用
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedCourthouses = courthouses.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedCourthouses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching courthouses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courthouses',
      message: 'Internal server error'
    });
  }
});

// GET /courthouses/:id - 特定の裁判所を取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    const courthouse = await CourthouseService.findById(id);

    if (!courthouse) {
      return res.status(404).json({
        success: false,
        error: 'Courthouse not found',
        message: `Courthouse with ID ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: courthouse
    });
  } catch (error) {
    console.error('Error fetching courthouse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courthouse',
      message: 'Internal server error'
    });
  }
});

// POST /courthouses - 新しい裁判所を作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, postalCode, address1, address2, phone } = req.body;

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
    const existingCourthouse = await CourthouseService.findByName(name);
    if (existingCourthouse.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Courthouse name already exists',
        message: `Courthouse with name ${name} already exists`
      });
    }

    const courthouseData: CreateCourthouseData = {
      name,
      postalCode,
      address1,
      address2,
      phone,
    };

    const courthouse = await CourthouseService.create(courthouseData);

    res.status(201).json({
      success: true,
      data: courthouse,
      message: 'Courthouse created successfully'
    });
  } catch (error: any) {
    console.error('Error creating courthouse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create courthouse',
      message: 'Internal server error'
    });
  }
});

// PUT /courthouses/:id - 裁判所を更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, postalCode, address1, address2, phone } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    const existingCourthouse = await CourthouseService.findById(id);
    if (!existingCourthouse) {
      return res.status(404).json({
        success: false,
        error: 'Courthouse not found',
        message: `Courthouse with ID ${id} does not exist`
      });
    }

    // 名前の重複チェック（他の裁判所で使用されている場合）
    if (name && name !== existingCourthouse.name) {
      const courthousesWithSameName = await CourthouseService.findByName(name);
      if (courthousesWithSameName.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Courthouse name already exists',
          message: `Courthouse with name ${name} already exists`
        });
      }
    }

    const updateData: UpdateCourthouseData = {
      name,
      postalCode,
      address1,
      address2,
      phone,
    };

    const courthouse = await CourthouseService.update(id, updateData);

    res.json({
      success: true,
      data: courthouse,
      message: 'Courthouse updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating courthouse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update courthouse',
      message: 'Internal server error'
    });
  }
});

// DELETE /courthouses/:id - 裁判所を削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    const existingCourthouse = await CourthouseService.findById(id);
    if (!existingCourthouse) {
      return res.status(404).json({
        success: false,
        error: 'Courthouse not found',
        message: `Courthouse with ID ${id} does not exist`
      });
    }

    await CourthouseService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Courthouse deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting courthouse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete courthouse',
      message: 'Internal server error'
    });
  }
});

// GET /courthouses/:id/divisions - 裁判所の部局一覧を取得
router.get('/:id/divisions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    const divisions = await CourtDivisionService.findByCourthouseId(id);

    res.json({
      success: true,
      data: divisions
    });
  } catch (error) {
    console.error('Error fetching courthouse divisions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courthouse divisions',
      message: 'Internal server error'
    });
  }
});

// POST /courthouses/:id/divisions - 裁判所に部局を追加
router.post('/:id/divisions', async (req: Request, res: Response) => {
  try {
    const { id: courthouseId } = req.params;
    const {
      name,
      type,
      phone,
      fax,
      parentId,
    } = req.body;

    if (!courthouseId || typeof courthouseId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Name and type are required',
        details: {
          name: name ? 'Valid' : 'Required',
          type: type ? 'Valid' : 'Required'
        }
      });
    }

    // 裁判所の存在チェック
    const courthouse = await CourthouseService.findById(courthouseId);
    if (!courthouse) {
      return res.status(404).json({
        success: false,
        error: 'Courthouse not found',
        message: `Courthouse with ID ${courthouseId} does not exist`
      });
    }

    const divisionData: CreateCourtDivisionData = {
      name,
      type,
      phone,
      fax,
      courthouseId,
      parentId,
    };

    const division = await CourtDivisionService.create(divisionData);

    res.status(201).json({
      success: true,
      data: division,
      message: 'Court division created successfully'
    });
  } catch (error: any) {
    console.error('Error creating court division:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create court division',
      message: 'Internal server error'
    });
  }
});

// GET /courthouses/:id/personnel - 裁判所の職員一覧を取得
router.get('/:id/personnel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    const personnel = await CourtPersonnelService.findByCourthouseId(id);

    res.json({
      success: true,
      data: personnel
    });
  } catch (error) {
    console.error('Error fetching courthouse personnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courthouse personnel',
      message: 'Internal server error'
    });
  }
});

// POST /courthouses/:id/personnel - 裁判所に職員を追加
router.post('/:id/personnel', async (req: Request, res: Response) => {
  try {
    const { id: courthouseId } = req.params;
    const {
      name,
      email,
      role,
      courtDivisionId,
    } = req.body;

    if (!courthouseId || typeof courthouseId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courthouse ID',
        message: 'Courthouse ID is required and must be a string'
      });
    }

    if (!name || !role || !courtDivisionId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Name, role, and courtDivisionId are required',
        details: {
          name: name ? 'Valid' : 'Required',
          role: role ? 'Valid' : 'Required',
          courtDivisionId: courtDivisionId ? 'Valid' : 'Required'
        }
      });
    }

    // 裁判所の存在チェック
    const courthouse = await CourthouseService.findById(courthouseId);
    if (!courthouse) {
      return res.status(404).json({
        success: false,
        error: 'Courthouse not found',
        message: `Courthouse with ID ${courthouseId} does not exist`
      });
    }

    const personnelData: CreateCourtPersonnelData = {
      name,
      email,
      role,
      courtDivisionId,
    };

    const personnel = await CourtPersonnelService.create(personnelData);

    res.status(201).json({
      success: true,
      data: personnel,
      message: 'Court personnel created successfully'
    });
  } catch (error: any) {
    console.error('Error creating court personnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create court personnel',
      message: 'Internal server error'
    });
  }
});

export default router;
