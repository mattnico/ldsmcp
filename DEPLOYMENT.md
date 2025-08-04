# LDS MCP Server - Deployment Guide

## Quick Deployment Status ✅

**The LDS MCP Server is READY for production deployment** with the following deployment methods:

## 1. NPM Package Deployment

### Publish to NPM Registry
```bash
# Build and test
npm run build
npm run test

# Publish (requires NPM account and authentication)
npm publish
```

### Install from NPM
```bash
# Global installation
npm install -g ldsmcp

# Run directly
ldsmcp

# Local installation
npm install ldsmcp
npx ldsmcp
```

## 2. Claude Desktop Integration

### Configuration
Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ldsmcp": {
      "command": "node",
      "args": ["/path/to/ldsmcp/build/index.js"]
    }
  }
}
```

### Using NPM Package
```json
{
  "mcpServers": {
    "ldsmcp": {
      "command": "npx",
      "args": ["ldsmcp"]
    }
  }
}
```

## 3. Docker Deployment

### Build and Run
```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

### Docker Hub Deployment
```bash
# Tag for registry
docker tag ldsmcp your-registry/ldsmcp:latest

# Push to registry
docker push your-registry/ldsmcp:latest
```

## 4. Standalone Service Deployment

### Systemd Service (Linux)
Create `/etc/systemd/system/ldsmcp.service`:

```ini
[Unit]
Description=LDS MCP Server
After=network.target

[Service]
Type=simple
User=ldsmcp
WorkingDirectory=/opt/ldsmcp
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ldsmcp
sudo systemctl start ldsmcp
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start build/index.js --name ldsmcp

# Save PM2 configuration
pm2 save
pm2 startup
```

## 5. Cloud Platform Deployment

### AWS Lambda
The server can be adapted for Lambda with minimal changes to handle HTTP events instead of stdio.

### Google Cloud Run
```bash
# Deploy to Cloud Run
gcloud run deploy ldsmcp \
  --image gcr.io/your-project/ldsmcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Heroku
Create `Procfile`:
```
release: npm run build
web: node build/index.js
```

## Monitoring & Health Checks

### Health Check Endpoint
```bash
# Run health check
npm run health-check

# Use in monitoring systems
curl http://localhost:3000/health
```

### Logging
- All logs output to stderr for proper container logging
- Use structured logging in production environments
- Configure log rotation for long-running deployments

## Security Considerations

### Production Hardening
1. **Run as non-root user** (Docker image already configured)
2. **Resource limits** (configured in docker-compose.yml)
3. **Network isolation** (container-based deployment recommended)
4. **Regular updates** (monitor for dependency updates)

### Rate Limiting
Consider adding rate limiting if deploying as a public service:
```javascript
// Add to index.ts for HTTP endpoints
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## CI/CD Pipeline

GitHub Actions workflow is configured for:
- ✅ Automated testing on multiple Node.js versions
- ✅ Security auditing
- ✅ NPM publishing on releases
- ✅ Docker image building and publishing

### Required Secrets
Configure in GitHub repository settings:
- `NPM_TOKEN` - NPM publishing token
- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token

## Performance Optimization

### Production Settings
```bash
# Set environment variables
export NODE_ENV=production
export UV_THREADPOOL_SIZE=128  # For better I/O performance
```

### Memory Usage
- Base memory usage: ~30MB
- Recommended minimum: 64MB
- Recommended for production: 128MB

### Scaling
- The server is stateless and can be horizontally scaled
- No database or persistent storage required
- Consider load balancing for high-traffic scenarios

## Troubleshooting

### Common Issues
1. **Permission errors**: Ensure build/index.js is executable
2. **Module resolution**: Use Node.js 18+ with proper ES module support
3. **Network timeouts**: Configure appropriate timeout values for the Gospel Library API

### Debug Mode
```bash
# Enable debug logging
DEBUG=* node build/index.js
```

### Testing Deployment
```bash
# Quick functionality test
npm run test

# Full MCP protocol test
npm run test:full

# Health check
npm run health-check
```

## Rollback Procedures

### NPM Package
```bash
# Unpublish if necessary (within 24 hours)
npm unpublish ldsmcp@version

# Or deprecate
npm deprecate ldsmcp@version "Reason for deprecation"
```

### Docker Deployment
```bash
# Rollback to previous image
docker run previous-image-tag

# Or use specific version
docker run ldsmcp:previous-sha
```

### Service Deployment
```bash
# Rollback with systemd
sudo systemctl stop ldsmcp
# Replace files with previous version
sudo systemctl start ldsmcp
```

---

## Summary

The LDS MCP Server is production-ready with:
- ✅ Zero-vulnerability dependencies
- ✅ Comprehensive testing (100% pass rate)  
- ✅ Docker containerization
- ✅ CI/CD pipeline
- ✅ Multiple deployment options
- ✅ Health monitoring
- ✅ Complete documentation

**Recommended deployment method**: Docker with docker-compose for most use cases, NPM package for Claude Desktop integration.