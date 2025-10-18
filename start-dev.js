#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Desktop App Development Environment...\n');

// Start Next.js development server
console.log('📦 Starting Next.js development server...');
const nextProcess = spawn('npm', ['run', 'dev:next'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
});

// Wait for Next.js to be ready, then start Electron
setTimeout(() => {
    console.log('\n⚡ Starting Electron...');
    const electronProcess = spawn('npm', ['run', 'electron:dev'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down development environment...');
        nextProcess.kill('SIGINT');
        electronProcess.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down development environment...');
        nextProcess.kill('SIGTERM');
        electronProcess.kill('SIGTERM');
        process.exit(0);
    });

}, 5000); // Wait 5 seconds for Next.js to start

// Handle Next.js process errors
nextProcess.on('error', (error) => {
    console.error('❌ Next.js process error:', error);
});

nextProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Next.js exited with code ${code}`);
    }
});
