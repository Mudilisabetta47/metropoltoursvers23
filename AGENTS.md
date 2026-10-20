# Project architecture rules

- Special trips (e.g. Paris New Year) are managed as package tours in the admin backend and rendered by the shared tour detail template; no hardcoded special pages or route overrides.
- Tour cancellations require an explicit refund selection and a validated amount; accepted provider refunds are recorded server-side only to keep payouts and payment entries aligned.
- Bus checkout consumes stored payment IDs only on an explicit payment return, so ordinary visits cannot reopen a previous booking.
