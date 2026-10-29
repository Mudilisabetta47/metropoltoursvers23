# Project architecture rules

- Special trips (e.g. Paris New Year) are managed as package tours in the admin backend and rendered by the shared tour detail template; no hardcoded special pages or route overrides.
- Seasonal tour collection pages select published active package tours and future active dates, then link to the shared detail template; never duplicate individual tour content or booking flows.
- Tour card inclusion indicators derive from stored included services; never assume hotel or breakfast from the tour category.
- Tour cancellations require an explicit refund selection, account for separately stored provider discounts and previous refunds, and validate against the provider's collected/remaining amount; accepted refunds are recorded server-side only so payouts and payment entries stay aligned.
- Bus checkout consumes stored payment IDs only on an explicit payment return, so ordinary visits cannot reopen a previous booking.
- Admin travel-media downloads inventory stored image references from both travel tables and bundled assets without inventing fallback images; prepare validated blobs before offering downloads so mobile user activation is preserved.
