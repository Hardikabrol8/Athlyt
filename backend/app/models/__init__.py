"""SQLAlchemy ORM models.

Importing this package imports every model module below, which is what
registers each table on `Base.metadata` — required for `Base.metadata.create_all()`
in `app/main.py` to know about them. `main.py` imports this package for exactly
that side effect.
"""

from app.models.profile import Profile
from app.models.user import User

__all__ = ["Profile", "User"]
