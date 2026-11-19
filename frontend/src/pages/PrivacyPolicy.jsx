import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import iconImg from '../assets/icon.png';
import '../styles/legal.css';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy — Aiveexa';

    const handleScroll = () => {
      const sections = document.querySelectorAll('.legal-section');
      const scrollPos = window.scrollY + 140;

      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          setActiveSection(sec.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'section-1', title: '1. Introduction & Overview' },
    { id: 'section-2', title: '2. Information We Collect' },
    { id: 'section-3', title: '3. How We Process Information' },
    { id: 'section-4', title: '4. Legal Bases for Processing' },
    { id: 'section-5', title: '5. Sharing & Third-Party Processors' },
    { id: 'section-6', title: '6. Multi-Tenant Data Security' },
    { id: 'section-7', title: '7. Meta OAuth & Embedded Signup' },
    { id: 'section-8', title: '8. Opt-In & Anti-Spam Compliance' },
    { id: 'section-9', title: '9. Data Retention & Storage' },
    { id: 'section-10', title: '10. Cookies & Tracking' },
    { id: 'section-11', title: '11. Your Privacy Rights (GDPR/CCPA)' },
    { id: 'section-12', title: '12. User Data Deletion (Meta App)' },
    { id: 'section-13', title: '13. Do-Not-Track Controls' },
    { id: 'section-14', title: '14. Policy on Minors' },
    { id: 'section-15', title: '15. Policy Updates & Notice' },
    { id: 'section-16', title: '16. Contact & Grievance Officer' },
  ];

  return (
    <div className="legal-page-wrapper">
      {/* Top Navigation */}
      <header className="legal-header">
        <div className="container d-flex align-items-center justify-content-between legal-header-inner">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <img
              src={iconImg}
              alt="Aiveexa"
              style={{ width: '38px', height: '38px', objectFit: 'contain' }}
            />
            <img
              src={logoImg}
              alt="Aiveexa"
              style={{ height: '34px', width: 'auto', maxWidth: '145px', objectFit: 'contain' }}
            />
          </Link>

          <div className="d-flex align-items-center gap-2 gap-md-3">
            <Link to="/terms" className="btn btn-sm btn-outline-secondary fw-medium">
              Terms of Service
            </Link>
            <Link to="/login" className="btn btn-sm btn-primary fw-medium px-3">
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="legal-hero">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <span className="legal-badge-meta">
              <i className="bi bi-shield-check fs-6"></i>
              Official Meta WhatsApp Business Cloud API Compliant
            </span>
            <span className="badge bg-light text-muted border px-3 py-2 rounded-pill small">
              GDPR • CCPA • DPDP Compliant
            </span>
          </div>

          <h1 className="legal-hero-title mb-3">Privacy Policy</h1>
          <p className="legal-hero-subtitle mb-3">
            This Privacy Policy explains how <strong>Aiveexa</strong> ("we", "us", or "our") collects, protects, processes, and respects personal data when you use our WhatsApp marketing and customer engagement SaaS platform.
          </p>

          <div className="d-flex align-items-center gap-3 text-muted small">
            <span><strong>Effective Date:</strong> November 1, 2026</span>
            <span>•</span>
            <span><strong>Last Updated:</strong> November 19, 2026</span>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="container py-5">
        <div className="row g-4">
          {/* Sticky Table of Contents (Left Column) */}
          <div className="col-lg-4 d-none d-lg-block">
            <div className="legal-toc-sticky">
              <div className="legal-toc-title">Table of Contents</div>
              <nav className="nav flex-column">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={`nav-link text-start border-0 bg-transparent legal-toc-link ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>

              <hr className="my-3" />

              <div className="p-3 bg-light rounded-3 border">
                <div className="fw-bold small text-dark mb-1">
                  <i className="bi bi-info-circle text-primary me-1"></i> Need Legal Assistance?
                </div>
                <div className="text-muted small">
                  Email our Data Protection Officer at{' '}
                  <a href="mailto:support@aiveexa.com" className="text-primary fw-medium text-decoration-none">
                    support@aiveexa.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Content Card (Right Column) */}
          <div className="col-lg-8">
            <div className="legal-content-card">

              {/* Section 1 */}
              <section className="legal-section" id="section-1">
                <div className="legal-section-title">
                  <span className="legal-section-num">1</span>
                  Introduction & Overview
                </div>
                <p className="legal-text">
                  Welcome to <strong>Aiveexa</strong> (accessible via <code>https://aiveexa.com</code> and related domains). Aiveexa operates an enterprise-grade multi-tenant Software-as-a-Service (SaaS) platform that empowers businesses, e-commerce stores, and organizations to automate customer messaging, run broadcast campaigns, manage customer inquiries via a team inbox, and deploy automated conversational workflows using the official <strong>Meta WhatsApp Business Cloud API</strong>.
                </p>
                <p className="legal-text">
                  We respect the privacy of our platform customers (business owners, workspace admins, and team agents) and their end-user recipients (consumers and contacts who receive WhatsApp messages from our customers). This policy governs how we collect, store, handle, and protect that data in compliance with international data privacy laws including the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA/CPRA), and the Digital Personal Data Protection Act (DPDP).
                </p>
                <div className="legal-callout-info">
                  <strong>Important Notice:</strong> By creating an account, connecting your Meta WhatsApp Business Account (WABA), or accessing the Aiveexa platform, you acknowledge that you have read and agreed to the practices outlined in this Privacy Policy and our <Link to="/terms" className="text-primary fw-bold text-decoration-none">Terms of Service</Link>.
                </div>
              </section>

              {/* Section 2 */}
              <section className="legal-section" id="section-2">
                <div className="legal-section-title">
                  <span className="legal-section-num">2</span>
                  Information We Collect
                </div>
                <p className="legal-text">
                  Depending on how you use our Services, the information we collect falls into the following categories:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>Account & Organization Information:</strong> When you register, we collect your full name, business email address, phone number, company name, workspace settings, job title, and securely hashed passwords (using <code>bcrypt</code>).
                  </li>
                  <li>
                    <strong>Meta & WhatsApp Business Account Identifiers:</strong> Through Facebook Login / Meta Embedded Signup, we receive your Meta Business Portfolio ID, WhatsApp Business Account (WABA) ID, Phone Number ID, verified display name, and authorized System User Access Tokens. Access tokens are encrypted at rest using AES-256-CBC.
                  </li>
                  <li>
                    <strong>Customer Contact Lists & Custom Attributes:</strong> Audience lists, phone numbers, contact names, custom parameters, tags, and demographic data that you upload or import via CSV/Excel or sync from third-party CRMs.
                  </li>
                  <li>
                    <strong>WhatsApp Messaging Data & Webhooks:</strong> Inbound and outbound message text, template parameters, media attachments, delivery status callbacks (sent, delivered, read, failed), and webhook events received in real time from Meta Cloud API.
                  </li>
                  <li>
                    <strong>Billing & Payment Information:</strong> When subscribing to paid tiers, transaction identifiers, billing addresses, and invoices are handled through PCI-DSS compliant third-party payment processors (e.g., Razorpay/Stripe). <em>We never store credit card numbers, CVVs, or bank account credentials on our servers.</em>
                  </li>
                  <li>
                    <strong>Automated Device, Usage & Audit Logs:</strong> Internet Protocol (IP) addresses, browser type, operating system, referrer URLs, session timestamps, and administrative audit logs collected to prevent fraud and maintain security.
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="legal-section" id="section-3">
                <div className="legal-section-title">
                  <span className="legal-section-num">3</span>
                  How We Process Your Information
                </div>
                <p className="legal-text">
                  We process personal and business data strictly to fulfill our contractual commitments and operate our SaaS platform, including:
                </p>
                <ul className="legal-list">
                  <li>Providing, operating, and improving the Aiveexa WhatsApp automation and CRM platform.</li>
                  <li>Transmitting outbound template and conversational messages via the official Meta WhatsApp Business Cloud API.</li>
                  <li>Managing WhatsApp message template submissions, syncs, and status approvals.</li>
                  <li>Ingesting incoming WhatsApp messages and delivering them to your unified Team Inbox in real time.</li>
                  <li>Enforcing multi-tenant isolation so that customer databases, contact lists, and campaigns remain completely segregated.</li>
                  <li>Preventing security abuse, malicious traffic, spamming, and unauthorized account access.</li>
                  <li>Fulfilling statutory tax, accounting, and legal compliance obligations.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="legal-section" id="section-4">
                <div className="legal-section-title">
                  <span className="legal-section-num">4</span>
                  Legal Bases for Processing (GDPR & DPDP)
                </div>
                <p className="legal-text">
                  Under the GDPR and global privacy frameworks, we only process personal information when we have a recognized legal basis:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>Performance of a Contract:</strong> Processing is required to deliver the SaaS service, maintain your workspace, and execute campaigns requested by you.
                  </li>
                  <li>
                    <strong>Legitimate Business Interests:</strong> Maintaining platform stability, bug fixing, audit logging, multi-tenant security enforcement, and fraud prevention.
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> Retaining financial records, invoices, and audit trails required under applicable laws and regulations.
                  </li>
                  <li>
                    <strong>Explicit Consent:</strong> Sending non-essential product announcements or when you explicitly opt in to preview new platform beta features.
                  </li>
                </ul>
              </section>

              {/* Section 5 */}
              <section className="legal-section" id="section-5">
                <div className="legal-section-title">
                  <span className="legal-section-num">5</span>
                  Sharing & Third-Party Processors
                </div>
                <div className="legal-callout-success">
                  <strong>Strict Anti-Monetization Commitment:</strong> Aiveexa does <u>not</u> sell, rent, monetize, or trade your personal data or your uploaded customer contact lists to any third party, broker, or advertising network under any circumstances.
                </div>
                <p className="legal-text">
                  Data is only shared with trusted sub-processors strictly necessary to deliver the service:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>Meta Platforms, Inc.:</strong> Message payloads, recipient phone numbers, and template IDs are routed through Meta’s WhatsApp Business Cloud API servers to reach recipient devices.
                  </li>
                  <li>
                    <strong>Cloud Hosting & Infrastructure Providers:</strong> Managed server infrastructure (e.g., AWS, secure cloud hosting) located in enterprise-grade data centers with 24/7 physical security and encrypted storage.
                  </li>
                  <li>
                    <strong>Payment Gateways:</strong> Certified PCI-DSS Level 1 compliant processors (such as Razorpay or Stripe) for secure subscription billing.
                  </li>
                  <li>
                    <strong>Legal Authorities:</strong> Only when strictly mandated by a valid court order, subpoena, or lawful request by government regulatory bodies.
                  </li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="legal-section" id="section-6">
                <div className="legal-section-title">
                  <span className="legal-section-num">6</span>
                  Multi-Tenant Architecture & Enterprise Data Security
                </div>
                <p className="legal-text">
                  Aiveexa incorporates defense-in-depth security principles engineered to protect your data:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>AES-256-CBC Encryption at Rest:</strong> All Meta OAuth tokens, System User secrets, and sensitive credentials are encrypted using military-grade AES-256-CBC with secure server-side salt keys. Plaintext tokens are never exposed in frontend code.
                  </li>
                  <li>
                    <strong>Multi-Tenant Workspace Boundaries:</strong> Every database transaction is strictly scoped and filtered by <code>business_id</code>. No user or tenant can query, view, or dispatch messages using another organization's data.
                  </li>
                  <li>
                    <strong>Transport Layer Security (TLS 1.3):</strong> All communications between user browsers, our API servers, and Meta Cloud API endpoints are encrypted over TLS 1.3 / HTTPS.
                  </li>
                  <li>
                    <strong>Role-Based Access Control (RBAC):</strong> Granular permissions ensure that only authorized team members (Owner, Admin, Agent) can access assigned inboxes and modules.
                  </li>
                </ul>
              </section>

              {/* Section 7 */}
              <section className="legal-section" id="section-7">
                <div className="legal-section-title">
                  <span className="legal-section-num">7</span>
                  Meta OAuth & Embedded Signup
                </div>
                <p className="legal-text">
                  When you connect your WhatsApp Business Account via Meta Embedded Signup or Facebook Login:
                </p>
                <ul className="legal-list">
                  <li>We only request permissions strictly necessary for WhatsApp Business messaging (<code>whatsapp_business_management</code> and <code>whatsapp_business_messaging</code>).</li>
                  <li>We never request or access your private personal Facebook profile posts, friend lists, or non-business media.</li>
                  <li>You can revoke Aiveexa’s authorized access at any time through your Meta Business Manager (<code>business.facebook.com</code>) under Integrations → Connected Apps.</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section className="legal-section" id="section-8">
                <div className="legal-section-title">
                  <span className="legal-section-num">8</span>
                  WhatsApp Recipient Opt-In & Anti-Spam Compliance
                </div>
                <div className="legal-callout-warning">
                  <strong>Compliance Mandate:</strong> Aiveexa strictly enforces Meta’s WhatsApp Business Messaging Policy. You are legally required to obtain verifiable opt-in consent before messaging end-users.
                </div>
                <p className="legal-text">
                  Every business using Aiveexa must:
                </p>
                <ul className="legal-list">
                  <li>Clearly inform end-users that they will receive WhatsApp communications from your brand.</li>
                  <li>Immediately honor all recipient opt-out requests (e.g., when a contact replies "STOP", "UNSUBSCRIBE", or asks to cease messages).</li>
                  <li>Refrain from purchasing, scraping, or utilizing cold/unverified phone lists. Violation of this rule leads to immediate workspace suspension without refund.</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section className="legal-section" id="section-9">
                <div className="legal-section-title">
                  <span className="legal-section-num">9</span>
                  Data Retention & Storage Limits
                </div>
                <p className="legal-text">
                  We retain personal data only for as long as necessary to provide the Services:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>Active Accounts:</strong> Contact records, campaign analytics, and conversation logs are retained while your subscription remains active or until deleted by you.
                  </li>
                  <li>
                    <strong>Closed Accounts:</strong> When an account is terminated, all associated Meta access tokens, contacts, and message logs are queued for permanent deletion within <strong>30 days</strong>.
                  </li>
                  <li>
                    <strong>Financial Records:</strong> Invoices and transaction receipts are retained for statutory periods required by tax and accounting regulations (typically up to 7 years).
                  </li>
                  <li>
                    <strong>Operational Logs:</strong> Technical debug logs and temporary webhook traces are automatically purged after 90 days.
                  </li>
                </ul>
              </section>

              {/* Section 10 */}
              <section className="legal-section" id="section-10">
                <div className="legal-section-title">
                  <span className="legal-section-num">10</span>
                  Cookies & Tracking Technologies
                </div>
                <p className="legal-text">
                  Aiveexa uses essential session tokens and cookies solely to keep you logged in securely and preserve your preferences (such as selected language, theme, and active workspace). We do <strong>not</strong> employ third-party tracking pixels or behavioral cross-site advertising cookies. You can manage cookie permissions in your browser settings.
                </p>
              </section>

              {/* Section 11 */}
              <section className="legal-section" id="section-11">
                <div className="legal-section-title">
                  <span className="legal-section-num">11</span>
                  Your Global Privacy Rights (GDPR, CCPA & DPDP)
                </div>
                <p className="legal-text">
                  Regardless of your location, Aiveexa honors the following privacy rights for all users:
                </p>
                <ul className="legal-list">
                  <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you.</li>
                  <li><strong>Right to Rectification:</strong> Update inaccurate, incomplete, or outdated profile data directly via Settings.</li>
                  <li><strong>Right to Erasure ("Right to Be Forgotten"):</strong> Request complete deletion of your personal account and associated data.</li>
                  <li><strong>Right to Data Portability:</strong> Export your contacts, broadcast reports, and chat logs in standard CSV/JSON formats at any time.</li>
                  <li><strong>Right to Restrict or Object:</strong> Object to processing of your information under specific legal grounds.</li>
                </ul>
              </section>

              {/* Section 12 - CRITICAL FOR META COMPLIANCE */}
              <section className="legal-section" id="section-12">
                <div className="legal-section-title">
                  <span className="legal-section-num">12</span>
                  User Data Deletion Instructions (Meta App Review Compliance)
                </div>
                <div className="legal-callout-info">
                  <strong>Meta Platform Compliance:</strong> In accordance with Meta Platform Terms and international data protection laws, Aiveexa provides straightforward mechanisms to delete your personal data and WhatsApp Business account mappings.
                </div>
                <p className="legal-text">
                  Follow any of the methods below to initiate data deletion:
                </p>

                <div className="card bg-light border p-3 p-md-4 rounded-3 mb-3">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-gear-wide-connected text-primary me-2"></i> Method A: Self-Service Disconnection (Immediate)
                  </h6>
                  <p className="text-secondary small mb-2">
                    Navigate to your Aiveexa dashboard: <code>Settings → WhatsApp Accounts → Disconnect Account</code>.
                  </p>
                  <p className="text-secondary small mb-0">
                    This immediately revokes our access to your Meta System User token, invalidates webhook subscriptions, and terminates live synchronization.
                  </p>
                </div>

                <div className="card bg-light border p-3 p-md-4 rounded-3 mb-3">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-trash3 text-danger me-2"></i> Method B: Delete Contacts & Chat Conversations
                  </h6>
                  <p className="text-secondary small mb-0">
                    You can selectively or bulk-delete contact lists from the <strong>Contacts</strong> module, and permanently delete conversations directly from the <strong>WhatsApp Inbox</strong> using the "Delete Conversation" action.
                  </p>
                </div>

                <div className="card bg-light border p-3 p-md-4 rounded-3">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-envelope-at text-success me-2"></i> Method C: Complete Account Purge Request via Email
                  </h6>
                  <p className="text-secondary small mb-2">
                    Send an email from your registered account address to:
                  </p>
                  <div className="p-2 bg-white rounded border font-monospace text-primary fw-bold small mb-2">
                    support@aiveexa.com
                  </div>
                  <p className="text-secondary small mb-0">
                    Subject Line: <code>User Data Deletion Request - Aiveexa</code>.<br />
                    Please specify your Organization Name and registered WhatsApp Phone Number. Our compliance team will process the purge within <strong>30 days</strong> and return a confirmation code.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section className="legal-section" id="section-13">
                <div className="legal-section-title">
                  <span className="legal-section-num">13</span>
                  Do-Not-Track (DNT) Controls
                </div>
                <p className="legal-text">
                  Most modern web browsers incorporate Do-Not-Track (DNT) signaling. Because no uniform technological standard has been adopted across the industry, Aiveexa does not alter its operational logging in response to generic DNT signals. However, we do not track your activity across third-party websites.
                </p>
              </section>

              {/* Section 14 */}
              <section className="legal-section" id="section-14">
                <div className="legal-section-title">
                  <span className="legal-section-num">14</span>
                  Policy on Minors
                </div>
                <p className="legal-text">
                  Aiveexa is an enterprise B2B SaaS platform designed exclusively for businesses and individuals aged <strong>18 years or older</strong>. We do not intentionally solicit or collect personal data from minors under the age of 18. If we discover that an account has been created by a minor, we will promptly terminate the account and purge associated data.
                </p>
              </section>

              {/* Section 15 */}
              <section className="legal-section" id="section-15">
                <div className="legal-section-title">
                  <span className="legal-section-num">15</span>
                  Policy Updates & Notice
                </div>
                <p className="legal-text">
                  We may periodically revise this Privacy Policy to reflect changes in our service offerings, technical enhancements, or evolving legal frameworks. When updates occur, we will adjust the "Last Updated" date at the top of this document. For material updates, we will provide prominent notice via email or within the workspace dashboard before changes take effect.
                </p>
              </section>

              {/* Section 16 */}
              <section className="legal-section" id="section-16">
                <div className="legal-section-title">
                  <span className="legal-section-num">16</span>
                  Contact Us & Grievance Officer
                </div>
                <p className="legal-text">
                  If you have questions, inquiries, or complaints concerning this Privacy Policy or our data handling practices, please contact our dedicated Data Protection & Compliance Office:
                </p>
                <div className="p-4 bg-light rounded-3 border">
                  <div className="fw-bold text-dark fs-6 mb-2">Aiveexa Legal & Compliance Team</div>
                  <div className="text-secondary small mb-1">
                    <strong>Platform URL:</strong>{' '}
                    <a href="https://aiveexa.com" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                      https://aiveexa.com
                    </a>
                  </div>
                  <div className="text-secondary small mb-1">
                    <strong>Data Protection Officer Email:</strong>{' '}
                    <a href="mailto:support@aiveexa.com" className="text-primary text-decoration-none fw-medium">
                      support@aiveexa.com
                    </a>
                  </div>
                  <div className="text-secondary small mb-0">
                    <strong>Expected Response Window:</strong> Within 24 to 48 business hours.
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="container text-center text-muted small">
          <div className="mb-2">
            &copy; {new Date().getFullYear()} Aiveexa Platform. All rights reserved.
          </div>
          <div className="d-flex align-items-center justify-content-center gap-3">
            <Link to="/privacy" className="text-decoration-none text-muted fw-medium">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="text-decoration-none text-muted fw-medium">
              Terms of Service
            </Link>
            <span>•</span>
            <a href="mailto:support@aiveexa.com" className="text-decoration-none text-muted">
              support@aiveexa.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
