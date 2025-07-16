import { PortfolioClient } from './utils/client.js';

async function testAPIs() {
  const client = new PortfolioClient();
  
  try {
    console.log('🧪 Testing Portfolio API connections...\n');
    
    // Test Profile API
    console.log('📋 Testing Profile API...');
    const profile = await client.fetchProfile();
    console.log('✅ Profile API working - Name:', (profile as any)?.name);
    
    // Test Projects API
    console.log('\n🚀 Testing Projects API...');
    const projects = await client.fetchProjects();
    console.log('✅ Projects API working - Total projects:', (projects as any)?.totalCount);
    
    // Test Experience API
    console.log('\n💼 Testing Experience API...');
    const experience = await client.fetchExperience();
    console.log('✅ Experience API working - Positions:', (experience as any)?.summary?.totalPositions);
    
    // Test Education API
    console.log('\n🎓 Testing Education API...');
    const education = await client.fetchEducation();
    console.log('✅ Education API working - Degrees:', (education as any)?.summary?.totalDegrees);
    
    console.log('\n🎉 All Portfolio APIs are working correctly!');
    console.log('\n📊 Summary:');
    console.log(`- Profile: ${(profile as any)?.name} (${(profile as any)?.headline})`);
    console.log(`- Projects: ${(projects as any)?.totalCount} total projects`);
    console.log(`- Experience: ${(experience as any)?.summary?.totalPositions} positions`);
    console.log(`- Education: ${(education as any)?.summary?.totalDegrees} degrees`);
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testAPIs(); 