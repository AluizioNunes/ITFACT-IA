# ===============================================
# CMM AUTOMACAO - Multi-Service Docker Project
# ===============================================
# 
# This is a multi-service project orchestrated via docker-compose.yml
# Individual services have their own Dockerfiles:
#   - ./nginx/Dockerfile    - Reverse proxy with SSL
#   - ./api/Dockerfile      - Node.js backend API  
#   - ./frontend/Dockerfile - React frontend
#
# To deploy this project, use:
#   docker-compose up -d --build
#
# This Dockerfile exists only for deployment systems that require
# a root Dockerfile but should not be used directly.
# ===============================================

FROM alpine:latest

# Install basic tools
RUN apk add --no-cache curl

# Create info file
RUN echo "CMM Automacao Multi-Service Project" > /info.txt
RUN echo "Use docker-compose.yml to deploy services" >> /info.txt
RUN echo "Services: nginx, backend, frontend" >> /info.txt

# Expose a port (not actually used)
EXPOSE 8000

# Default command that shows project info
CMD ["sh", "-c", "echo 'CMM Automacao Project - Use docker-compose.yml to deploy'; cat /info.txt; sleep infinity"]