#!/bin/bash

set -e

psql -U "$POSTGRES_USER" template1 -c "CREATE EXTENSION columnar;"
psql -U "$POSTGRES_USER" template1 -c "CREATE EXTENSION pg_partman;"
psql -U "$POSTGRES_USER" template1 -c "CREATE EXTENSION btree_gist;"
psql -U "$POSTGRES_USER" template1 -c "CREATE EXTENSION btree_gin;"
psql -U "$POSTGRES_USER" template1 -c "GRANT ALL ON TABLE custom_time_partitions TO migrator;"
psql -U "$POSTGRES_USER" template1 -c "GRANT ALL ON TABLE part_config TO migrator;"
psql -U "$POSTGRES_USER" template1 -c "GRANT ALL ON TABLE part_config_sub TO migrator;"
psql -U "$POSTGRES_USER" template1 -c "GRANT ALL ON TABLE table_privs TO migrator;"
psql -U "$POSTGRES_USER" template1 -c "GRANT ALL ON SCHEMA public TO migrator;"

createdb --username "$POSTGRES_USER" -T template1 footprints_test
createdb --username "$POSTGRES_USER" -T template1 footprints

pg_ctl -D $PGDATA restart
