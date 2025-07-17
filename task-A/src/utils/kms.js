const { KMSClient, DecryptCommand, EncryptCommand } = require('@aws-sdk/client-kms');

const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Decrypt data using AWS KMS
 * @param {Buffer} encryptedData - Encrypted data buffer
 * @param {string} kmsKeyAlias - KMS key alias
 * @returns {Promise<string>} Decrypted plaintext
 */
async function decryptWithKMS(encryptedData, kmsKeyAlias) {
  try {
    console.log(`Decrypting data using KMS key: ${kmsKeyAlias}`);
    
    const command = new DecryptCommand({
      CiphertextBlob: encryptedData,
      KeyId: kmsKeyAlias
    });
    
    const response = await kmsClient.send(command);
    
    // Convert decrypted buffer to string
    const plaintext = response.Plaintext.toString('utf-8');
    console.log('Successfully decrypted data using KMS');
    
    return plaintext;
  } catch (error) {
    console.error('Error decrypting with KMS:', error);
    throw error;
  }
}

/**
 * Encrypt data using AWS KMS (for testing purposes)
 * @param {string} plaintext - Plaintext to encrypt
 * @param {string} kmsKeyAlias - KMS key alias
 * @returns {Promise<Buffer>} Encrypted data buffer
 */
async function encryptWithKMS(plaintext, kmsKeyAlias) {
  try {
    console.log(`Encrypting data using KMS key: ${kmsKeyAlias}`);
    
    const command = new EncryptCommand({
      Plaintext: Buffer.from(plaintext, 'utf-8'),
      KeyId: kmsKeyAlias
    });
    
    const response = await kmsClient.send(command);
    
    console.log('Successfully encrypted data using KMS');
    return response.CiphertextBlob;
  } catch (error) {
    console.error('Error encrypting with KMS:', error);
    throw error;
  }
}

module.exports = {
  decryptWithKMS,
  encryptWithKMS
}; 