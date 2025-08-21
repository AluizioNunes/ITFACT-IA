FROM prom/prometheus:latest

# Copiar arquivo de configuração
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Comando padrão
ENTRYPOINT [ "/bin/prometheus" ]
CMD [ "--config.file=/etc/prometheus/prometheus.yml", \
      "--storage.tsdb.path=/prometheus", \
      "--web.console.libraries=/etc/prometheus/console_libraries", \
      "--web.console.templates=/etc/prometheus/consoles", \
      "--storage.tsdb.retention.time=200h", \
      "--web.enable-lifecycle", \
      "--web.external-url=/prometheus", \
      "--web.route-prefix=/" ]