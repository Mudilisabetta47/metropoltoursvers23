# Project architecture rules

- Special trips (e.g. Paris New Year) are managed as package tours in the admin backend and rendered by the shared tour detail template; no hardcoded special pages or route overrides.
- Store special-trip dates once in the content module and test their exact values so year-boundary dates stay consistent across display and inquiries.