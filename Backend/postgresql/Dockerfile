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
    build-essential \
    git \
    make \
    postgresql-server-dev-all \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && echo "America/Manaus" > /etc/timezone \
    && ln -snf /usr/share/zoneinfo/America/Manaus /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && sed -i '/^#.* pt_BR.UTF-8 /s/^#//' /etc/locale.gen \
    && locale-gen pt_BR.UTF-8 \
    && update-locale LANG=pt_BR.UTF-8

# Compilar e instalar pg_wait_sampling
RUN git clone --depth 1 https://github.com/postgrespro/pg_wait_sampling.git /tmp/pg_wait_sampling \
    && cd /tmp/pg_wait_sampling \
    && make \
    && make install \
    && rm -rf /tmp/pg_wait_sampling

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