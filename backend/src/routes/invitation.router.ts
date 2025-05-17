import { Router } from 'express';
import { createInvitation, listInvitations } from '../controllers/invitationcontroller';

export const router = Router();

// POST /api/invitations
router.post('/', createInvitation);
// GET  /api/invitations
router.get('/', listInvitations);