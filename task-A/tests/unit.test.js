const { handler } = require('../src/index');

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Body: {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('encrypted-data');
        }
      }
    })
  })),
  GetObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Plaintext: Buffer.from('decrypted-plaintext')
    })
  })),
  DecryptCommand: jest.fn()
}));

describe('Task A: Enclave-Style Decryption Service', () => {
  beforeEach(() => {
    // Set up environment variables
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.KMS_KEY_ALIAS = 'alias/test-key';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully decrypt a blob', async () => {
    const event = {
      body: JSON.stringify({
        blobKey: 'test-encrypted-blob.txt'
      }),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      plaintext: 'decrypted-plaintext',
      status: 'success'
    });
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  test('should return 400 when blobKey is missing', async () => {
    const event = {
      body: JSON.stringify({}),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'blobKey is required',
      status: 'error'
    });
  });

  test('should return 400 when blobKey is empty', async () => {
    const event = {
      body: JSON.stringify({ blobKey: '' }),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'blobKey is required',
      status: 'error'
    });
  });

  test('should handle missing environment variables', async () => {
    delete process.env.S3_BUCKET_NAME;
    delete process.env.KMS_KEY_ALIAS;

    const event = {
      body: JSON.stringify({
        blobKey: 'test-encrypted-blob.txt'
      }),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Missing required environment variables: S3_BUCKET_NAME or KMS_KEY_ALIAS',
      status: 'error'
    });
  });

  test('should handle S3 errors gracefully', async () => {
    const { S3Client } = require('@aws-sdk/client-s3');
    S3Client.mockImplementation(() => ({
      send: jest.fn().mockRejectedValue(new Error('S3 access denied'))
    }));

    const event = {
      body: JSON.stringify({
        blobKey: 'test-encrypted-blob.txt'
      }),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'S3 access denied',
      status: 'error'
    });
  });

  test('should handle KMS errors gracefully', async () => {
    const { KMSClient } = require('@aws-sdk/client-kms');
    KMSClient.mockImplementation(() => ({
      send: jest.fn().mockRejectedValue(new Error('KMS access denied'))
    }));

    const event = {
      body: JSON.stringify({
        blobKey: 'test-encrypted-blob.txt'
      }),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'KMS access denied',
      status: 'error'
    });
  });

  test('should include CORS headers in response', async () => {
    const event = {
      body: JSON.stringify({
        blobKey: 'test-encrypted-blob.txt'
      }),
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await handler(event, {});

    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    expect(result.headers['Access-Control-Allow-Methods']).toContain('POST');
  });
}); 