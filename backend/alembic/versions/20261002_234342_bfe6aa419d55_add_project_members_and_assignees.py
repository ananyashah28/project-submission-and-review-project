"""add_project_members_and_assignees

Revision ID: bfe6aa419d55
Revises: 52ae7bebfcfd
Create Date: 2026-10-02 23:43:42.090532

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bfe6aa419d55'
down_revision: Union[str, None] = '52ae7bebfcfd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create project_members table if not exists
    op.execute("""
    CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS ix_project_members_id ON project_members(id);
    CREATE INDEX IF NOT EXISTS ix_project_members_project_id ON project_members(project_id);
    CREATE INDEX IF NOT EXISTS ix_project_members_user_id ON project_members(user_id);
    """)

    # 2. Add assignee_id to tasks if not exists
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignee_id') THEN
            ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS ix_tasks_assignee_id ON tasks(assignee_id);
        END IF;
    END $$;
    """)

    # 3. Add assigned_to and assignee_id to bugs if not exists
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bugs' AND column_name='assigned_to') THEN
            ALTER TABLE bugs ADD COLUMN assigned_to VARCHAR(150);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bugs' AND column_name='assignee_id') THEN
            ALTER TABLE bugs ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS ix_bugs_assignee_id ON bugs(assignee_id);
        END IF;
    END $$;
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS project_members CASCADE;")
    op.execute("ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;")
    op.execute("ALTER TABLE bugs DROP COLUMN IF EXISTS assigned_to;")
    op.execute("ALTER TABLE bugs DROP COLUMN IF EXISTS assignee_id;")

