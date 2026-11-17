import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'imports');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, safeName);
  }
});

// File filter for CSV and XLSX files
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExts.includes(ext)) {
    const err = new Error(`Unsupported file type: ${ext}. Please upload a .csv, .xlsx or .xls file.`);
    err.statusCode = 400;
    return cb(err, false);
  }
  
  cb(null, true);
};

// Max file size: 100MB by default, configurable via env
const maxFileSize = parseInt(process.env.IMPORT_MAX_FILE_SIZE || '104857600', 10); // 100MB

export const importUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize
  }
});

export default importUpload;

