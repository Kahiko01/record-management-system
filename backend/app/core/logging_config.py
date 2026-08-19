"""
Centralized logging configuration using Loguru.
Provides structured JSON logging + file rotation.
"""
import sys
import json
from loguru import logger
from pathlib import Path

# Remove default loguru handler
logger.remove()

# Define log directory
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Custom JSON formatter for structured logging
def json_sink(message):
    record = message.record
    log_entry = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "module": record["module"],
        "function": record["function"],
        "line": record["line"],
        # Include request_id from extra if available
        "request_id": record["extra"].get("request_id", None),
        # Include any custom fields passed via .bind()
        **{k: v for k, v in record["extra"].items() if k != "request_id"}
    }
    print(json.dumps(log_entry), file=sys.stderr)


def setup_logging(environment: str = "development"):
    """Configure logging based on environment"""
    
    # Console output - human-friendly in dev, JSON in production
    if environment == "development":
        logger.add(
            sys.stderr,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                   "<level>{message}</level>",
            level="DEBUG",
            colorize=True
        )
    else:
        # Production: structured JSON for log aggregation (ELK, Loki, etc.)
        logger.add(json_sink, level="INFO")
    
    # File logging with rotation (10MB per file, keep 10 files)
    logger.add(
        LOG_DIR / "app.log",
        rotation="10 MB",
        retention=10,
        compression="gz",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        enqueue=True  # Thread-safe
    )
    
    # Separate error log for quick triage
    logger.add(
        LOG_DIR / "errors.log",
        rotation="10 MB",
        retention=30,
        compression="gz",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        enqueue=True
    )
    
    # Audit-specific log (separate from app logs, as per the security audit)
    logger.add(
        LOG_DIR / "audit_events.log",
        rotation="50 MB",
        retention=90,  # Keep audit logs for 3 months
        compression="gz",
        level="INFO",
        filter=lambda record: "audit" in record["extra"].get("tags", []),
        enqueue=True
    )
    
    logger.info(f"Logging configured for {environment} environment")


# Create a bound logger for audit events
audit_logger = logger.bind(tags=["audit"])

# Create a bound logger for security events
security_logger = logger.bind(tags=["security"])
