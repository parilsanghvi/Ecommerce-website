const fs = require('fs');

// Create a 1MB buffer
const bufferSize = 1024 * 1024; // 1MB
const buffer = Buffer.alloc(bufferSize, 'a');

// Convert to Base64
const base64String = buffer.toString('base64');
const base64Size = Buffer.byteLength(base64String);

// Calculate overhead
const overhead = base64Size - bufferSize;
const overheadPercentage = (overhead / bufferSize) * 100;

console.log('--- Image Upload Payload Benchmark ---');
console.log(`Original File Size (Buffer): ${(bufferSize / 1024).toFixed(2)} KB`);
console.log(`Base64 Encoded Size: ${(base64Size / 1024).toFixed(2)} KB`);
console.log(`Overhead: ${(overhead / 1024).toFixed(2)} KB`);
console.log(`Overhead Percentage: ${overheadPercentage.toFixed(2)}%`);
