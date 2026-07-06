CREATE TABLE IF NOT EXISTS assessments (
    id                 SERIAL       PRIMARY KEY,
    template_id        INTEGER      REFERENCES assessment_templates(id) ON DELETE SET NULL,
    template_name      VARCHAR(255) NOT NULL,
    assessee_id        INTEGER      NOT NULL REFERENCES users(id),
    assigned_by_id     INTEGER      NOT NULL REFERENCES users(id),
    status             VARCHAR(30)  NOT NULL DEFAULT 'assigned',
    snapshot           TEXT         NOT NULL,
    final_comment      TEXT,
    lock_user_id       INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    lock_expires_at    VARCHAR(50),
    created_at         VARCHAR(50)  NOT NULL,
    started_at         VARCHAR(50),
    submitted_at       VARCHAR(50),
    review_started_at  VARCHAR(50),
    completed_at       VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS assessment_reviewers (
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    PRIMARY KEY (assessment_id, user_id)
);

CREATE TABLE IF NOT EXISTS assessment_answers (
    id             SERIAL   PRIMARY KEY,
    assessment_id  INTEGER  NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    item_id        INTEGER  NOT NULL,
    checked        BOOLEAN  NOT NULL DEFAULT FALSE,
    updated_by_id  INTEGER  REFERENCES users(id) ON DELETE SET NULL,
    updated_at     VARCHAR(50) NOT NULL,
    UNIQUE (assessment_id, item_id)
);

CREATE TABLE IF NOT EXISTS assessment_comments (
    id             SERIAL   PRIMARY KEY,
    assessment_id  INTEGER  NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    item_id        INTEGER  NOT NULL,
    text           TEXT     NOT NULL,
    author_id      INTEGER  NOT NULL REFERENCES users(id),
    created_at     VARCHAR(50) NOT NULL,
    updated_at     VARCHAR(50) NOT NULL,
    UNIQUE (assessment_id, item_id)
);
