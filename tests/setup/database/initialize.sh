#!/bin/bash

echo "Destroying test database"
PGPASSWORD=postgres dropdb --username=postgres --if-exists -h 127.0.0.1 -p 5432 footprints_test
echo "Creating new test database"
PGPASSWORD=postgres createdb --username=postgres -h 127.0.0.1 -p 5432 -T template1 footprints_test

NODE_ENV=test node ./tests/setup/database/migrate.mjs
