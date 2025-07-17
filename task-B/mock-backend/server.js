const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo
const storage = new Map();

// Multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock Task A Backend Running' });
});

// Upload endpoint (mimics Task A upload)
app.post('/upload', upload.single('blob'), (req, res) => {
  try {
    const blobKey = req.body.blobKey || `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = JSON.parse(req.body.metadata || '{}');
    
    // Store the encrypted blob and metadata
    storage.set(blobKey, {
      blob: req.file ? req.file.buffer : Buffer.from(req.body.data || ''),
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        size: req.file ? req.file.size : 0,
        encrypted: metadata.encrypted || false,
      }
    });

    console.log(`📤 Mock upload: ${blobKey} (${req.file ? req.file.size : 0} bytes)`);
    
    res.json({
      success: true,
      blobKey: blobKey,
      uploadedAt: new Date().toISOString(),
      size: req.file ? req.file.size : 0
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Download endpoint (mimics Task A download)
app.get('/download/:blobKey', (req, res) => {
  try {
    const { blobKey } = req.params;
    
    if (!storage.has(blobKey)) {
      return res.status(404).json({ error: 'Blob not found' });
    }
    
    const data = storage.get(blobKey);
    
    console.log(`📥 Mock download: ${blobKey} (${data.blob.length} bytes)`);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${blobKey}"`);
    res.setHeader('X-Metadata', JSON.stringify(data.metadata));
    
    res.send(data.blob);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// List all stored blobs
app.get('/blobs', (req, res) => {
  const blobs = Array.from(storage.entries()).map(([key, data]) => ({
    blobKey: key,
    size: data.blob.length,
    metadata: data.metadata
  }));
  
  res.json({ blobs });
});

// Delete a blob
app.delete('/blobs/:blobKey', (req, res) => {
  const { blobKey } = req.params;
  
  if (storage.delete(blobKey)) {
    console.log(`🗑️ Mock delete: ${blobKey}`);
    res.json({ success: true, message: 'Blob deleted' });
  } else {
    res.status(404).json({ error: 'Blob not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Task A Backend running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /upload - Upload encrypted blob`);
  console.log(`   GET  /download/:blobKey - Download blob`);
  console.log(`   GET  /blobs - List all blobs`);
  console.log(`   DELETE /blobs/:blobKey - Delete blob`);
  console.log(`\n💡 Use http://localhost:${PORT} as your API Base URL in the demo`);
}); 