-- pgcrypto needed before Flyway runs V1 (crypt/gen_salt used to seed the first user)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
