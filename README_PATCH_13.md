# Patch 13 - Mobile modal and layout fixes

This patch updates `app/styles.css` to:

- prevent the background screen from being scrolled around modal edges
- make mobile drawers fixed full-screen with safe-area padding
- keep the Review modal buttons away from the bottom edge
- hide the duplicate Review button in the settlement hero
- hide the balance mini-cards from the main screen so balances stay in the Review context
- swap Open/Locked badge semantics visually: locked is green, open is orange

No database migration is required.
