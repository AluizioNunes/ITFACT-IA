# PostgreSQL 17.6 - Debian Linux
FROM postgres:17.6

# Metadados do container
LABEL maintainer="CMM-AM DevOps Team <ti@cmm.am.gov.br>"
LABEL description="PostgreSQL 17.6 Database Server (Debian) for CMM Automação Platform"
LABEL version="17.6"
LABEL project="CMM-AUTOMACAO"

# Definir timezone
ENV TZ=America/Manaus

# Instalar pacotes base e configurar timezone/locale
RUN apt-get update && apt-get install -y \
    curl \
    tzdata \
    locales \
    vim \
    htop \
    gnupg \
    ca-certificates \
    && echo "America/Manaus" > /etc/timezone \
    && ln -snf /usr/share/zoneinfo/America/Manaus /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && sed -i '/^#.* pt_BR.UTF-8 /s/^#//' /etc/locale.gen \
    && locale-gen pt_BR.UTF-8 \
    && update-locale LANG=pt_BR.UTF-8

# Instalar pg_wait_sampling via repositório oficial PGDG (evita git/make)
RUN mkdir -p /usr/share/keyrings \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt $(. /etc/os-release; echo $VERSION_CODENAME)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y postgresql-17-pg-wait-sampling \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de scripts de inicialização
RUN mkdir -p /docker-entrypoint-initdb.d

# Script de inicialização customizado
COPY init-database.sql /docker-entrypoint-initdb.d/
COPY add-missing-databases.sql /docker-entrypoint-initdb.d/
COPY discovery-schema.sql /docker-entrypoint-initdb.d/
COPY verify-databases.sh /usr/local/bin/

# Configurações customizadas do PostgreSQL
COPY postgresql.conf /tmp/postgresql.conf
COPY pg_hba.conf /tmp/pg_hba.conf

# Definir configurações de performance
ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8"

# Configurar usuário e permissões
RUN chmod 755 /docker-entrypoint-initdb.d/init-database.sql
RUN chmod +x /usr/local/bin/verify-databases.sh

# Health check customizado
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD pg_isready -U admin -d AUTOMACAO || exit 1

# Expor porta padrão
EXPOSE 5432

# Volume para dados persistentes
VOLUME ["/var/lib/postgresql/data"]

# Usar entrypoint oficial do PostgreSQL com configurações customizadas
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["postgres", "-c", "config_file=/tmp/postgresql.conf", "-c", "hba_file=/tmp/pg_hba.conf"]