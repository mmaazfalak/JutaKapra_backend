# Juta Kapra Website Repository Database

This directory houses the persistent repository-backed website database subsystem.

## Architecture

- `users.json`: Persistent user accounts, delivery address books (`addresses`), profiles, and authentication credentials.
- `orders.json`: Customer orders, status tracking, payment methods, courier details, and line items.
- `products.json`: Product catalog, pricing, inventory stock levels, and drop schedule.

## Data Lifecycle

1. **Instant Write-Through Persistence**:
   - Whenever any user registers, edits profile details, adds/updates/deletes a delivery address, or places an order, the updates are pushed directly to `server/data/*.json` and MongoDB API on the spot.
2. **Server-Side Authoritative Retrieval**:
   - When a customer visits the website, account overview, checkout, or drops, data is pulled directly from the website database.
   - Zero reliance on ephemeral client-side only caches.
