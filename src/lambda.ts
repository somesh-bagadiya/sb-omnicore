// AWS Lambda types
interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  body?: string;
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
import { PortfolioClient } from './utils/client.js';

// Create portfolio client instance
const client = new PortfolioClient();

// Lambda handler for MCP server
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(`Request: ${event.httpMethod} ${event.path}`);

    // Handle MCP server info endpoint
    if (event.path === '/' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
          name: 'Portfolio MCP Server',
          version: '1.0.0',
          description: 'Model Context Protocol server for Somesh Bagadiya portfolio',
          capabilities: {
            resources: true,
            prompts: true,
            tools: true
          },
          endpoints: {
            resources: ['portfolio://profile', 'portfolio://projects', 'portfolio://experience', 'portfolio://education'],
            prompts: ['resume-assistant'],
            tools: ['get_profile', 'list_projects', 'get_project_details', 'list_experiences', 'list_education']
          },
          portfolioBaseUrl: process.env.PORTFOLIO_BASE_URL || 'https://someshbagadiya.dev',
          status: 'operational',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Handle resource requests - list all resources
    if (event.path === '/resources' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
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
        })
      };
    }

    // Handle specific resource reading
    if (event.path?.startsWith('/resource/') && event.httpMethod === 'GET') {
      const resourceName = event.path.replace('/resource/', '');
      
      let data;
      try {
        switch (resourceName) {
          case 'profile':
            data = await client.fetchProfile();
            break;
          case 'projects':
            data = await client.fetchProjects();
            break;
          case 'experience':
            data = await client.fetchExperience();
            break;
          case 'education':
            data = await client.fetchEducation();
            break;
          default:
            throw new Error(`Unknown resource: ${resourceName}`);
        }

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            contents: [{
              uri: `portfolio://${resourceName}`,
              mimeType: 'application/json',
                             text: JSON.stringify({
                 ...(data as Record<string, any>),
                 context: {
                   lastUpdated: new Date().toISOString(),
                   source: "Live portfolio data via MCP server",
                   usage: "MCP resource data for AI assistants"
                 }
               }, null, 2)
            }]
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: `Failed to fetch ${resourceName} data`,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        };
      }
    }

    // Handle prompts requests
    if (event.path === '/prompts' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          prompts: [
            {
              name: 'resume-assistant',
              description: 'AI behavior guide for acting as Somesh\'s resume and career assistant',
              arguments: []
            }
          ]
        })
      };
    }

    // Handle specific prompt requests
    if (event.path?.startsWith('/prompt/') && event.httpMethod === 'GET') {
      const promptName = event.path.replace('/prompt/', '');
      
      if (promptName === 'resume-assistant') {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            description: 'AI behavior guide for acting as Somesh\'s resume and career assistant',
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: `You are Somesh Bagadiya's AI career assistant with comprehensive knowledge about his professional background. Your primary role is to help with resume tailoring and interview preparation.

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

Remember: You represent Somesh professionally. Always be accurate, helpful, and focused on advancing his career goals.`
              }
            }]
          })
        };
      } else {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Prompt not found',
            message: `Unknown prompt: ${promptName}`,
            availablePrompts: ['resume-assistant']
          })
        };
      }
    }

    // Handle tools requests - list all tools
    if (event.path === '/tools' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
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
        })
      };
    }

    // Handle tool calls via POST
    if (event.path === '/tools/call' && event.httpMethod === 'POST') {
      try {
        const body = JSON.parse(event.body || '{}');
        const { name, arguments: args } = body;

        let result;
        switch (name) {
          case "get_profile":
            try {
              const data = await client.fetchProfile();
              result = {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: `Error fetching profile: ${error}` }],
                isError: true
              };
            }
            break;

          case "list_projects":
            try {
              const { category, technology, featured } = args || {};
              const data: any = await client.fetchProjects();
              
              // Handle different possible data structures
              let projects = [];
              if (Array.isArray(data)) {
                projects = data;
              } else if (data?.allProjects && Array.isArray(data.allProjects)) {
                projects = data.allProjects;
              } else if (data?.projects && Array.isArray(data.projects)) {
                projects = data.projects;
              } else {
                throw new Error("Invalid projects data structure received from API");
              }

              // Apply filters
              if (category) {
                projects = projects.filter((p: any) => p.domain?.includes(category));
              }
              if (technology) {
                projects = projects.filter((p: any) => p.tech?.includes(technology));
              }
              if (featured !== undefined) {
                projects = projects.filter((p: any) => p.featured === featured);
              }

              result = {
                content: [{ type: "text", text: JSON.stringify(projects, null, 2) }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: `Error fetching projects: ${error}` }],
                isError: true
              };
            }
            break;

          case "get_project_details":
            try {
              const { id } = args || {};
              if (!id) throw new Error("Project ID is required");
              
              const data: any = await client.fetchProjects();
              
              // Handle different possible data structures
              let projects = [];
              if (Array.isArray(data)) {
                projects = data;
              } else if (data?.allProjects && Array.isArray(data.allProjects)) {
                projects = data.allProjects;
              } else if (data?.projects && Array.isArray(data.projects)) {
                projects = data.projects;
              } else {
                throw new Error("Invalid projects data structure received from API");
              }
              
              const project = projects.find((p: any) => p.id === id);
              
              if (!project) {
                throw new Error(`Project with id '${id}' not found. Available IDs: ${projects.map((p: any) => p.id).join(', ')}`);
              }
              
              result = {
                content: [{ type: "text", text: JSON.stringify(project, null, 2) }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: `Error fetching project details: ${error}` }],
                isError: true
              };
            }
            break;

          case "list_experiences":
            try {
              const { sinceYear, company, skill } = args || {};
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

              result = {
                content: [{ type: "text", text: JSON.stringify(experiences, null, 2) }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: `Error fetching experiences: ${error}` }],
                isError: true
              };
            }
            break;

          case "list_education":
            try {
              const { degreeType, institution } = args || {};
              const data: any = await client.fetchEducation();
              let education = data?.education || data;

              if (degreeType) {
                education = education.filter((ed: any) => ed.degree?.toLowerCase().includes(degreeType.toLowerCase()));
              }
              if (institution) {
                education = education.filter((ed: any) => ed.institution?.toLowerCase().includes(institution.toLowerCase()));
              }

              result = {
                content: [{ type: "text", text: JSON.stringify(education, null, 2) }]
              };
            } catch (error) {
              result = {
                content: [{ type: "text", text: `Error fetching education: ${error}` }],
                isError: true
              };
            }
            break;



          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(result)
        };

      } catch (error) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: 'Tool call failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        };
      }
    }

    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: ''
      };
    }

    // Default response for unhandled paths
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: {
          '/': 'Server info',
          '/resources': 'List all resources',
          '/resource/{resourceName}': 'Get specific resource (profile, projects, experience, education)',
          '/prompts': 'List all prompts',
          '/prompt/{promptName}': 'Get specific prompt (resume-assistant)',
          '/tools': 'List all tools',
          '/tools/call': 'Call a specific tool (POST with {name, arguments})'
        }
      })
    };

  } catch (error) {
    console.error('Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request',
        timestamp: new Date().toISOString()
      })
    };
  }
}; 