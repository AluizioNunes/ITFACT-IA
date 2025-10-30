FROM n8nio/n8n:latest

# Switch to root to copy script into /usr/local/bin
USER root

# Copy custom entrypoint that imports default workflow and then starts n8n
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Return to non-root runtime user
USER node

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint.sh"]