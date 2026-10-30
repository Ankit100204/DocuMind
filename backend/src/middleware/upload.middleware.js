import multer from 'multer';
import path from 'path';

const allowedTypes = {
    '.pdf': [
        'application/pdf',
        'application/x-pdf'
    ],
    '.docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
};

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 20 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        const validMimes = allowedTypes[ext];

        if (!validMimes || !validMimes.includes(file.mimetype)) {
            return cb(new Error('Unsupported file type'));
        }

        cb(null, true);
    }
});

export default upload;