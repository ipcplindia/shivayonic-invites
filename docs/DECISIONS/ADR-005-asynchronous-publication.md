# ADR-005: Asynchronous publication

Status: accepted

Future transcoding and publication operations will use durable jobs and workers rather than holding HTTP requests open. The queue is intentionally deferred until the relevant milestone.
