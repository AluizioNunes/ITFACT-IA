FROM prom/prometheus:latest

# Copiar arquivo de configuração
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Comando padrão
ENTRYPOINT ["/bin/prometheus"]

# Argumentos de linha de comando
CMD [ \
  "--config.file=/etc/prometheus/prometheus.yml", \
  "--storage.tsdb.path=/prometheus", \
  "--web.console.libraries=/usr/share/prometheus/console_libraries", \
  "--web.console.templates=/etc/prometheus/consoles", \
  "--storage.tsdb.retention.time=200h", \
  "--web.enable-lifecycle", \
  "--web.enable-admin-api", \
  "--web.external-url=/", \
  "--web.listen-address=:9090" \
]