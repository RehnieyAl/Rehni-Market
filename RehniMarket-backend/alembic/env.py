"""Entorno de Alembic: toma URL_DATABASE de Config y los modelos de app.models para las migraciones."""

from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.dbconexion import Base
from app.models import *
from app.Config import config as settings
config = context.config

config.set_main_option("sqlalchemy.url", settings.URL_DATABASE )

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Índices de expresión creados con SQL en su migración (a1b2c3d4e5f6, búsqueda difusa con
# pg_trgm): no existen en los modelos, así que autogenerate/`alembic check` propondría borrarlos.
EXPRESSION_INDEXES = {"ix_products_name_search_trgm"}


def include_object(_obj, name, type_, reflected, compare_to):
    return not (type_ == "index" and reflected and compare_to is None and name in EXPRESSION_INDEXES)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        include_object=include_object,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
