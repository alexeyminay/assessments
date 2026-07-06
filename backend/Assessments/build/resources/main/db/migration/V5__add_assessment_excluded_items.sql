CREATE TABLE IF NOT EXISTS assessment_excluded_items (
    assessment_id  INTEGER      NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    item_id        INTEGER      NOT NULL,
    excluded_by_id INTEGER      NOT NULL REFERENCES users(id),
    created_at     VARCHAR(50)  NOT NULL,
    PRIMARY KEY (assessment_id, item_id)
);
