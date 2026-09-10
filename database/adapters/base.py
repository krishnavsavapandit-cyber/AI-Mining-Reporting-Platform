"""
Base Database Adapter and Interface Definition for SIH26023 Mining Platform.
"""

from abc import ABC, abstractmethod
from typing import Any, List, Optional, Tuple, Dict, Union

class BaseDatabaseAdapter(ABC):
    """Abstract Base Class for database engine adapters."""

    @abstractmethod
    def get_connection(self) -> Any:
        """Return a live database connection instance."""
        pass

    @abstractmethod
    def initialize_schema(self) -> None:
        """Create tables, relationships, and indices."""
        pass

    @abstractmethod
    def check_connection(self) -> bool:
        """Verify connectivity by executing a lightweight probe query."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Close connection or pool resources."""
        pass

    @property
    @abstractmethod
    def backend_name(self) -> str:
        """Return 'postgresql' or 'sqlite'."""
        pass
