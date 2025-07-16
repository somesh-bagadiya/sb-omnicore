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
      'User-Agent': 'Portfolio-MCP-Server/1.0.0'
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
} 