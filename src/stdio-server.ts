#!/usr/bin/env node

/**
 * SB-OMNICORE MCP Server - Stdio Entry Point
 * This is the local development entry point for Cursor IDE integration
 */

import { main } from './index.js';

// Start the MCP server in stdio mode for local development
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
}); 