from __future__ import annotations

from sqlalchemy import create_engine, inspect, text

from app.database import migrate_mood_entry_sentiment_columns


def test_mood_sentiment_migration_preserves_existing_rows_and_is_idempotent():
    engine = create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE TABLE mood_entries "
                    "(id VARCHAR(36) PRIMARY KEY, note TEXT)"
                )
            )
            connection.execute(
                text(
                    "INSERT INTO mood_entries (id, note) "
                    "VALUES ('existing-entry', 'Existing private note')"
                )
            )

        migrate_mood_entry_sentiment_columns(engine)
        migrate_mood_entry_sentiment_columns(engine)

        columns = {
            column["name"]: column
            for column in inspect(engine).get_columns("mood_entries")
        }
        assert all(
            name in columns and columns[name]["nullable"]
            for name in (
                "sentiment_positive",
                "sentiment_negative",
                "sentiment_neutral",
                "sentiment_compound",
            )
        )
        with engine.connect() as connection:
            row = connection.execute(
                text("SELECT id, note FROM mood_entries WHERE id = 'existing-entry'")
            ).one()
        assert row == ("existing-entry", "Existing private note")
    finally:
        engine.dispose()
