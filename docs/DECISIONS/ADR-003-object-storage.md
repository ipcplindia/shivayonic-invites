# ADR-003: Object storage for media

Status: accepted

Store media bytes in an S3-compatible object store and store only metadata plus `storageKey` in PostgreSQL. This avoids database bloat and supports signed upload/download operations later.
