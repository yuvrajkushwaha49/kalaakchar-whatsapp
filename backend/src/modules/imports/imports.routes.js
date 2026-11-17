import { Router } from 'express';
import * as importsController from './imports.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant, requireRole } from '../../middleware/tenant.js';
import { importUpload } from '../../utils/upload.js';

const router = Router();

router.use(authenticate, requireTenant);

// 1. File Upload & Streaming Preview (Excel & CSV)
router.post(
  '/upload-preview',
  requireRole(['owner', 'admin', 'marketer']),
  importUpload.single('file'),
  importsController.uploadPreview
);

// 2. Queue Asynchronous Import Job
router.post(
  '/create-job',
  requireRole(['owner', 'admin', 'marketer']),
  importsController.createJob
);

// 3. Backward Compatibility Endpoints
router.post('/preview', requireRole(['owner', 'admin', 'marketer']), importsController.preview);
router.post('/execute', requireRole(['owner', 'admin', 'marketer']), importsController.execute);

// 4. Job History & Management
router.get('/', importsController.list);
router.get('/:id/errors', importsController.errors);
router.get('/:id/export-errors', importsController.exportErrors);
router.post('/:id/retry', requireRole(['owner', 'admin', 'marketer']), importsController.retry);
router.post('/:id/cancel', requireRole(['owner', 'admin', 'marketer']), importsController.cancel);
router.delete('/:id', requireRole(['owner', 'admin']), importsController.deleteJob);
router.patch('/:id/tag', requireRole(['owner', 'admin', 'marketer']), importsController.updateTag);
router.put('/:id/tag', requireRole(['owner', 'admin', 'marketer']), importsController.updateTag);
router.get('/:id', importsController.getJob);

export default router;
