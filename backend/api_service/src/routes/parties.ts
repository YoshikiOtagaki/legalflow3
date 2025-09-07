import { Router, Request, Response } from 'express';
import { PartyService, IndividualProfileService, CorporateProfileService, CreatePartyData, UpdatePartyData, CreateIndividualProfileData, UpdateIndividualProfileData, CreateCorporateProfileData, UpdateCorporateProfileData } from '../models';

const router = Router();

// GET /parties - 当事者一覧を取得
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, isCorporation, isFormerClient, name } = req.query;

    let parties;
    let total = 0;

    if (isCorporation === 'true') {
      parties = await PartyService.findCorporations();
      total = parties.length;
    } else if (isCorporation === 'false') {
      parties = await PartyService.findIndividuals();
      total = parties.length;
    } else if (isFormerClient === 'true') {
      parties = await PartyService.findFormerClients();
      total = parties.length;
    } else {
      parties = await PartyService.findAll();
      total = parties.length;
    }

    // 名前による検索（個人・法人両方）
    if (name) {
      const individualResults = await IndividualProfileService.findByName(name as string);
      const corporateResults = await CorporateProfileService.findByName(name as string);

      const individualPartyIds = individualResults.map(p => p.partyId);
      const corporatePartyIds = corporateResults.map(p => p.partyId);

      parties = parties.filter(party =>
        individualPartyIds.includes(party.id) ||
        corporatePartyIds.includes(party.id)
      );
      total = parties.length;
    }

    // ページネーション適用
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedParties = parties.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedParties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching parties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parties',
      message: 'Internal server error'
    });
  }
});

// GET /parties/:id - 特定の当事者を取得
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid party ID',
        message: 'Party ID is required and must be a string'
      });
    }

    const party = await PartyService.findById(id);

    if (!party) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
        message: `Party with ID ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: party
    });
  } catch (error) {
    console.error('Error fetching party:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch party',
      message: 'Internal server error'
    });
  }
});

// POST /parties - 新しい当事者を作成
router.post('/', async (req: Request, res: Response) => {
  try {
    const { isCorporation = false, isFormerClient = false, profile } = req.body;

    const partyData: CreatePartyData = {
      isCorporation: Boolean(isCorporation),
      isFormerClient: Boolean(isFormerClient),
    };

    const party = await PartyService.create(partyData);

    // プロフィールが提供されている場合、作成
    if (profile) {
      if (isCorporation) {
        const corporateProfileData: CreateCorporateProfileData = {
          partyId: party.id,
          ...profile
        };
        await CorporateProfileService.create(corporateProfileData);
      } else {
        const individualProfileData: CreateIndividualProfileData = {
          partyId: party.id,
          ...profile
        };
        await IndividualProfileService.create(individualProfileData);
      }
    }

    // 作成された当事者を再取得（プロフィール情報を含む）
    const createdParty = await PartyService.findById(party.id);

    res.status(201).json({
      success: true,
      data: createdParty,
      message: 'Party created successfully'
    });
  } catch (error: any) {
    console.error('Error creating party:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create party',
      message: 'Internal server error'
    });
  }
});

// PUT /parties/:id - 当事者を更新
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isCorporation, isFormerClient, profile } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid party ID',
        message: 'Party ID is required and must be a string'
      });
    }

    const existingParty = await PartyService.findById(id);
    if (!existingParty) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
        message: `Party with ID ${id} does not exist`
      });
    }

    const updateData: UpdatePartyData = {
      isCorporation: isCorporation !== undefined ? Boolean(isCorporation) : undefined,
      isFormerClient: isFormerClient !== undefined ? Boolean(isFormerClient) : undefined,
    };

    const party = await PartyService.update(id, updateData);

    // プロフィールが提供されている場合、更新
    if (profile) {
      if (existingParty.isCorporation) {
        const corporateProfile = await CorporateProfileService.findByPartyId(id);
        if (corporateProfile) {
          const corporateUpdateData: UpdateCorporateProfileData = profile;
          await CorporateProfileService.updateByPartyId(id, corporateUpdateData);
        } else {
          const corporateProfileData: CreateCorporateProfileData = {
            partyId: id,
            ...profile
          };
          await CorporateProfileService.create(corporateProfileData);
        }
      } else {
        const individualProfile = await IndividualProfileService.findByPartyId(id);
        if (individualProfile) {
          const individualUpdateData: UpdateIndividualProfileData = profile;
          await IndividualProfileService.updateByPartyId(id, individualUpdateData);
        } else {
          const individualProfileData: CreateIndividualProfileData = {
            partyId: id,
            ...profile
          };
          await IndividualProfileService.create(individualProfileData);
        }
      }
    }

    // 更新された当事者を再取得
    const updatedParty = await PartyService.findById(id);

    res.json({
      success: true,
      data: updatedParty,
      message: 'Party updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating party:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update party',
      message: 'Internal server error'
    });
  }
});

// DELETE /parties/:id - 当事者を削除
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid party ID',
        message: 'Party ID is required and must be a string'
      });
    }

    const existingParty = await PartyService.findById(id);
    if (!existingParty) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
        message: `Party with ID ${id} does not exist`
      });
    }

    await PartyService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Party deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting party:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete party',
      message: 'Internal server error'
    });
  }
});

// GET /parties/:id/individual-profile - 個人プロフィールを取得
router.get('/:id/individual-profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid party ID',
        message: 'Party ID is required and must be a string'
      });
    }

    const profile = await IndividualProfileService.findByPartyId(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Individual profile not found',
        message: `Individual profile for party ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching individual profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch individual profile',
      message: 'Internal server error'
    });
  }
});

// GET /parties/:id/corporate-profile - 法人プロフィールを取得
router.get('/:id/corporate-profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid party ID',
        message: 'Party ID is required and must be a string'
      });
    }

    const profile = await CorporateProfileService.findByPartyId(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Corporate profile not found',
        message: `Corporate profile for party ${id} does not exist`
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching corporate profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch corporate profile',
      message: 'Internal server error'
    });
  }
});

export default router;
