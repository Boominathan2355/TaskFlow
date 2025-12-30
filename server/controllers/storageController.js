const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Get all files in the uploads directory
exports.getFiles = async (req, res) => {
    try {
        if (!fs.existsSync(UPLOADS_DIR)) {
            return res.json({ files: [], stats: { totalFiles: 0, totalSize: 0 } });
        }

        const files = await readdir(UPLOADS_DIR);
        const fileDetails = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(UPLOADS_DIR, filename);
                const fileStat = await stat(filePath);

                return {
                    filename,
                    size: fileStat.size,
                    createdAt: fileStat.birthtime,
                    mimetype: getMimetype(filename),
                    url: `/uploads/${filename}`
                };
            })
        );

        // Sort by creation date descending
        fileDetails.sort((a, b) => b.createdAt - a.createdAt);

        const totalSize = fileDetails.reduce((acc, file) => acc + file.size, 0);

        res.json({
            files: fileDetails,
            stats: {
                totalFiles: fileDetails.length,
                totalSize
            }
        });
    } catch (error) {
        console.error('Get storage files error:', error);
        res.status(500).json({ error: 'Failed to retrieve files' });
    }
};

// Delete a specific file
exports.deleteFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Security check: ensure the file is within the uploads directory
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        await unlink(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};

// Helper to determine mimetype based on extension
function getMimetype(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimetypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain'
    };
    return mimetypes[ext] || 'application/octet-stream';
}
