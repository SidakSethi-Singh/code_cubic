# 01_PRODUCT_REQUIREMENTS

## S2 Sync & Policy Triage Specification

### 1. Test Scenario: 9 Local Memories
When a field technician submits memories or during batch synchronization, the policy engine must evaluate each memory against hard rules and soft factors:
1. **5 Shareable Items**: High-quality operational procedures, verified fixes, incident reports with claims and authority >= 1. Evaluated as `share`. Enqueued in outbox, pushed in priority order.
2. **2 Sensitive Items**: Contain PII (phone number, technician credentials, API keys) or internal secret tokens. Evaluated as `local_only` (0 bytes outbound egress, strictly blocked by outbound serializer).
3. **1 Near-Duplicate Item**: Matches content hash or semantic fingerprint of an already synced item. Evaluated as `local_only` (or `hold`), preserving edge bandwidth.
4. **1 Vague Item**: Low information content (<30 characters, no technical claims, vague remarks like "pump sounds funny"). Evaluated as `hold` with clear reason for technician review.

### 2. Bandwidth Preservation Metrics
- `bytes_sent`: Actual payload size of transmitted records.
- `bytes_baseline`: Total size if all 9 records and unpruned attachments were broadcast naively.
- `saved_pct`: Measured bandwidth preservation:
  $$\text{saved\_pct} = \frac{\text{bytes\_baseline} - \text{bytes\_sent}}{\text{bytes\_baseline}} \times 100\%$$
- Typical baseline target: >= 80% bandwidth saved.
