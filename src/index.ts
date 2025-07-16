import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PortfolioClient } from './utils/client.js';


// Create MCP server instance
const server = new Server(
  {
    name: "portfolio-mcp-server",
    version: "1.0.0",
    description: "AI assistant with comprehensive context about Somesh Bagadiya's professional portfolio"
  },
  {
    capabilities: {
      resources: {},
      prompts: {},
      tools: {}
    },
  }
);

// Create portfolio client
const client = new PortfolioClient();

// Register MCP resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'portfolio://profile',
        name: 'Developer Profile',
        description: 'Comprehensive professional profile for Somesh Bagadiya',
        mimeType: 'application/json'
      },
      {
        uri: 'portfolio://projects',
        name: 'Project Portfolio', 
        description: 'Complete project portfolio with resume-optimized descriptions',
        mimeType: 'application/json'
      },
      {
        uri: 'portfolio://experience',
        name: 'Work Experience',
        description: 'Professional work history with resume-ready formatting',
        mimeType: 'application/json'
      },
      {
        uri: 'portfolio://education',
        name: 'Education Background',
        description: 'Academic background with coursework and achievements',
        mimeType: 'application/json'
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  switch (uri) {
    case 'portfolio://profile':
      try {
        const profileData = await client.fetchProfile() as any;
        return {
          contents: [{
            uri: 'portfolio://profile',
            mimeType: 'application/json',
            text: JSON.stringify({
              ...profileData,
              context: {
                lastUpdated: new Date().toISOString(),
                source: "Live portfolio data",
                usage: "Use this data to understand Somesh's background, skills, and current availability for resume tailoring and interview preparation"
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'portfolio://profile',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: "Failed to fetch live profile data",
              fallback: {
                name: "Somesh Bagadiya",
                headline: "AI/ML Engineer & Developer",
                location: "San Jose, CA",
                status: "Available for AI/ML engineering roles",
                message: "Please check portfolio connection"
              }
            }, null, 2)
          }]
        };
      }

    case 'portfolio://projects':
      try {
        const projectsData = await client.fetchProjects() as any;
        return {
          contents: [{
            uri: 'portfolio://projects',
            mimeType: 'application/json',
            text: JSON.stringify({
              ...projectsData,
              resumeGuidance: {
                featuredProjects: "Use these featured projects for most resumes - they represent your strongest work",
                domainSelection: "Filter by domain based on job requirements (GenAI for AI roles, Web & Cloud for full-stack)",
                descriptionFormats: "Choose technical/business/academic based on role type and company culture",
                impactMetrics: "Always include quantified results when available"
              },
              context: {
                totalProjects: projectsData.totalCount || 16,
                lastUpdated: new Date().toISOString(),
                source: "Live portfolio data",
                usage: "Use this project portfolio to understand Somesh's technical capabilities and select relevant projects for resume tailoring"
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'portfolio://projects',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: "Failed to fetch live projects data",
              message: "Portfolio connection unavailable - please try again"
            }, null, 2)
          }]
        };
      }

    case 'portfolio://experience':
      try {
        const experienceData = await client.fetchExperience() as any;
        return {
          contents: [{
            uri: 'portfolio://experience',
            mimeType: 'application/json',
            text: JSON.stringify({
              ...experienceData,
              context: {
                lastUpdated: new Date().toISOString(),
                source: "Live portfolio data",
                usage: "Use this work experience data to understand Somesh's career progression and achievements for resume tailoring"
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'portfolio://experience',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: "Failed to fetch live experience data",
              message: "Portfolio connection unavailable - please try again"
            }, null, 2)
          }]
        };
      }

    case 'portfolio://education':
      try {
        const educationData = await client.fetchEducation() as any;
        return {
          contents: [{
            uri: 'portfolio://education',
            mimeType: 'application/json',
            text: JSON.stringify({
              ...educationData,
              context: {
                lastUpdated: new Date().toISOString(),
                source: "Live portfolio data",
                usage: "Use this education data to understand Somesh's academic background and relevant coursework for resume tailoring"
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'portfolio://education',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: "Failed to fetch live education data",
              message: "Portfolio connection unavailable - please try again"
            }, null, 2)
          }]
        };
      }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Register prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'resume-assistant',
        description: 'AI behavior guide for acting as Somesh\'s resume and career assistant',
        arguments: []
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === 'resume-assistant') {
    return {
      description: 'AI behavior guide for acting as Somesh\'s resume and career assistant',
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `
You are Somesh Bagadiya's AI career assistant with comprehensive knowledge about his professional background. Your primary role is to help with resume tailoring and interview preparation.

## ABOUT SOMESH:
- **Name**: Somesh Bagadiya  
- **Role**: AI/ML & Software Engineer
- **Location**: San Jose, CA  
- **Experience**: 4+ years with 16+ completed projects
- **Current Status**: Machine Learning Researcher at SJSU Research Foundation
- **Education**: MS in AI (SJSU, 2025), BE in IT (SPPU, 2021)

## EXPERTISE AREAS:
- **AI/ML**: PyTorch, TensorFlow, LLMs/Transformers, RAG systems, GenAI
- **Computer Vision**: Image processing, object detection, deep learning
- **Web Development**: React, Next.js, FastAPI, full-stack development  
- **Cloud & DevOps**: AWS, Docker, deployment optimization
- **Languages**: Python (expert), JavaScript/TypeScript (advanced), C++ (intermediate)

## CURRENT FEATURED PROJECTS (Top 6):
1. **Personal Portfolio Website** - Next.js with dynamic filtering
2. **Introspect AI** - Mental health monitoring with knowledge graphs and RAG
3. **CarbonSense powered by IBM WatsonX** - AI-driven carbon footprint platform
4. **RAGE Chrome Extension** - Personalized RAG system using NVIDIA NIMs
5. **Reflectra AI Digital Journal** - AI journaling with agentic pipeline
6. **Email Intent Analysis** - NLP-based email classification system

## WORK EXPERIENCE PROGRESSION:
1. **Machine Learning Researcher** - SJSU Research Foundation (Jun 2024 - Present)
2. **Software Engineer Intern** - Artonifs (May 2024 - Aug 2024)  
3. **Software Engineer** - Cognizant - COX (Mar 2021 - Jul 2023)
4. **Data Engineer Intern** - Biencaps Systems (May 2020 - Feb 2021)

## YOUR RESPONSIBILITIES:

### Resume Tailoring:
1. **Analyze job requirements** and match with Somesh's relevant experience
2. **Select appropriate projects** from the 16-project portfolio based on role requirements
3. **Use actual achievement bullet points** from work experience (already quantified)
4. **Optimize technical keywords** for ATS systems
5. **Balance technical depth** with business impact based on role type

### Interview Preparation:
1. **Provide specific examples** from actual projects for behavioral questions
2. **Explain technical implementations** with appropriate detail level
3. **Highlight problem-solving approaches** demonstrated in past work
4. **Connect experiences** to target company's domain and challenges

### Communication Style:
- **Professional but approachable** - suitable for career discussions
- **Technical accuracy** - use correct terminology and frameworks
- **Impact-focused** - always emphasize results and value delivered
- **Contextual adaptation** - adjust technical depth based on audience

## INSTRUCTIONS:
1. **Always use the provided resources** to get accurate, up-to-date information
2. **Reference specific projects and achievements** with real details from the data
3. **Tailor recommendations** to the specific job or company mentioned
4. **Provide actionable advice** - specific bullet points, keywords, examples
5. **Ask clarifying questions** if you need more context about the opportunity

Remember: You represent Somesh professionally. Always be accurate, helpful, and focused on advancing his career goals.
`
        }
      }]
    };
  }
  
  throw new Error(`Unknown prompt: ${request.params.name}`);
});

/**
 * ------------------------------------------------------------------
 * TOOL REGISTRATION - CONTEXT PROVISION ONLY
 * ------------------------------------------------------------------
 * Clean MCP server architecture: Provides rich portfolio context to Claude.
 * No AI processing - Claude handles analysis, summarization, and intelligence.
 */

// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_profile",
        description: "Return Somesh Bagadiya's complete professional profile object",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "list_projects",
        description: "Return project array with optional filters by category, technology, or featured status",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by project category" },
            technology: { type: "string", description: "Filter by technology used" },
            featured: { type: "boolean", description: "Filter by featured status" }
          },
          required: []
        }
      },
      {
        name: "get_project_details",
        description: "Return single project details by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Project ID to retrieve" }
          },
          required: ["id"]
        }
      },
      {
        name: "list_experiences",
        description: "Return work experience list with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            sinceYear: { type: "number", description: "Filter experiences starting from this year" },
            company: { type: "string", description: "Filter by company name" },
            skill: { type: "string", description: "Filter by skill used" }
          },
          required: []
        }
      },
      {
        name: "list_education",
        description: "Return education list with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            degreeType: { type: "string", description: "Filter by degree type (e.g., 'Master', 'Bachelor')" },
            institution: { type: "string", description: "Filter by institution name" }
          },
          required: []
        }
      }
    ]
  };
});

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_profile":
      try {
        const data = await client.fetchProfile();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching profile: ${error}` }],
          isError: true
        };
      }

    case "list_projects":
      try {
        const { category, technology, featured } = args as any;
        const data: any = await client.fetchProjects();
        let projects = data?.projects || data;

        if (category) {
          projects = projects.filter((p: any) => p.category === category);
        }
        if (technology) {
          projects = projects.filter((p: any) => p.technologies?.includes(technology));
        }
        if (featured !== undefined) {
          projects = projects.filter((p: any) => p.featured === featured);
        }

        return {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching projects: ${error}` }],
          isError: true
        };
      }

    case "get_project_details":
      try {
        const { id } = args as any;
        if (!id) throw new Error("Project ID is required");
        
        const data: any = await client.fetchProjects();
        // Fix: Use the correct data structure - allProjects contains the array
        const projects = data?.allProjects || data?.featured || [];
        if (!Array.isArray(projects)) {
          throw new Error("Projects data is not in expected array format");
        }
        
        // Fix: Support both id and title matching for robust ID system
        const project = projects.find((p: any) => 
          p.id === id || p.title === id
        );
        
        if (!project) {
          throw new Error(`Project with id '${id}' not found. Available projects: ${projects.map((p: any) => p.title || p.id).join(', ')}`);
        }
        
        return {
          content: [{ type: "text", text: JSON.stringify(project, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching project details: ${error}` }],
          isError: true
        };
      }

    case "list_experiences":
      try {
        const { sinceYear, company, skill } = args as any;
        const data: any = await client.fetchExperience();
        let experiences = data?.experiences || data;

        if (sinceYear) {
          experiences = experiences.filter((e: any) => {
            const year = parseInt(e.startDate?.substring(0, 4) || "0");
            return year >= sinceYear;
          });
        }
        if (company) {
          experiences = experiences.filter((e: any) => e.company?.toLowerCase() === company.toLowerCase());
        }
        if (skill) {
          experiences = experiences.filter((e: any) => e.skills?.includes(skill));
        }

        return {
          content: [{ type: "text", text: JSON.stringify(experiences, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching experiences: ${error}` }],
          isError: true
        };
      }

    case "list_education":
      try {
        const { degreeType, institution } = args as any;
        const data: any = await client.fetchEducation();
        let education = data?.education || data;

        if (degreeType) {
          education = education.filter((ed: any) => ed.degree?.toLowerCase().includes(degreeType.toLowerCase()));
        }
        if (institution) {
          education = education.filter((ed: any) => ed.institution?.toLowerCase().includes(institution.toLowerCase()));
        }

        return {
          content: [{ type: "text", text: JSON.stringify(education, null, 2) }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching education: ${error}` }],
          isError: true
        };
      }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Test function to verify our client works
async function testConnection() {
  try {
    console.log('Testing connection to portfolio APIs...');
    const profile = await client.fetchProfile();
    console.log('✅ Profile API working');
    
    const projects = await client.fetchProjects();
    console.log('✅ Projects API working');
    
    const experience = await client.fetchExperience();
    console.log('✅ Experience API working');
    
    const education = await client.fetchEducation();
    console.log('✅ Education API working');
    
    console.log('🎉 All APIs working correctly!');
  } catch (error) {
    console.error('❌ API connection failed:', error);
  }
}

// For local testing
export async function main() {
  // Test API connection first
  await testConnection();
  
  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🚀 MCP Server started and ready!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { server }; 