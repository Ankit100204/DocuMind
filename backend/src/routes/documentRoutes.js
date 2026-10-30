import express from 'express';

import {
    listDocuments,
    uploadDocument,
    deleteDocument,
    summarizeDocument
} from '../controllers/documentController.js';

import upload from '../middleware/upload.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all document routes
router.use(protect);

// Get all documents
router.get('/', listDocuments);

// Upload document
router.post(
    '/upload',
    upload.single('file'),
    uploadDocument
);

// Summarize document
router.post('/:id/summarize', summarizeDocument);

// Delete document
router.delete('/:id', deleteDocument);

export default router;