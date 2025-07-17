const { fetchEncryptedBlob } = require('./utils/s3');
const { decryptWithKMS } = require('./utils/kms');

/**
 * Lambda function handler for secure blob decryption
 * @param {Object} event - API Gateway event
 * @param {Object} context - Lambda context
 * @returns {Object} Response with decrypted plaintext or error
 */
exports.handler = async (event, context) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { blobKey } = body;
    
    if (!blobKey) {
      return createResponse(400, {
        error: 'blobKey is required',
        status: 'error'
      });
    }
    
    console.log(`Processing blobKey: ${blobKey}`);
    
    // Get environment variables
    const bucketName = process.env.S3_BUCKET_NAME;
    const kmsKeyAlias = process.env.KMS_KEY_ALIAS;
    
    if (!bucketName || !kmsKeyAlias) {
      throw new Error('Missing required environment variables: S3_BUCKET_NAME or KMS_KEY_ALIAS');
    }
    
    // Fetch encrypted blob from S3
    const encryptedData = await fetchEncryptedBlob(bucketName, blobKey);
    
    // Decrypt using KMS
    const plaintext = await decryptWithKMS(encryptedData, kmsKeyAlias);
    
    console.log('Decryption successful');
    return createResponse(200, {
      plaintext: plaintext,
      status: 'success'
    });
    
  } catch (error) {
    console.error('Error in handler:', error);
    
    // Handle specific error types
    if (error.name === 'NoSuchKey') {
      return createResponse(404, {
        error: 'Blob not found',
        status: 'error'
      });
    }
    
    if (error.name === 'AccessDeniedException') {
      return createResponse(403, {
        error: 'Access denied - check KMS permissions',
        status: 'error'
      });
    }
    
    return createResponse(500, {
      error: error.message || 'Internal server error',
      status: 'error'
    });
  }
};



/**
 * Create API Gateway response with CORS headers
 * @param {number} statusCode - HTTP status code
 * @param {Object} body - Response body
 * @returns {Object} API Gateway response object
 */
function createResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
} 