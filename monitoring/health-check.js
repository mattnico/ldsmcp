#!/usr/bin/env node

/**
 * Health check script for LDS MCP Server
 * Can be used by load balancers and monitoring systems
 */

import { gospelLibraryClient } from '../build/api/client.js';

const HEALTH_CHECK_URI = '/general-conference/2025/04/13holland';
const TIMEOUT_MS = 10000;

async function healthCheck() {
  const start = Date.now();
  
  try {
    console.log('🏥 Running health check...');
    
    // Test basic content fetch
    const response = await Promise.race([
      gospelLibraryClient.fetchContent(HEALTH_CHECK_URI),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), TIMEOUT_MS)
      )
    ]);
    
    const duration = Date.now() - start;
    
    if (response.error) {
      throw new Error(`API Error: ${response.error.message}`);
    }
    
    if (!response.content?.body || response.content.body.length < 1000) {
      throw new Error('Invalid response content');
    }
    
    console.log(`✅ Health check passed in ${duration}ms`);
    console.log(`📊 Response size: ${response.content.body.length} chars`);
    
    // Output metrics in Prometheus format
    console.log('# HELP ldsmcp_health_check_duration_ms Duration of health check in milliseconds');
    console.log('# TYPE ldsmcp_health_check_duration_ms gauge');
    console.log(`ldsmcp_health_check_duration_ms ${duration}`);
    
    console.log('# HELP ldsmcp_health_check_success Health check success indicator');
    console.log('# TYPE ldsmcp_health_check_success gauge');
    console.log('ldsmcp_health_check_success 1');
    
    process.exit(0);
    
  } catch (error) {
    const duration = Date.now() - start;
    
    console.error(`❌ Health check failed in ${duration}ms: ${error.message}`);
    
    // Output failure metrics
    console.log('# HELP ldsmcp_health_check_duration_ms Duration of health check in milliseconds');
    console.log('# TYPE ldsmcp_health_check_duration_ms gauge');
    console.log(`ldsmcp_health_check_duration_ms ${duration}`);
    
    console.log('# HELP ldsmcp_health_check_success Health check success indicator');
    console.log('# TYPE ldsmcp_health_check_success gauge');
    console.log('ldsmcp_health_check_success 0');
    
    process.exit(1);
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  healthCheck();
}

export default healthCheck;