from __future__ import annotations

from collections.abc import Generator
from sqlite3 import Connection as SQLiteConnection

from sqlalchemy import DateTime, create_engine, event, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()


def create_database_engine(database_url: str) -> Engine:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    database_engine = create_engine(database_url, connect_args=connect_args, future=True)
    if database_url.startswith("sqlite"):
        event.listen(database_engine, "connect", configure_sqlite_connection)
    return database_engine


def configure_sqlite_connection(connection: SQLiteConnection, _: object) -> None:
    cursor = connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()


engine = create_database_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(target_engine: Engine = engine) -> None:
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=target_engine)
    _ensure_created_at_columns(target_engine)


def _ensure_created_at_columns(target_engine: Engine) -> None:
    with target_engine.begin() as connection:
        inspector = inspect(connection)
        compiler = target_engine.dialect.type_compiler
        datetime_type = compiler.process(DateTime(timezone=True))
        preparer = target_engine.dialect.identifier_preparer

        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            column_names = {column["name"] for column in inspector.get_columns(table.name)}
            if "created_at" in column_names:
                continue

            table_name = preparer.quote(table.name)
            column_name = preparer.quote("created_at")
            connection.exec_driver_sql(
                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {datetime_type}"
            )
            connection.exec_driver_sql(
                f"UPDATE {table_name} SET {column_name} = CURRENT_TIMESTAMP "
                f"WHERE {column_name} IS NULL"
            )
            if target_engine.dialect.name == "postgresql":
                connection.exec_driver_sql(
                    f"ALTER TABLE {table_name} ALTER COLUMN {column_name} SET NOT NULL"
                )

        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            for index in table.indexes:
                index.create(bind=connection, checkfirst=True)
