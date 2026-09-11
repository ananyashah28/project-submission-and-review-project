"""Add submitted_at and reviewed_at columns to projects table

Revision ID: 20260910_002
Revises: ed506f416285
Create Date: 2026-09-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260910_002'
down_revision: Union[str, None] = 'ed506f416285'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add submitted_at column
    op.add_column('projects', sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True))
    # Add reviewed_at column
    op.add_column('projects', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
    # Add submission_comment column
    op.add_column('projects', sa.Column('submission_comment', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'submission_comment')
    op.drop_column('projects', 'reviewed_at')
    op.drop_column('projects', 'submitted_at')
