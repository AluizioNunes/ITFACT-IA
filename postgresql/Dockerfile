# PostgreSQL 17.6 - Debian Linux
FROM postgres:17.6

# Metadados do container
LABEL maintainer="CMM-AM DevOps Team <ti@cmm.am.gov.br>"
LABEL description="PostgreSQL 17.6 Database Server (Debian) for CMM Automação Platform"
LABEL version="17.6"
LABEL project="CMM-AUTOMACAO"

# Definir timezone
ENV TZ=America/Manaus

# Instalar pacotes adicionais para monitoramento e utilitários
RUN apt-get update && apt-get install -y \
    curl \
    tzdata \
    locales \
    vim \
    htop \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && echo "America/Manaus" > /etc/timezone \
    && ln -snf /usr/share/zoneinfo/America/Manaus /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && locale-gen pt_BR.UTF-8

# Criar diretório de scripts de inicialização
RUN mkdir -p /docker-entrypoint-initdb.d

# Script de inicialização customizado
COPY init-database.sql /docker-entrypoint-initdb.d/

# Configurações customizadas do PostgreSQL
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# Definir configurações de performance
ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8 --locale=pt_BR.UTF-8"

# Configurar usuário e permissões
RUN chmod 755 /docker-entrypoint-initdb.d/init-database.sql

# Health check customizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD pg_isready -U ${POSTGRES_USER:-admin} -d ${POSTGRES_DB:-automacao_db} || exit 1

# Expor porta padrão
EXPOSE 5432

# Volume para dados persistentes
VOLUME ["/var/lib/postgresql/data"]

# Usar entrypoint oficial do PostgreSQL
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]