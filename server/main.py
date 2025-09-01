"""Entry point for the MealLog API server."""

import uvicorn

from src.config import settings


def main():
    """Run the MealLog API server."""
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
