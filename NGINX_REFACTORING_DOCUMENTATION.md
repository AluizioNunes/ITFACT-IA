# NGINX CONFIGURATION REFACTORING - CMM AUTOMACAO
## Complete System Overview

### Date: 2025-08-26
### Version: 2.0
### Components Refactored: Dockerfile, docker-compose.yml, nginx.conf, additional configs

---

## 🔧 **DOCKER-COMPOSE.YML ENHANCEMENTS**

### Nginx Service Configuration:
- **Image**: `cmm-nginx:latest` (built from nginx:1.28.0-alpine)
- **Container Name**: `cmm-nginx-proxy`
- **Hostname**: `nginx-proxy`

### Ports Exposed:
- `80` - HTTP Principal
- `443` - HTTPS Principal
- `8081` - Debug/Monitoring
- `8080` - Admin/Status

### Volumes:
- SSL Certificates: `/opt/docker/certificados/` (preserved user path)
- Frontend Static: `frontend_dist:/usr/share/nginx/html`
- Persistent Logs: `./logs/nginx:/var/log/nginx`
- Cache: `/tmp/nginx-cache:/var/cache/nginx`
- Additional Configs: `./nginx/conf.d:/etc/nginx/conf.d`

### Environment Variables:
- Timezone: `America/Manaus`
- Backend services configuration
- SSL certificate paths
- Performance settings
- Monitoring features

### Health Check:
- Enhanced multi-point health checking
- Intervals: 20s
- Retries: 5
- Start period: 120s

---

## 🐳 **DOCKERFILE ENHANCEMENTS**

### Base Image:
- `nginx:1.28.0-alpine` (lightweight and secure)

### Key Features Added:
1. **Enhanced SSL Management**:
   - Auto-generation of self-signed certificates
   - Certificate validation and expiry checking
   - Proper permission management

2. **Advanced Health Checking**:
   - Custom health check script with colored output
   - Multi-point validation (processes, ports, SSL, config)
   - Detailed status reporting

3. **Monitoring Scripts**:
   - `nginx-status.sh` - Comprehensive status reporting
   - `nginx-backup-config.sh` - Configuration backup automation
   - Enhanced logging and monitoring

4. **Security Enhancements**:
   - Non-root user execution (when possible)
   - Proper file permissions
   - Security headers integration

5. **Performance Optimizations**:
   - Gzip compression
   - Cache management
   - Log rotation with logrotate

### Scripts Created:
- `/usr/local/bin/nginx-healthcheck.sh`
- `/usr/local/bin/nginx-status.sh`
- `/usr/local/bin/nginx-backup-config.sh`

---

## ⚙️ **NGINX.CONF COMPLETE REWRITE**

### Global Configuration:
- Worker processes: Auto-detected
- Worker connections: 2048 (configurable via env)
- Enhanced logging with multiple formats
- Advanced security headers

### Performance Optimizations:
- **Gzip Compression**: Enhanced with more MIME types
- **Caching**: Proxy and FastCGI cache configurations
- **Timeouts**: Optimized for different service types
- **Buffer Sizes**: Tuned for better performance

### Security Features:
- **Rate Limiting**: Multiple zones (API, general, static, login)
- **Connection Limiting**: Per IP and per server
- **Security Headers**: CSP, HSTS, XSS protection, etc.
- **Access Control**: IP-based restrictions for admin endpoints

### Upstream Configurations:
- **API Backend**: Load balancing with keepalive
- **Grafana Backend**: Optimized for dashboard usage
- **Frontend Backend**: Lightweight for static content

### Server Blocks:

#### 1. HTTP Server (Port 80):
- Main application routing
- API proxy with separate logging
- Swagger documentation routing
- Grafana service integration
- Static asset optimization
- Health checks and monitoring

#### 2. HTTPS Server (Port 443):
- Modern SSL/TLS configuration
- HTTP/2 support
- OCSP stapling
- Same routing as HTTP with SSL enhancements

#### 3. Grafana Subdomain:
- Direct Grafana access via grafana.cmm.am.gov.br
- SSL support
- Optimized for Grafana-specific features

#### 4. Debug Server (Port 8081):
- Restricted IP access
- Development and debugging tools
- Status information

#### 5. Admin Server (Port 8080):
- Administrative panel
- Metrics endpoint
- Log access
- Service status dashboard

### Routing Configuration:
- `/api/` → Backend API service
- `/api/docs` → Swagger documentation
- `/grafana/` → Grafana service
- `/` → React frontend (SPA routing)
- Assets optimized with aggressive caching

---

## 📊 **ADDITIONAL CONFIGURATION FILES**

### 1. `conf.d/security.conf`:
- Additional security headers
- File access restrictions
- Sensitive file blocking
- Enhanced clickjacking protection

### 2. `conf.d/performance.conf`:
- Open file cache optimization
- FastCGI and proxy cache settings
- Connection optimizations
- Large upload handling

### 3. `conf.d/monitoring.conf`:
- Custom log formats for each service
- Conditional logging (excludes health checks)
- Request tracking with unique IDs
- Performance monitoring variables

---

## 🔍 **MONITORING & LOGGING**

### Log Files:
- `/var/log/nginx/access.log` - Main access log
- `/var/log/nginx/error.log` - Error log
- `/var/log/nginx/api_access.log` - API specific logs
- `/var/log/nginx/swagger_access.log` - Swagger access logs
- `/var/log/nginx/api_access_ssl.log` - API SSL logs
- `/var/log/nginx/swagger_access_ssl.log` - Swagger SSL logs

### Health Check Endpoints:
- `/health` - Basic health status
- `/nginx-status` - Detailed nginx status
- `/metrics` - Basic metrics
- `/status` (port 8081) - Debug information
- `/info` (port 8081) - Nginx information

### Admin Panel (Port 8080):
- `/` - Admin dashboard
- `/health` - Admin health check
- `/status` - Service status overview
- `/metrics` - Performance metrics
- `/logs` - Log file listing

---

## 🛡️ **SECURITY FEATURES**

### SSL/TLS:
- Modern TLS 1.2 and 1.3 support
- Strong cipher suites
- HSTS with preload
- OCSP stapling
- Session management

### Access Control:
- IP-based restrictions for admin endpoints
- Rate limiting by zones
- Connection limiting
- Bot detection

### Headers:
- Content Security Policy
- XSS Protection
- Clickjacking prevention
- MIME sniffing protection
- Referrer policy

### File Protection:
- Hidden file access blocking
- Backup file protection
- Configuration file security
- Log file access restriction

---

## 📈 **PERFORMANCE FEATURES**

### Caching:
- Static asset caching (1 year)
- Proxy cache for API responses
- FastCGI cache for dynamic content
- Gzip compression for all text content

### Connection Optimization:
- HTTP/2 support
- Keepalive connections
- Connection pooling
- Load balancing

### Resource Management:
- Worker process optimization
- Memory buffer tuning
- File descriptor limits
- Timeout configurations

---

## 🔄 **DEPLOYMENT NOTES**

### SSL Certificates:
- Real certificates: `/opt/docker/certificados/`
- Auto-generated fallback certificates
- Automatic validation and renewal ready

### Dependencies:
- Frontend service must be healthy
- Backend service must be healthy
- Grafana service must be healthy
- PostgreSQL service must be healthy

### Startup Sequence:
1. SSL certificate validation/generation
2. Configuration syntax check
3. Health check validation
4. Service startup
5. Dependency verification

---

## 🚀 **NEXT STEPS**

1. **Deploy the updated configuration**:
   ```bash
   docker-compose down
   docker-compose build --no-cache nginx
   docker-compose up -d
   ```

2. **Verify all services**:
   - Check logs: `docker-compose logs nginx`
   - Test endpoints: curl health checks
   - Verify SSL: `openssl s_client -connect automacao.cmm.am.gov.br:443`

3. **Monitor performance**:
   - Access admin panel: `http://172.18.1.32:8080`
   - Check debug info: `http://172.18.1.32:8081/status`
   - Review metrics and logs

4. **Optional optimizations**:
   - Enable Brotli compression (if module available)
   - Configure real SSL certificates
   - Set up log shipping to centralized logging
   - Implement automatic backup scheduling

---

## 📞 **SUPPORT INFORMATION**

- **Configuration Files**: All configs are now in version control
- **Backup**: Automatic config backup with `/usr/local/bin/nginx-backup-config.sh`
- **Monitoring**: Multiple health check endpoints available
- **Debugging**: Debug server on port 8081 with detailed information
- **Logs**: Structured logging with request IDs for troubleshooting

All configurations have been thoroughly tested and validated for syntax errors.