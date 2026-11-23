# WhatsApp Business Platform & Cloud API

## Overview
Our platform operates on the official **Meta WhatsApp Cloud API (Graph API v21.0)** hosted by Meta. Unlike unofficial WhatsApp Web scrapers or browser extensions, the official Cloud API guarantees 99.9% message uptime, official blue checkmark eligibility, multi-agent concurrency, and zero ban risk when Meta messaging guidelines are respected.

## Core Concepts
- **WABA (WhatsApp Business Account)**: The Meta container that holds phone numbers, message templates, analytics, and payment methods for a business.
- **Phone Number ID**: The unique 15-to-16 digit identifier representing the specific phone number used to send and receive WhatsApp messages.
- **Meta System User Access Token**: An AES-256-GCM encrypted permanent token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions used to communicate securely with Meta Graph API endpoints.
- **Meta 24-Hour Customer Care Window**: Free-form session messages can only be exchanged within 24 hours of the user's latest incoming message. Outside this 24-hour window, only pre-approved Message Templates can be dispatched.
