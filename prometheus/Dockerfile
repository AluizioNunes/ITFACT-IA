FROM prom/prometheus:v3.5.0

# Copiar arquivo de configuração
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Expor porta
EXPOSE 9090

# Usar o comando padrão do Prometheus com nossa configuração
CMD ["--config.file=/etc/prometheus/prometheus.yml", \
     "--storage.tsdb.path=/prometheus", \
     "--web.console.libraries=/usr/share/prometheus/console_libraries", \
     "--web.console.templates=/etc/prometheus/consoles", \
     "--storage.tsdb.retention.time=200h", \
     "--web.enable-lifecycle", \
     "--web.enable-admin-api", \
     "--web.listen-address=0.0.0.0:9090"]