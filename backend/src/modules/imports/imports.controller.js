import * as importsService from './imports.service.js';

/**
 * Handle file upload and generate streaming preview
 */
export async function uploadPreview(req, res, next) {
  try {
    const result = await importsService.handleUploadPreview(req.businessId, req.file);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Queue a background import job from an uploaded file
 */
export async function createJob(req, res, next) {
  try {
    const { fileKey, fileName, columnMapping, batchTag, groupId, defaultCountryCode, consentSource } = req.body;
    
    if (!fileKey || !columnMapping) {
      return res.status(400).json({
        success: false,
        error: { message: 'fileKey and columnMapping are required' }
      });
    }

    const result = await importsService.createQueuedImportJob(req.businessId, req.user.id, {
      fileKey,
      fileName,
      columnMapping,
      batchTag,
      groupId,
      defaultCountryCode,
      consentSource
    });

    res.status(202).json({
      success: true,
      message: 'Import job created and queued for background processing',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Backward-compatible raw CSV execute
 */
export async function execute(req, res, next) {
  try {
    const { csvText, fileName, columnMapping, consentSource, defaultCountryCode, batchTag, groupId } = req.body;
    if (!csvText || !columnMapping) {
      return res.status(400).json({ success: false, error: { message: 'csvText and columnMapping are required' } });
    }
    const result = await importsService.executeImport(req.businessId, req.user.id, {
      csvText,
      fileName,
      columnMapping,
      consentSource,
      defaultCountryCode,
      batchTag,
      groupId
    });
    res.json({ success: true, message: 'Import queued successfully', data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Backward-compatible raw CSV preview
 */
export async function preview(req, res, next) {
  try {
    const { csvText } = req.body;
    if (!csvText) {
      return res.status(400).json({ success: false, error: { message: 'csvText content is required' } });
    }
    const result = await importsService.previewCsv(csvText);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * List import history for workspace
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const result = await importsService.listImportJobs(req.businessId, { limit, offset });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single job status and progress
 */
export async function getJob(req, res, next) {
  try {
    const job = await importsService.getImportJob(req.businessId, req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: { message: 'Import job not found' } });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

/**
 * Get error rows audit for a job
 */
export async function errors(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '200', 10);
    const result = await importsService.getImportErrors(req.businessId, req.params.id, { limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Download CSV error report directly
 */
export async function exportErrors(req, res, next) {
  try {
    const jobId = req.params.id;
    const csvContent = await importsService.exportImportErrorsCsv(req.businessId, jobId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_job_${jobId}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * Retry a failed or cancelled import job
 */
export async function retry(req, res, next) {
  try {
    const result = await importsService.retryImport(req.businessId, req.params.id);
    res.json({ success: true, message: 'Import job re-queued for processing', data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an active or pending import job
 */
export async function cancel(req, res, next) {
  try {
    const result = await importsService.cancelImport(req.businessId, req.params.id);
    res.json({ success: true, message: 'Import job cancelled', data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an import job, audit logs, uploaded file, and optionally its contacts
 */
export async function deleteJob(req, res, next) {
  try {
    const deleteContacts = req.query.deleteContacts === 'true' || req.body?.deleteContacts === true;
    const result = await importsService.deleteImportJob(req.businessId, req.params.id, { deleteContacts });
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update the tag of a past import job and all associated contacts
 */
export async function updateTag(req, res, next) {
  try {
    const businessId = req.businessId;
    const jobId = req.params.id;
    const { newTag, replaceOldTag } = req.body;
    const result = await importsService.updateImportTag(businessId, jobId, { newTag, replaceOldTag });
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export default {
  uploadPreview,
  createJob,
  execute,
  preview,
  list,
  getJob,
  errors,
  exportErrors,
  retry,
  cancel,
  deleteJob,
  updateTag
};
