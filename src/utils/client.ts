import fetch from 'node-fetch';

// Use live portfolio website - https://someshbagadiya.dev
const PORTFOLIO_BASE_URL = process.env.PORTFOLIO_BASE_URL || 'https://someshbagadiya.dev';

export class PortfolioClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = `${PORTFOLIO_BASE_URL}/api/mcp`;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'SB-OMNICORE-MCP/1.0.0'
    };
    
    console.log(`🔗 Connecting to Portfolio APIs at: ${this.baseUrl}`);
  }

  async fetchProfile() {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: this.headers,
        // @ts-ignore - timeout is valid for node-fetch
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile data from portfolio');
    }
  }

  async fetchProjects() {
    try {
      const response = await fetch(`${this.baseUrl}/projects`, {
        headers: this.headers,
        // @ts-ignore - timeout is valid for node-fetch
        timeout: 10000 // Projects might be larger
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Failed to fetch projects data from portfolio');
    }
  }

  /**
   * Fetch detailed content for a specific project
   * Fixed: Use the working MCP projects endpoint instead of non-existent content API
   */
  async fetchProjectContent(projectId: string): Promise<any> {
    try {
      // Use the working MCP projects endpoint with includeContent=true
      const response = await fetch(`${this.baseUrl}/projects?projectId=${projectId}&includeContent=true`, {
        headers: this.headers,
        // @ts-ignore - timeout is valid for node-fetch
        timeout: 15000
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No detailed content available for this project
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: any = await response.json();
      
      // Extract the specific project from the response
      let project = null;
      if (data.allProjects && Array.isArray(data.allProjects)) {
        project = data.allProjects.find((p: any) => p.id === projectId);
      }
      
      if (!project) {
        return null;
      }
      
      // Transform the response to match expected content format
      let content = '';
      let wordCount = 0;
      
      if (project.detailedContent && project.detailedContent.sections) {
        const sections = project.detailedContent.sections;
        content = [
          `# Project Overview\n${sections.overview || ''}`,
          `\n\n# Technical Implementation\n${sections.technicalDetails || ''}`,
          `\n\n# Challenges & Solutions\n${sections.challenges || ''}`,
          `\n\n# Results & Impact\n${sections.outcomes || ''}`,
          sections.futureEnhancements ? `\n\n# Future Enhancements\n${sections.futureEnhancements}` : ''
        ].join('');
        wordCount = project.detailedContent.wordCount || 0;
      }
      
      return {
        projectId,
        content,
        wordCount,
        lastModified: project.detailedContent?.lastModified || new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error fetching content for project ${projectId}:`, error);
      return null; // Return null instead of throwing to gracefully handle missing content
    }
  }

  /**
   * Parse content into sections (matching RAG system format)
   * @param content - Raw content string
   * @returns Object with parsed sections (same as RAG system)
   */
  private parseContentSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // Split content by headers (# or ##) - same logic as RAG system
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = line.replace(/^#+\s*/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
  }

  /**
   * Fetch project details with automatically loaded detailed content
   */
  async fetchProjectDetails(projectId: string): Promise<any> {
    try {
      // Get basic project data
      const projectsData: any = await this.fetchProjects();
      const projects = projectsData?.projects || projectsData?.allProjects || projectsData;
      
      if (!Array.isArray(projects)) {
        throw new Error("Invalid projects data structure");
      }
      
      // Find the specific project
      const project = projects.find((p: any) => p.id === projectId);
      if (!project) {
        throw new Error(`Project with id '${projectId}' not found. Available IDs: ${projects.map((p: any) => p.id).join(', ')}`);
      }
      
      // Load detailed content if available
      const contentData = await this.fetchProjectContent(projectId);
      
      // Determine content tier based on project featured status and content availability
      let contentTier: 'tier1' | 'tier2' | 'tier3' = 'tier3';
      if (project.featured && contentData) {
        contentTier = 'tier1';
      } else if (contentData) {
        contentTier = 'tier2';
      }
      
      // Parse content sections using same logic as RAG system
      let parsedSections: Record<string, string> = {};
      if (contentData?.content) {
        parsedSections = this.parseContentSections(contentData.content);
      }
      
      // Enhanced project object with detailed content (RAG-aligned format)
      const enhancedProject = {
        ...project,
        detailedContent: contentData ? {
          // RAG-compatible section structure
          projectoverview: parsedSections.projectoverview || parsedSections.overview || '',
          technicalimplementation: parsedSections.technicalimplementation || parsedSections.technicaldetails || '',
          challengessolutions: parsedSections.challengessolutions || parsedSections.challenges || parsedSections.developmentchallenges || '',
          resultsimpact: parsedSections.resultsimpact || parsedSections.projectimpact || parsedSections.outcomes || '',
          futureEnhancements: parsedSections.futureEnhancements || parsedSections.futureimprovements || '',
          // Raw content and metadata
          rawContent: contentData.content || '',
          wordCount: contentData.wordCount || 0,
          lastModified: contentData.lastModified || new Date().toISOString(),
          allSections: parsedSections
        } : null,
        contentTier,
        hasDetailedContent: !!contentData,
        enhancedMetadata: {
          wordCount: contentData?.wordCount || 0,
          lastModified: contentData?.lastModified || new Date().toISOString(),
          contentTier,
          sectionsAvailable: Object.keys(parsedSections)
        }
      };
      
      return enhancedProject;
    } catch (error) {
      console.error(`Error fetching enhanced project details for ${projectId}:`, error);
      throw error;
    }
  }

  async fetchExperience() {
    try {
      const response = await fetch(`${this.baseUrl}/experience`, {
        headers: this.headers,
        // @ts-ignore - timeout is valid for node-fetch
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching experience:', error);
      throw new Error('Failed to fetch experience data from portfolio');
    }
  }

  async fetchEducation() {
    try {
      const response = await fetch(`${this.baseUrl}/education`, {
        headers: this.headers,
        // @ts-ignore - timeout is valid for node-fetch
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching education:', error);
      throw new Error('Failed to fetch education data from portfolio');
    }
  }

  /**
   * Get all available project IDs for tool parameter suggestions
   */
  async getAvailableProjectIds(): Promise<string[]> {
    try {
      const data: any = await this.fetchProjects();
      const projects = data?.projects || data;
      
      if (Array.isArray(projects)) {
        return projects.map((p: any) => p.id).filter(Boolean);
      }
      
      // Fallback to known project IDs
      return [
        "sb-omnicore-mcp-server", "personal-portfolio-website", "introspect-ai", "carbon-sense-powered-by-ibm-watsonx",
        "rage-chrome-extension-for-personalized-rag", "reflectra-ai-digital-journal", 
        "email-intent-analysis", "synchronous-traffic-signals", "market-prediction-using-lstms",
        "eye-tracking-and-gaze-tracking", "dc-insulation-monitoring-system", "port-config",
        "quotation-generator-application", "iot-based-self-driving-car-with-adas", "high-on-tech",
        "creva", "voice-assistant"
      ];
    } catch (error) {
      console.error('Error fetching project IDs:', error);
      // Return fallback project IDs
      return [
        "sb-omnicore-mcp-server", "personal-portfolio-website", "introspect-ai", "carbon-sense-powered-by-ibm-watsonx",
        "rage-chrome-extension-for-personalized-rag", "reflectra-ai-digital-journal", 
        "email-intent-analysis", "synchronous-traffic-signals", "market-prediction-using-lstms",
        "eye-tracking-and-gaze-tracking", "dc-insulation-monitoring-system", "port-config",
        "quotation-generator-application", "iot-based-self-driving-car-with-adas", "high-on-tech",
        "creva", "voice-assistant"
      ];
    }
  }

  /**
   * Get all available domain categories for filtering
   */
  async getAvailableDomains(): Promise<string[]> {
    try {
      const data: any = await this.fetchProjects();
      const projects = data?.projects || data;
      
      if (Array.isArray(projects)) {
        const domains = new Set<string>();
        projects.forEach((p: any) => {
          if (p.domain && Array.isArray(p.domain)) {
            p.domain.forEach((d: string) => domains.add(d));
          }
        });
        return Array.from(domains);
      }
      
      // Fallback to known domains
      return [
        "GenAI", "AI & Machine Learning", "Computer Vision", 
        "Web & Cloud", "IoT & Embedded", "Data Analytics", "AR/VR & Immersive Tech"
      ];
    } catch (error) {
      console.error('Error fetching domains:', error);
      return [
        "GenAI", "AI & Machine Learning", "Computer Vision", 
        "Web & Cloud", "IoT & Embedded", "Data Analytics", "AR/VR & Immersive Tech"
      ];
    }
  }

  /**
   * Get all available technologies for filtering
   */
  async getAvailableTechnologies(): Promise<string[]> {
    try {
      const data: any = await this.fetchProjects();
      const projects = data?.projects || data;
      
      if (Array.isArray(projects)) {
        const technologies = new Set<string>();
        projects.forEach((p: any) => {
          if (p.tech && Array.isArray(p.tech)) {
            p.tech.forEach((t: string) => technologies.add(t));
          }
        });
        return Array.from(technologies).sort();
      }
      
      // Fallback to popular technologies
      return [
        "TypeScript", "Node.js", "MCP Protocol", "AWS Lambda", "API Integration", "RAG Systems",
        "Python", "React", "Next.js", "JavaScript", "OpenCV", "PyTorch", 
        "TensorFlow", "RAG", "FastAPI", "OpenAI", "HTML", "CSS", "AWS", "Unity 3D", "C#", 
        "C++", "Arduino", "Raspberry Pi", "Neo4j", "ChromaDB"
      ];
    } catch (error) {
      console.error('Error fetching technologies:', error);
      return [
        "TypeScript", "Node.js", "MCP Protocol", "AWS Lambda", "API Integration", "RAG Systems",
        "Python", "React", "Next.js", "JavaScript", "OpenCV", "PyTorch", 
        "TensorFlow", "RAG", "FastAPI", "OpenAI", "HTML", "CSS", "AWS", "Unity 3D", "C#", 
        "C++", "Arduino", "Raspberry Pi", "Neo4j", "ChromaDB"
      ];
    }
  }

  /**
   * Get comprehensive data discovery information
   */
  async getDataDiscovery(): Promise<{
    projectIds: string[];
    domains: string[];
    technologies: string[];
    totalProjects: number;
    featuredCount: number;
  }> {
    try {
      const [projectIds, domains, technologies] = await Promise.all([
        this.getAvailableProjectIds(),
        this.getAvailableDomains(),
        this.getAvailableTechnologies()
      ]);

      const data: any = await this.fetchProjects();
      const projects = data?.projects || data;
      const featuredCount = Array.isArray(projects) 
        ? projects.filter((p: any) => p.featured).length 
        : 6; // Known featured project count

      return {
        projectIds,
        domains,
        technologies,
        totalProjects: projectIds.length,
        featuredCount
      };
    } catch (error) {
      console.error('Error getting data discovery:', error);
      return {
        projectIds: ["sb-omnicore-mcp-server", "personal-portfolio-website", "introspect-ai"],
        domains: ["GenAI", "Web & Cloud"],
        technologies: ["TypeScript", "Node.js", "MCP Protocol", "Python", "React"],
        totalProjects: 17,
        featuredCount: 7
      };
    }
  }
} 