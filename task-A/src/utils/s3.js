const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Fetch encrypted blob from S3
 * @param {string} bucketName - S3 bucket name
 * @param {string} blobKey - S3 object key
 * @returns {Promise<Buffer>} Encrypted data buffer
 */
async function fetchEncryptedBlob(bucketName, blobKey) {
  try {
    console.log(`Fetching encrypted blob from S3: s3://${bucketName}/${blobKey}`);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: blobKey
    });
    
    const response = await s3Client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`Successfully fetched blob, size: ${buffer.length} bytes`);
    
    return buffer;
  } catch (error) {
    console.error('Error fetching from S3:', error);
    throw error;
  }
}

/**
 * Upload encrypted blob to S3 (for testing purposes)
 * @param {string} bucketName - S3 bucket name
 * @param {string} blobKey - S3 object key
 * @param {Buffer} encryptedData - Encrypted data buffer
 * @returns {Promise<void>}
 */
async function uploadEncryptedBlob(bucketName, blobKey, encryptedData) {
  try {
    console.log(`Uploading encrypted blob to S3: s3://${bucketName}/${blobKey}`);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: blobKey,
      Body: encryptedData,
      ContentType: 'application/octet-stream'
    });
    
    await s3Client.send(command);
    console.log('Successfully uploaded encrypted blob to S3');
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

module.exports = {
  fetchEncryptedBlob,
  uploadEncryptedBlob
}; 