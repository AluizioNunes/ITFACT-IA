FROM grafana/grafana:latest

# Copiar arquivos de provisionamento
COPY grafana/provisioning /etc/grafana/provisioning

# Definir permissões corretas
RUN chmod -R 644 /etc/grafana/provisioning/

# Comando padrão
ENTRYPOINT [ "/run.sh" ]