#!/usr/bin/env node

// Simple proxy to connect Cursor to remote MCP server
const { spawn } = require('child_process');

const remoteUrl = 'https://ar71lc83qb.execute-api.us-west-2.amazonaws.com/production/';

// Use the MCP HTTP client to connect to remote server
const mcpClient = spawn('npx', [
  '-y', 
  '@modelcontextprotocol/server-http', 
  remoteUrl
], {
  stdio: 'inherit'
});

mcpClient.on('error', (err) => {
  console.error('Failed to start MCP client:', err);
  process.exit(1);
});

mcpClient.on('close', (code) => {
  process.exit(code);
}); 