import { Router } from 'express';
import { authRoutes } from './auth';
import { studyRoutes } from './studies';
import { responseRoutes } from './responses';
import { audioRoutes } from './audio';
import { analysisRoutes } from './analysis';
import heatmapRoutes from './heatmap';
import sessionsRoutes from './sessions';
import demographicRoutes from './demographics';
import participateRoutes from './participate';

const router = Router();

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Mental Maps API v1.0.0',
    endpoints: {
      auth: '/api/auth',
      studies: '/api/studies',
      responses: '/api/responses',
      audio: '/api/audio',
      analysis: '/api/analysis',
      heatmap: '/api/heatmap',
      sessions: '/api/sessions',
      demographics: '/api/demographics',
      participate: '/api/participate',
    },
    documentation: 'https://github.com/your-org/mental-maps-api/docs',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/studies', studyRoutes);
router.use('/responses', responseRoutes);
router.use('/audio', audioRoutes);
router.use('/analysis', analysisRoutes);
router.use('/heatmap', heatmapRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/demographics', demographicRoutes);
router.use('/participate', participateRoutes);

export { router as apiRoutes };