CREATE TABLE IF NOT EXISTS users (
    id            SERIAL       PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS tokens (
    id          SERIAL       PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id),
    user_email  VARCHAR(255) NOT NULL,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  VARCHAR(50)  NOT NULL,
    created_at  VARCHAR(50)  NOT NULL
);
