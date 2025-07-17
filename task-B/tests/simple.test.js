/**
 * @fileoverview Simple unit tests for basic functionality
 */

describe('Basic SDK Tests', () => {
  test('package.json has correct name', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('@solace/client-sdk');
  });

  test('crypto utilities exist', () => {
    const crypto = require('../src/crypto.js');
    expect(typeof crypto.generateKey).toBe('function');
    expect(typeof crypto.generateIV).toBe('function');
    expect(typeof crypto.encrypt).toBe('function');
    expect(typeof crypto.decrypt).toBe('function');
  });

  test('API client exists', () => {
    const api = require('../src/api.js');
    expect(typeof api.SolaceApiClient).toBe('function');
    expect(typeof api.createApiClient).toBe('function');
    expect(typeof api.BlobUtils).toBe('object');
  });

  test('BlobUtils work correctly', () => {
    const { BlobUtils } = require('../src/api.js');
    
    // Test blob key generation
    const key = BlobUtils.generateBlobKey('test');
    expect(key).toMatch(/^test-\d+-[a-z0-9]+$/);
    
    // Test blob key validation
    expect(BlobUtils.isValidBlobKey('valid-key-123')).toBe(true);
    expect(BlobUtils.isValidBlobKey('invalid@key')).toBe(false);
    expect(BlobUtils.isValidBlobKey('')).toBe(false);
    
    // Test size formatting
    expect(BlobUtils.formatSize(1024)).toBe('1 KB');
    expect(BlobUtils.formatSize(0)).toBe('0 Bytes');
  });

  test('API client can be created', () => {
    const { SolaceApiClient, createApiClient } = require('../src/api.js');
    
    const client1 = new SolaceApiClient({ baseUrl: 'https://test.com' });
    expect(client1.baseUrl).toBe('https://test.com');
    
    const client2 = createApiClient({ baseUrl: 'https://test2.com' });
    expect(client2.baseUrl).toBe('https://test2.com');
  });
}); 