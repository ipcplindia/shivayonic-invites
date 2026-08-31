# ADR-001: Modular monolith

Status: accepted

Keep the initial platform in one Next.js application with explicit domain, database, configuration, and integration boundaries. Add a worker when media and publication workloads need durable asynchronous execution. This keeps deployment and local development proportional to Task 01 while preserving a clean extraction seam.
