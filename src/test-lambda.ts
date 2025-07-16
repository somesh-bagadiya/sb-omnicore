// Test Lambda deployment to verify all tools are available
async function testLambdaDeployment() {
  console.log('🚀 Testing Lambda deployment for core 5 tools...\n');
  
  const lambdaUrl = 'https://ar71lc83qb.execute-api.us-west-2.amazonaws.com/production/';
  
  try {
    // Test list_tools request
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error from Lambda:', data.error);
      return;
    }

    const tools = data.result?.tools || [];
    console.log(`📋 Total tools available: ${tools.length}\n`);
    
    // Expected tools
    const expectedTools = [
      // Core Tools (Essential 5)
      'get_profile',
      'list_projects', 
      'get_project_details',
      'list_experiences',
      'list_education'
    ];

    console.log('🔍 Available tools:');
    tools.forEach((tool: any, index: number) => {
      const isExpected = expectedTools.includes(tool.name);
      const status = isExpected ? '✅' : '❓';
      console.log(`${status} ${index + 1}. ${tool.name}`);
    });

    // Check for missing tools
    const availableToolNames = tools.map((t: any) => t.name);
    const missingTools = expectedTools.filter(name => !availableToolNames.includes(name));
    
    if (missingTools.length > 0) {
      console.log('\n❌ Missing tools:');
      missingTools.forEach(name => console.log(`   - ${name}`));
    }

    // Check for unexpected tools
    const unexpectedTools = availableToolNames.filter((name: string) => !expectedTools.includes(name));
    if (unexpectedTools.length > 0) {
      console.log('\n❓ Unexpected tools:');
      unexpectedTools.forEach((name: string) => console.log(`   - ${name}`));
    }

    console.log(`\n🎯 Status: ${tools.length === 5 ? 'SUCCESS' : 'INCOMPLETE'} - ${tools.length}/5 tools available`);
    
    if (tools.length === 5 && missingTools.length === 0) {
      console.log('🎉 All core MCP tools successfully deployed!');
      
      // Test one core tool to make sure it works
      console.log('\n🧪 Testing a core tool (get_profile)...');
      const testResponse = await fetch(lambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'get_profile',
            arguments: {}
          }
        })
      });

      const testData = await testResponse.json();
      if (testData.result) {
        console.log('✅ Core tool working! Sample response:');
        console.log(testData.result.content[0].text.substring(0, 150) + '...');
      } else {
        console.log('❌ Core tool test failed:', testData.error);
      }
    }

  } catch (error) {
    console.error('❌ Failed to test Lambda deployment:', error);
  }
}

testLambdaDeployment(); 