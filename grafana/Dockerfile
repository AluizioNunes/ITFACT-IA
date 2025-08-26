FROM grafana/grafana-enterprise:12.1.1-ubuntu

# Copiar arquivos de provisionamento
COPY provisioning /etc/grafana/provisioning

# Comando padrão
ENTRYPOINT [ "/run.sh" ]