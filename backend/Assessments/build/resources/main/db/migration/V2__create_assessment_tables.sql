CREATE TABLE IF NOT EXISTS assessment_templates (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_groups (
    id          SERIAL       PRIMARY KEY,
    template_id INTEGER      NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    position    INTEGER      NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    id       SERIAL       PRIMARY KEY,
    group_id INTEGER      NOT NULL REFERENCES skill_groups(id) ON DELETE CASCADE,
    name     VARCHAR(255) NOT NULL,
    position INTEGER      NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_subgroups (
    id       SERIAL       PRIMARY KEY,
    skill_id INTEGER      NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    name     VARCHAR(255),
    position INTEGER      NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_items (
    id             SERIAL      PRIMARY KEY,
    subgroup_id    INTEGER     NOT NULL REFERENCES knowledge_subgroups(id) ON DELETE CASCADE,
    knowledge      TEXT        NOT NULL,
    description    TEXT,
    grade_level    VARCHAR(20),
    score_points   INTEGER,
    mandatory      BOOLEAN     NOT NULL DEFAULT TRUE,
    knowledge_type VARCHAR(30) NOT NULL,
    position       INTEGER     NOT NULL
);
