FROM postgres:14-bullseye AS builder

RUN apt-get update \
 && apt-get install -y postgresql-14-partman \
    postgresql-server-dev-14 \
    build-essential \
    autoconf \
    libzstd-dev \
    libz-dev \
    liblz4-dev \
    libcurl4-openssl-dev \
    git

RUN git clone https://github.com/hydradatabase/hydra && \
    cd hydra/columnar && \
    ./configure && \
    make && \
    make install

FROM postgres:14-bullseye

COPY --from=builder /usr/lib/postgresql/14/lib/* /usr/lib/postgresql/14/lib/
COPY --from=builder /usr/share/postgresql/14/extension/* /usr/share/postgresql/14/extension/
COPY ./initdb.d /docker-entrypoint-initdb.d

