import { Router } from 'express';
import { indexRoute } from './indexRoutes';
import { search } from './search';
import { checkForApiKey } from '../shared/checkForApiKey';
import mcpRouter from './mcp';

const router = Router();

// API Routes
router.post('/index', checkForApiKey, indexRoute);
router.post('/search', checkForApiKey, search);

// MCP Routes
router.use('/mcp', mcpRouter);

export default router;
