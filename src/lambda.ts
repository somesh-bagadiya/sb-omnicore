import { PortfolioClient } from './utils/client.js';

// AWS Lambda Function URL types
interface LambdaFunctionUrlEvent {
  body?: string;
  headers?: Record<string, string>;
  requestContext?: {
    http: {
      method: string;
    };
  };
}

interface LambdaFunctionUrlResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Initialize portfolio client
const client = new PortfolioClient();

// MCP Tools definitions
const tools = [
  {
    name: "get_profile",
    description: "Get Somesh Bagadiya's professional profile information",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "list_projects",
    description: "List portfolio projects with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        featured: {
          type: "boolean",
          description: "Filter to show only featured projects"
        },
        category: {
          type: "string", 
          description: "Filter projects by category"
        },
        technology: {
          type: "string",
          description: "Filter projects by technology"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_project_details",
    description: "Get detailed information about a specific project",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Project ID to fetch details for"
        }
      },
      required: ["id"],
      additionalProperties: false
    }
  },
  {
    name: "list_experiences",
    description: "List professional experiences and work history",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "list_education",
    description: "List educational background and qualifications",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

// Handle JSON-RPC requests
async function handleJsonRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  try {
    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              logging: {}
            },
            serverInfo: {
              name: 'sb-omnicore-mcp',
              version: '1.0.0'
            }
          }
        };

      case 'initialized':
        // Client sends this after receiving initialize response
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {}
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools }
        };

      case 'tools/call':
        const { name, arguments: args } = request.params;
        return await handleToolCall(name, args || {}, request.id);

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { resources: [] }
        };

      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { prompts: [] }
        };

      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          }
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

// Handle tool calls
async function handleToolCall(name: string, args: any, id: string | number): Promise<JsonRpcResponse> {
  try {
    let result;

    switch (name) {
      case 'get_profile':
        const profileData = await client.fetchProfile();
        result = {
          content: [{ type: "text", text: JSON.stringify(profileData, null, 2) }]
        };
        break;

      case 'list_projects':
        const projectsData = await client.fetchProjects();
        // Apply filtering if provided
        let projects = (projectsData as any)?.allProjects || [];
        
        if (args.featured === true) {
          projects = projects.filter((p: any) => p.featured);
        }
        if (args.category) {
          projects = projects.filter((p: any) => p.category === args.category);
        }
        if (args.technology) {
          projects = projects.filter((p: any) => 
            p.technologies?.some((tech: any) => 
              tech.toLowerCase().includes(args.technology.toLowerCase())
            )
          );
        }

        result = {
          content: [{ type: "text", text: JSON.stringify({ projects }, null, 2) }]
        };
        break;

      case 'get_project_details':
        if (!args.id) {
          throw new Error("Project ID is required");
        }
        const projectDetails = await client.fetchProjectDetails(args.id);
        result = {
          content: [{ type: "text", text: JSON.stringify(projectDetails, null, 2) }]
        };
        break;

      case 'list_experiences':
        const experienceData = await client.fetchExperience();
        result = {
          content: [{ type: "text", text: JSON.stringify(experienceData, null, 2) }]
        };
        break;

      case 'list_education':
        const educationData = await client.fetchEducation();
        result = {
          content: [{ type: "text", text: JSON.stringify(educationData, null, 2) }]
        };
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      jsonrpc: '2.0',
      id,
      result
    };

  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Tool execution failed'
      }
    };
  }
}

// AWS Lambda handler
export const handler = async (event: LambdaFunctionUrlEvent): Promise<LambdaFunctionUrlResult> => {
  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    console.log('🔗 SB-OMNICORE MCP Lambda handler invoked');

    if (!event.body) {
      throw new Error('Request body is required');
    }

    // Parse JSON-RPC request
    const request: JsonRpcRequest = JSON.parse(event.body);
    
    console.log(`📋 Processing request: ${request.method}`);

    // Handle the JSON-RPC request
    const response = await handleJsonRpcRequest(request);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('❌ Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : String(error)
        }
      })
    };
  }
}; 