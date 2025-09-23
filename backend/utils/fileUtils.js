const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mime = require('mime-types');
const crypto = require('crypto');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);

// Ensure upload directory exists
const ensureUploadsDir = async () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  return uploadDir;
};

/**
 * Generate a unique filename with extension
 * @param {string} originalname - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalname) => {
  const ext = path.extname(originalname);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return `${path.basename(originalname, ext)}-${uniqueSuffix}${ext}`;
};

/**
 * Get file metadata
 * @param {string} filepath - Path to the file
 * @returns {Promise<Object>} - File metadata
 */
const getFileMetadata = async (filepath) => {
  try {
    const stats = await stat(filepath);
    const ext = path.extname(filepath).toLowerCase();
    
    return {
      filename: path.basename(filepath),
      path: filepath,
      size: stats.size,
      extension: ext.replace('.', ''),
      mimeType: mime.lookup(ext) || 'application/octet-stream',
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * Save file buffer to disk
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Target filename
 * @param {string} [subdir] - Optional subdirectory
 * @returns {Promise<string>} - Path to the saved file
 */
const saveFile = async (buffer, filename, subdir = '') => {
  const uploadDir = await ensureUploadsDir();
  const targetDir = subdir ? path.join(uploadDir, subdir) : uploadDir;
  
  // Create subdirectory if it doesn't exist
  try {
    await mkdir(targetDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  const filepath = path.join(targetDir, filename);
  await writeFile(filepath, buffer);
  
  return filepath;
};

/**
 * Delete a file
 * @param {string} filepath - Path to the file
 * @returns {Promise<boolean>} - True if file was deleted, false if it didn't exist
 */
const deleteFile = async (filepath) => {
  try {
    await unlink(filepath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

/**
 * Get all files in a directory
 * @param {string} dir - Directory path
 * @returns {Promise<Array>} - Array of file metadata objects
 */
const listFiles = async (dir) => {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    const results = [];
    
    for (const file of files) {
      const filepath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        const subFiles = await listFiles(filepath);
        results.push(...subFiles);
      } else {
        const metadata = await getFileMetadata(filepath);
        if (metadata) {
          results.push(metadata);
        }
      }
    }
    
    return results;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

/**
 * Copy a file to a new location
 * @param {string} source - Source file path
 * @param {string} target - Target file path
 * @param {boolean} [overwrite=false] - Overwrite if target exists
 * @returns {Promise<boolean>} - True if file was copied, false if not copied (e.g., target exists and overwrite is false)
 */
const copyFileTo = async (source, target, overwrite = false) => {
  try {
    if (!overwrite) {
      try {
        await stat(target);
        return false; // File exists and we're not overwriting
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    
    await copyFile(source, target);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  ensureUploadsDir,
  generateUniqueFilename,
  getFileMetadata,
  saveFile,
  deleteFile,
  listFiles,
  copyFileTo,
  // Promisified fs methods
  readFile,
  writeFile,
  unlink,
  mkdir,
  stat,
  readdir,
};
