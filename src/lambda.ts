import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { PortfolioClient } from './utils/client.js';

// AWS Lambda Function URL types
interface LambdaFunctionUrlEvent {
  version?: string;
  routeKey?: string;
  rawPath?: string;
  rawQueryString?: string;
  headers?: Record<string, string>;
  requestContext?: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body?: string;
  isBase64Encoded?: boolean;
  // Legacy API Gateway compatibility
  httpMethod?: string;
  path?: string;
}

interface LambdaFunctionUrlResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// Import the configured server from index.ts
// Note: We'll need to export the server instance from index.ts
let serverInstance: Server | null = null;
let transportInstance: StreamableHTTPServerTransport | null = null;

// Initialize the MCP server (lazy initialization)
async function initializeMCPServer(): Promise<{ server: Server; transport: StreamableHTTPServerTransport }> {
  if (serverInstance && transportInstance) {
    return { server: serverInstance, transport: transportInstance };
  }

  console.log('🚀 Initializing MCP server for Lambda...');
  
  // Create server instance (same configuration as in index.ts)
  serverInstance = new Server(
    {
      name: "sb-omnicore-mcp",
      version: "1.0.0",
      description: "SB-OMNICORE: AI assistant with comprehensive context about Somesh Bagadiya's professional portfolio"
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

  // Test API connection
  try {
    console.log('🔗 Testing portfolio API connection...');
    await client.fetchProfile();
    console.log('✅ Portfolio API connection successful');
  } catch (error) {
    console.error('⚠️ Portfolio API connection failed:', error);
    // Continue anyway - the server will handle API errors gracefully
  }

  // Import and register all handlers from index.ts
  // For now, we'll duplicate the registration logic here
  // TODO: Refactor to share handler registration between stdio and http modes
  
  // Register resources (simplified version)
  const { 
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema
  } = await import('@modelcontextprotocol/sdk/types.js');

  // Register resource handlers
  serverInstance.setRequestHandler(ListResourcesRequestSchema, async () => {
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

  serverInstance.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    
    try {
      switch (uri) {
        case 'portfolio://profile':
          const profileData = await client.fetchProfile();
          return {
            contents: [{
              uri: 'portfolio://profile',
              mimeType: 'application/json',
              text: JSON.stringify(profileData, null, 2)
            }]
          };

        case 'portfolio://projects':
          const projectsData = await client.fetchProjects();
          return {
            contents: [{
              uri: 'portfolio://projects',
              mimeType: 'application/json',
              text: JSON.stringify(projectsData, null, 2)
            }]
          };

        case 'portfolio://experience':
          const experienceData = await client.fetchExperience();
          return {
            contents: [{
              uri: 'portfolio://experience',
              mimeType: 'application/json',
              text: JSON.stringify(experienceData, null, 2)
            }]
          };

        case 'portfolio://education':
          const educationData = await client.fetchEducation();
          return {
            contents: [{
              uri: 'portfolio://education',
              mimeType: 'application/json',
              text: JSON.stringify(educationData, null, 2)
            }]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Failed to read resource ${uri}: ${error}`);
    }
  });

  // Register tool handlers
  serverInstance.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_profile",
          description: "Return Somesh Bagadiya's complete professional profile object including personal information, skills, metrics, social links, and professional summary.",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        },
        {
          name: "list_projects",
          description: "Return complete project portfolio (16 projects) with optional filters. Pass all parameters in a single JSON object.",
          inputSchema: {
            type: "object",
            properties: {
              category: { 
                type: "string", 
                description: "Filter by project category/domain. Must be one of the valid categories.",
                enum: ["GenAI", "AI & Machine Learning", "Computer Vision", "Web & Cloud", "IoT & Embedded", "Data Analytics", "AR/VR & Immersive Tech"]
              },
              technology: { 
                type: "string", 
                description: "Filter by specific technology used in projects. Examples: 'Python', 'React', 'OpenCV', 'TensorFlow', 'RAG', 'OpenAI'"
              },
              featured: { 
                type: "boolean", 
                description: "Filter to show only featured projects (true) or all projects (false/undefined). Must be a boolean value, not a string."
              }
            },
            required: [],
            additionalProperties: false
          }
        },
        {
          name: "get_project_details",
          description: "Return complete project details by ID including structured content from detailed project files.",
          inputSchema: {
            type: "object",
            properties: {
              id: { 
                type: "string", 
                description: "Project ID to retrieve. Must be one of the 16 available project IDs.",
                enum: ["personal-portfolio-website", "introspect-ai", "carbon-sense-powered-by-ibm-watsonx", "rage-chrome-extension-for-personalized-rag", "reflectra-ai-digital-journal", "email-intent-analysis", "synchronous-traffic-signals", "market-prediction-using-lstms", "eye-tracking-and-gaze-tracking", "dc-insulation-monitoring-system", "port-config", "quotation-generator-application", "iot-based-self-driving-car-with-adas", "high-on-tech", "creva", "voice-assistant"]
              }
            },
            required: ["id"]
          }
        },
        {
          name: "list_experiences",
          description: "Return comprehensive work experience list with optional filters.",
          inputSchema: {
            type: "object",
            properties: {
              sinceYear: { 
                type: "number", 
                description: "Filter experiences starting from this year (e.g., 2020, 2022, 2024)"
              },
              company: { 
                type: "string", 
                description: "Filter by company name (exact match)"
              },
              skill: { 
                type: "string", 
                description: "Filter by skill or technology used in the role (e.g., 'Python', 'Machine Learning', 'React')"
              }
            },
            required: []
          }
        },
        {
          name: "list_education",
          description: "Return academic background including degrees, institutions, coursework, and achievements.",
          inputSchema: {
            type: "object",
            properties: {
              degreeType: { 
                type: "string", 
                description: "Filter by degree type (e.g., 'Master', 'Bachelor', 'Certificate')"
              },
              institution: { 
                type: "string", 
                description: "Filter by institution name (exact match)"
              }
            },
            required: []
          }
        }
      ]
    };
  });

  serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
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
          // Use the same enhanced logic from index.ts
          const params = args || {};
          const { category, technology, featured } = params;
          
          const data: any = await client.fetchProjects();
          let projects = data?.allProjects || data?.projects || data;
          
          if (!Array.isArray(projects)) {
            return {
              content: [{ type: "text", text: JSON.stringify({
                error: "Invalid data structure",
                message: "Projects data is not in the expected array format"
              }, null, 2) }],
              isError: true
            };
          }

          // Apply filters
          if (category) {
            projects = projects.filter((p: any) => {
              if (Array.isArray(p.domain)) {
                return p.domain.includes(category);
              }
              return p.category === category || p.domain === category;
            });
          }
          
          if (technology) {
            projects = projects.filter((p: any) => {
              const technologies = p.technologies || p.tech || p.stack || [];
              return Array.isArray(technologies) ? technologies.includes(technology) : false;
            });
          }
          
          if (featured !== undefined) {
            projects = projects.filter((p: any) => p.featured === featured);
          }

          return {
            content: [{ type: "text", text: JSON.stringify({ projects }, null, 2) }]
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
          
          const enhancedProject = await client.fetchProjectDetails(id);
          
          return {
            content: [{ type: "text", text: JSON.stringify(enhancedProject, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching project details: ${error}` }],
            isError: true
          };
        }

      case "list_experiences":
        try {
          const data = await client.fetchExperience();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching experiences: ${error}` }],
            isError: true
          };
        }

      case "list_education":
        try {
          const data = await client.fetchEducation();
          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error fetching education: ${error}` }],
            isError: true
          };
        }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true
        };
    }
  });

  // Create transport for Lambda (stateless mode)
  transportInstance = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined // Stateless mode for Lambda
  });

  // Connect server to transport
  await serverInstance.connect(transportInstance);
  
  console.log('✅ MCP server initialized for Lambda deployment');
  
  return { server: serverInstance, transport: transportInstance };
}

// Convert Lambda event to HTTP request format for StreamableHTTPServerTransport
function lambdaEventToHttpRequest(event: LambdaFunctionUrlEvent): {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | undefined;
} {
  const method = event.requestContext?.http?.method || event.httpMethod || 'POST';
  const path = event.requestContext?.http?.path || event.rawPath || event.path || '/';
  const queryString = event.rawQueryString || '';
  const url = queryString ? `${path}?${queryString}` : path;
  
  const headers = event.headers || {};
  const body = event.body;

  return { method, url, headers, body };
}

// Lambda handler for MCP server
export const handler = async (
  event: LambdaFunctionUrlEvent
): Promise<LambdaFunctionUrlResult> => {
  try {
    console.log('🔗 SB-OMNICORE MCP Lambda handler invoked');
    console.log('Event type:', event.version ? 'Function URL' : 'API Gateway');
    
    // Initialize MCP server (lazy initialization)
    const { server, transport } = await initializeMCPServer();
    
    // Convert Lambda event to HTTP request format
    const httpRequest = lambdaEventToHttpRequest(event);
    console.log(`Request: ${httpRequest.method} ${httpRequest.url}`);
    
    // Create mock request/response objects for StreamableHTTPServerTransport
    const mockRequest = {
      method: httpRequest.method,
      url: httpRequest.url,
      headers: httpRequest.headers,
      body: httpRequest.body,
      on: () => {},
      once: () => {},
      emit: () => {},
      pipe: () => {}
    };

    const mockResponse = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: '',
      writeHead: (statusCode: number, headers?: Record<string, string>) => {
        mockResponse.statusCode = statusCode;
        if (headers) Object.assign(mockResponse.headers, headers);
      },
      write: (data: string) => {
        mockResponse.body += data;
      },
      end: (data?: string) => {
        if (data) mockResponse.body += data;
      },
      setHeader: (name: string, value: string) => {
        mockResponse.headers[name] = value;
      }
    };

    // Handle the request through the MCP StreamableHTTPServerTransport
    await transport.handleRequest(mockRequest as any, mockResponse as any);
    
    const response = {
      status: mockResponse.statusCode,
      headers: mockResponse.headers,
      body: mockResponse.body
    };

    // Convert MCP transport response to Lambda response format
    return {
      statusCode: response.status || 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        ...response.headers
      },
      body: response.body || ''
    };

  } catch (error) {
    console.error('❌ Lambda handler error:', error);
    
    // Return standardized error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        service: 'SB-OMNICORE MCP Server'
      })
    };
  }
}; 