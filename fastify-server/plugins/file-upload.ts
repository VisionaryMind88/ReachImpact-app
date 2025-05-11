import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest } from 'fastify';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

interface FileUploadOptions {
  // Customize by plugin options if needed
  uploadDir?: string;
  maxFileSize?: number;
}

/**
 * This plugin adds file upload capabilities using multer
 */
export const fileUploadPlugin = fp(async function (fastify: FastifyInstance, opts: FileUploadOptions) {
  // Set up upload directory
  const uploadDir = opts.uploadDir || path.join(process.cwd(), 'uploads');
  const maxFileSize = opts.maxFileSize || 5 * 1024 * 1024; // 5MB default
  
  // Create upload directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Configure storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniquePrefix = randomUUID();
      cb(null, uniquePrefix + '-' + file.originalname);
    }
  });
  
  // Configure file upload
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: maxFileSize
    },
    fileFilter: function (req, file, cb) {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'video/mp4',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images, PDFs, audio, video, and documents are allowed.'), false);
      }
    }
  });
  
  // Add file upload middleware to fastify
  fastify.decorate('upload', upload);
  
  // Create route for file downloads
  fastify.get('/uploads/:filename', (request: FastifyRequest<{ Params: { filename: string } }>, reply) => {
    const { filename } = request.params;
    const filepath = path.join(uploadDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return reply.code(404).send({ message: 'File not found' });
    }
    
    // Determine the content type
    const extname = path.extname(filepath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv'
    };
    
    const contentType = contentTypeMap[extname] || 'application/octet-stream';
    
    // Return the file
    reply.header('Content-Type', contentType);
    reply.send(fs.createReadStream(filepath));
  });
  
  // Clean up uploaded files on server close
  fastify.addHook('onClose', async (instance) => {
    // In production, you might not want to delete all files on server restart
    // This is just for development purposes
    if (process.env.NODE_ENV !== 'production') {
      try {
        const tempFiles = fs.readdirSync(uploadDir);
        for (const file of tempFiles) {
          fs.unlinkSync(path.join(uploadDir, file));
        }
      } catch (err) {
        fastify.log.error('Error cleaning up uploads:', err);
      }
    }
  });
}, {
  name: 'file-upload-plugin'
});

// Define type augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    file?: Express.Multer.File;
    files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
  }
  
  interface FastifyInstance {
    upload: ReturnType<typeof multer>;
  }
}