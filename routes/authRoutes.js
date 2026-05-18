import { Router } from 'express';
import { showLogin, login, logout } from '../controllers/AuthController.js';
import { index } from '../controllers/DashboardController.js';
import { requireAuth, redirectIfAuthenticated } from '../middlewares/auth.js';

const router = Router();

// router.get("/", requireAuth);
router.get("/dashboard", requireAuth, index);
router.get('/', redirectIfAuthenticated, showLogin);
router.post('/login', redirectIfAuthenticated, login);
router.post('/logout', requireAuth, logout)

export default router;