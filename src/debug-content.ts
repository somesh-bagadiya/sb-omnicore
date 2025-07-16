import fetch from 'node-fetch';

/**
 * Debug script to test content API endpoints directly
 */

const PORTFOLIO_BASE_URL = 'https://someshbagadiya.dev';

async function debugContentAPI() {
  console.log('🔍 Debugging Content API Endpoints');
  console.log('===================================\n');
  
  const testProjectId = 'introspect-ai';
  
  try {
    // Test 1: Direct content endpoint
    console.log('Test 1: Direct content endpoint');
    console.log(`URL: ${PORTFOLIO_BASE_URL}/api/projects/content?projectId=${testProjectId}`);
    
    const contentResponse = await fetch(`${PORTFOLIO_BASE_URL}/api/projects/content?projectId=${testProjectId}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Portfolio-MCP-Debug/1.0.0'
      }
    });
    
    console.log(`Status: ${contentResponse.status} ${contentResponse.statusText}`);
    
    if (contentResponse.ok) {
      const contentData: any = await contentResponse.json();
      console.log('Content Data:');
      console.log(`  - Project ID: ${contentData.projectId}`);
      console.log(`  - Word Count: ${contentData.wordCount}`);
      console.log(`  - Content Length: ${contentData.content?.length || 0} chars`);
      console.log(`  - Last Modified: ${contentData.lastModified}`);
      
      if (contentData.content) {
        console.log(`  - Content Preview: ${contentData.content.substring(0, 200)}...`);
      }
    } else {
      const errorData = await contentResponse.text();
      console.log(`Error: ${errorData}`);
    }
    
    // Test 2: MCP project endpoint 
    console.log('\nTest 2: MCP project endpoint');
    console.log(`URL: ${PORTFOLIO_BASE_URL}/api/mcp/projects?projectId=${testProjectId}`);
    
    const mcpResponse = await fetch(`${PORTFOLIO_BASE_URL}/api/mcp/projects?projectId=${testProjectId}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Portfolio-MCP-Debug/1.0.0'
      }
    });
    
    console.log(`Status: ${mcpResponse.status} ${mcpResponse.statusText}`);
    
    if (mcpResponse.ok) {
      const mcpData: any = await mcpResponse.json();
      console.log('MCP Data:');
      console.log(`  - Data type: ${typeof mcpData}`);
      console.log(`  - Keys: ${Object.keys(mcpData || {}).join(', ')}`);
      
      if (mcpData.projects && Array.isArray(mcpData.projects)) {
        const project = mcpData.projects[0];
        if (project) {
          console.log(`  - Project: ${project.title}`);
          console.log(`  - Has Detailed Content: ${project.hasDetailedContent}`);
          console.log(`  - Content Tier: ${project.contentTier}`);
          console.log(`  - Detailed Content: ${project.detailedContent ? 'Yes' : 'No'}`);
        }
      }
    } else {
      const errorData = await mcpResponse.text();
      console.log(`Error: ${errorData}`);
    }
    
    // Test 3: Check if content files exist by trying multiple projects
    console.log('\nTest 3: Testing multiple projects for content availability');
    const testProjects = ['introspect-ai', 'personal-portfolio-website', 'creva', 'carbon-sense-powered-by-ibm-watsonx'];
    
    for (const projectId of testProjects) {
      const response = await fetch(`${PORTFOLIO_BASE_URL}/api/projects/content?projectId=${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Portfolio-MCP-Debug/1.0.0'
        }
      });
      
      console.log(`  ${projectId}: Status ${response.status} - ${response.ok ? 'Content Available' : 'No Content'}`);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Run the debug
debugContentAPI().catch(console.error); 