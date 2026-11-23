# Contact Management & Opt-In Compliance

## Contact Attributes
Each contact record stores:
- **Phone Number**: Normalized to E.164 international format (e.g. `+919811122233`).
- **Name**: First Name and Last Name.
- **Email**: Optional customer email.
- **Tags**: Multiple categorization tags (e.g., `VIP`, `Lead`, `FestiveCustomer`).
- **Opt-In Status**: Active (1) or Opted Out (0).

## Opt-Out Compliance
If a contact sends `STOP`, `UNSUBSCRIBE`, or `CANCEL`, our webhook listener marks `is_opted_in = 0`. The customer is automatically excluded from all future marketing broadcasts to protect your Meta phone rating.
