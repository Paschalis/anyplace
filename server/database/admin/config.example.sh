#!/bin/bash
cwd="$(dirname "$0")"

MAX_BACKUPS=3
BACKUP_DIR="/full/path/to/mongo/backups"

MDB_HOST=localhost
MDB_PORT=27017
MDB_USER=ADMIN
MDB_PASS=PASS
MDB_DATABASE=anyplace

# YOU MAY USE DIFFERENT RESTORE HOST (OR DATABASE)
RESTORE_MDB_HOST=localhost
RESTORE_MDB_PORT=27017
RESTORE_MDB_USER=admin
RESTORE_MDB_PASS=ADMIN
RESTORE_MDB_DATABASE=anyplaceRestored