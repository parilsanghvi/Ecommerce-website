const express = require('express');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');

// Adjust path based on where we run the script
const appPath = '../backend/app';
const productModelPath = '../backend/models/productModel';

const app = require(appPath);
const Product = require(productModelPath);

let mongoServer;
let server;
let port;

async function setup() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Create dummy data
    const dummyProducts = [];
    for (let i = 0; i < 100; i++) {
        dummyProducts.push({
            name: `Product ${i}`,
            description: `This is a very long description for product ${i}. It contains repeated text to ensure it compresses well. `.repeat(20),
            price: 100 + i,
            category: 'Benchmark',
            stock: 10,
            ratings: 4.5,
            images: [{ public_id: `id${i}`, url: `url${i}` }],
            user: new mongoose.Types.ObjectId()
        });
    }
    await Product.insertMany(dummyProducts);

    // Start server on random port
    return new Promise((resolve) => {
        server = app.listen(0, () => {
            port = server.address().port;
            console.log(`Benchmark server listening on port ${port}`);
            resolve();
        });
    });
}

async function measure(encoding) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/api/v1/products',
            method: 'GET',
            headers: {
                'Accept-Encoding': encoding
            }
        };

        const req = http.request(options, (res) => {
            let totalBytes = 0;
            res.on('data', (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes < 500) console.log('Response chunk:', chunk.toString());
            });
            res.on('end', () => {
                resolve({
                    bytes: totalBytes,
                    contentEncoding: res.headers['content-encoding']
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function teardown() {
    if (server) server.close();
    await mongoose.disconnect();
    await mongoServer.stop();
}

async function runBenchmark() {
    try {
        console.log('Setting up benchmark environment...');
        await setup();

        console.log('Measuring baseline (identity)...');
        const baseline = await measure('identity');
        console.log(`Baseline size: ${baseline.bytes} bytes`);
        console.log(`Baseline encoding: ${baseline.contentEncoding || 'none'}`);

        console.log('Measuring compressed (gzip)...');
        const compressed = await measure('gzip');
        console.log(`Compressed size: ${compressed.bytes} bytes`);
        console.log(`Compressed encoding: ${compressed.contentEncoding || 'none'}`);

        if (compressed.bytes < baseline.bytes) {
            const improvement = ((baseline.bytes - compressed.bytes) / baseline.bytes * 100).toFixed(2);
            console.log(`\nSUCCESS: Size reduced by ${improvement}%!`);
        } else {
            console.log('\nNo size reduction detected (compression likely not active).');
        }

    } catch (error) {
        console.error('Benchmark failed:', error);
    } finally {
        await teardown();
    }
}

runBenchmark();
