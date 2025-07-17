/**
 * @fileoverview Test setup and common mocks
 */

// Mock console to reduce noise in tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock TextEncoder/TextDecoder for Node.js compatibility
global.TextEncoder = class TextEncoder {
  encode(input) {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(input) {
    return Buffer.from(input).toString('utf8');
  }
};

// Mock performance for timing measurements
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock window object for browser APIs
global.window = {
  location: {
    origin: 'https://localhost:3000',
  },
}; 