import * as importsService from './imports.service.js';

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

export async function execute(req, res, next) {
  try {
    const { csvText, fileName, columnMapping, consentSource, defaultCountryCode, batchTag } = req.body;
    if (!csvText || !columnMapping) {
      return res.status(400).json({ success: false, error: { message: 'csvText and columnMapping are required' } });
    }
    const result = await importsService.executeImport(req.businessId, req.user.id, {
      csvText,
      fileName,
      columnMapping,
      consentSource,
      defaultCountryCode,
      batchTag
    });
    res.json({ success: true, message: 'Import processed successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const result = await importsService.listImportJobs(req.businessId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function errors(req, res, next) {
  try {
    const result = await importsService.getImportErrors(req.businessId, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

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

export default {
  preview,
  execute,
  list,
  getJob,
  errors
};
