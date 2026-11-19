import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import iconImg from '../assets/icon.png';
import logoImg from '../assets/logo.png';
import '../styles/landing.css';

export default function PrivacyPolicy() {
  const sections = [
    { id: 'intro', title: '1. Introduction & Overview' },
    { id: 'info-collected', title: '2. Information We Collect' },
    { id: 'how-we-process', title: '3. How We Process Your Information' },
    { id: 'legal-bases', title: '4. Legal Bases for Processing (GDPR & Global)' },
    { id: 'multi-tenant', title: '5. Multi-Tenant Architecture & Security Standards' },
    { id: 'whatsapp-policy', title: '6. WhatsApp Business Messaging & Opt-In Rules' },
    { id: 'third-parties', title: '7. Third-Party Sharing & Meta Platform Integration' },
    { id: 'cookies', title: '8. Cookies & Tracking Technologies' },
    { id: 'data-retention', title: '9. Data Retention & Account Deletion' },
    { id: 'privacy-rights', title: '10. Your Privacy Rights & Choices' },
    { id: 'international', title: '11. International Data Transfers' },
    { id: 'children', title: '12. Policy Regarding Minors' },
    { id: 'updates', title: '13. Modifications to This Privacy Policy' },
    { id: 'contact', title: '14. Contact Us & Data Protection Officer' }
  ];

  return (
    <div className="legal-page-wrapper">
      {/* ---------------------------------------------------------------------
          Legal Top Navbar
          --------------------------------------------------------------------- */}
      <header className="legal-header-navbar py-2">
        <div className="landing-container d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <img src={iconImg} alt="Aiveexa" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <img src={logoImg} alt="Aiveexa" style={{ height: '32px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }} />
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/terms" className="btn btn-sm btn-outline-secondary d-none d-sm-inline-flex">
              Terms of Service
            </Link>
            <Link to="/login" className="btn btn-sm btn-outline-primary">
              Log In
            </Link>
            <Link to="/register" className="btn btn-sm btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------------
          Main Content Area with Sticky Sidebar
          --------------------------------------------------------------------- */}
      <main className="py-5">
        <div className="landing-container">
          <div className="row g-4">
            {/* Sidebar Navigation */}
            <aside className="col-12 col-lg-3 d-none d-lg-block">
              <div className="legal-sidebar-nav">
                <div className="fw-bold text-dark mb-3 px-2 text-uppercase small" style={{ letterSpacing: '0.05em' }}>
                  Table of Contents
                </div>
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="legal-nav-link">
                    {s.title}
                  </a>
                ))}
                <hr className="my-3" />
                <div className="p-3 bg-light rounded-3 border">
                  <div className="fw-semibold text-dark small mb-1">Need help or clarification?</div>
                  <p className="text-muted small mb-2">Our privacy compliance team is here for you.</p>
                  <a href="mailto:privacy@aiveexa.com" className="btn btn-sm btn-outline-primary w-100">
                    Email Privacy Team
                  </a>
                </div>
              </div>
            </aside>

            {/* Document Body Card */}
            <div className="col-12 col-lg-9">
              <div className="legal-content-card">
                {/* Header Banner */}
                <div className="mb-4">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                      <i className="bi bi-shield-check me-1"></i> Meta Cloud API & GDPR Compliant
                    </span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill">
                      Official Aiveexa Legal Policy
                    </span>
                  </div>
                  <h1 className="fw-bold text-dark display-6 mb-2">Privacy Policy</h1>
                  <p className="text-muted small mb-0">
                    Effective Date: November 1, 2026 • Last Updated: November 19, 2026
                  </p>
                </div>

                <div className="legal-callout-box">
                  <strong>Summary of Key Points:</strong> We at <strong>Aiveexa</strong> respect your privacy. We collect only necessary business and contact data required to operate our WhatsApp marketing and team inbox SaaS platform built on the official <strong>Meta WhatsApp Business Cloud API</strong>. We strictly encrypt all credentials (AES-256), enforce multi-tenant isolation, never sell or monetize your personal or contact data, and honor all global data protection standards (GDPR, UK GDPR, and India DPDP).
                </div>

                <hr className="my-4" />

                {/* Section 1 */}
                <section id="intro" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-info-circle text-primary"></i> 1. Introduction & Overview
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    This Privacy Policy applies to <strong>Aiveexa Technologies Private Limited</strong>, operating as <strong>Aiveexa</strong> ("we", "our", or "us"), and describes how we collect, store, process, and protect your information when you access or use our software applications, customer portal (<code>aiveexa.com</code> and related domains), APIs, and services (collectively, the "Services").
                  </p>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa is an enterprise-grade multi-tenant Software-as-a-Service (SaaS) provider facilitating business customer communication, broadcast campaigns, template management, and team collaboration powered by the official <strong>Meta WhatsApp Business Cloud API</strong>.
                  </p>
                  <p className="text-secondary leading-relaxed">
                    By registering for an account or using any of our Services, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our policies, please discontinue using our Services immediately.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="info-collected" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-database text-primary"></i> 2. Information We Collect
                  </h2>
                  <p className="text-secondary">We collect information across several categories based on how you interact with our platform:</p>

                  <h6 className="fw-bold text-dark mt-3">A. Personal Information You Disclose to Us</h6>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Account & Registration Details:</strong> Full name, business email address, phone number, company/brand name, account credentials, and billing information.</li>
                    <li className="mb-2"><strong>Workspace Team Members:</strong> Names, roles, emails, and permissions of team members invited to your shared inbox.</li>
                    <li className="mb-2"><strong>Payment & Transaction Data:</strong> Payment card details, billing address, and transaction histories. All payment credentials are processed securely by PCI-DSS compliant third-party payment gateways (e.g., Stripe / Razorpay). Aiveexa does not store complete raw credit card numbers.</li>
                  </ul>

                  <h6 className="fw-bold text-dark mt-3">B. Meta WhatsApp Account Credentials</h6>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Meta Business Platform Data:</strong> Meta Business Portfolio ID, WhatsApp Business Account (WABA) ID, WhatsApp Phone Number ID, display names, and verification statuses.</li>
                    <li className="mb-2"><strong>OAuth Access Tokens:</strong> Meta permanent or system user access tokens acquired via Meta Embedded Signup / Facebook Login. These tokens are stored encrypted at rest using AES-256-CBC encryption.</li>
                  </ul>

                  <h6 className="fw-bold text-dark mt-3">C. Customer Contacts & Audience Lists (Customer Data)</h6>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Contact Records:</strong> Recipient phone numbers, names, tags, customer segments, and custom field attributes uploaded or imported by you via CSV, Excel, or API.</li>
                    <li className="mb-2"><strong>Ownership:</strong> You maintain sole ownership of your contact lists. Aiveexa acts strictly as a Data Processor on your behalf.</li>
                  </ul>

                  <h6 className="fw-bold text-dark mt-3">D. WhatsApp Messages & Webhook Telemetry</h6>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Message Payloads:</strong> Inbound and outbound message text, template parameters, interactive button clicks, and media attachments transmitted through Meta Cloud API.</li>
                    <li className="mb-2"><strong>Delivery Statuses:</strong> Real-time webhook events received from Meta indicating message state (Sent, Delivered, Read, Failed).</li>
                  </ul>

                  <h6 className="fw-bold text-dark mt-3">E. Automatically Collected Technical Data</h6>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">IP addresses, browser type, operating system, session timestamps, device identifiers, and platform activity logs used for security monitoring and fraud prevention.</li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section id="how-we-process" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-gear-wide-connected text-primary"></i> 3. How We Process Your Information
                  </h2>
                  <p className="text-secondary">We process your data strictly for legitimate operational purposes:</p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">To provision, manage, and maintain your workspace account and team permissions.</li>
                    <li className="mb-2">To dispatch authorized broadcast campaigns and 1-on-1 chats via the Meta WhatsApp Cloud API.</li>
                    <li className="mb-2">To synchronize approved message templates with Meta’s template library and manage phone number quality tiers.</li>
                    <li className="mb-2">To power our shared multi-agent team inbox, canned responses, and AI auto-reply chatbots.</li>
                    <li className="mb-2">To detect and prevent fraudulent use, spam, unauthorized account takeovers, and security breaches.</li>
                    <li className="mb-2">To compute billing, conversation usage tiers, and generate exportable analytics reports.</li>
                    <li className="mb-2">To comply with applicable legal obligations and official Meta WhatsApp Business Messaging Policies.</li>
                  </ul>
                </section>

                {/* Section 4 */}
                <section id="legal-bases" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-journal-bookmark text-primary"></i> 4. Legal Bases for Processing (GDPR & Global Standards)
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Under the General Data Protection Regulation (GDPR), UK Data Protection Act, and applicable international laws, we process personal information on the following lawful bases:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Performance of a Contract:</strong> Processing necessary to deliver the SaaS services you requested upon signing up.</li>
                    <li className="mb-2"><strong>Legitimate Interests:</strong> Operating, protecting, and optimizing our platform infrastructure, preventing security threats, and providing customer support.</li>
                    <li className="mb-2"><strong>Legal Compliance:</strong> Retaining financial transaction records for tax compliance and responding to lawful governmental requests.</li>
                    <li className="mb-2"><strong>Explicit Consent:</strong> Where you have granted explicit consent for specific features or optional communications (which you may withdraw at any time).</li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section id="multi-tenant" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-shield-lock text-primary"></i> 5. Multi-Tenant Architecture & Security Standards
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa is architected with strict multi-tenant boundaries to safeguard confidential business information:
                  </p>
                  <div className="row g-3 my-2">
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="fw-bold text-dark mb-1"><i className="bi bi-key-fill text-primary me-1"></i> AES-256 Token Encryption</div>
                        <p className="text-muted small mb-0">All Meta OAuth access tokens and credentials are encrypted at rest with AES-256-CBC and are never exposed in browser payloads.</p>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="fw-bold text-dark mb-1"><i className="bi bi-layers-fill text-success me-1"></i> Tenant Isolation</div>
                        <p className="text-muted small mb-0">Every database query is strictly scoped and parameterized by <code>business_id</code>, guaranteeing zero cross-tenant data leakage.</p>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="fw-bold text-dark mb-1"><i className="bi bi-lock-fill text-info me-1"></i> TLS 1.3 Transport Security</div>
                        <p className="text-muted small mb-0">All traffic between your browser, our servers, and Meta Cloud API is transmitted over HTTPS with TLS 1.3 encryption.</p>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="fw-bold text-dark mb-1"><i className="bi bi-person-badge-fill text-warning me-1"></i> Role-Based Access Control</div>
                        <p className="text-muted small mb-0">Workspace owners configure granular permissions for Admins, Managers, and Agents to restrict access to sensitive features.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 6 */}
                <section id="whatsapp-policy" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-whatsapp text-success"></i> 6. WhatsApp Business Messaging & Opt-In Rules
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    As an official Meta WhatsApp Cloud API SaaS solution, all customers must strictly adhere to the <a href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noopener noreferrer" className="text-primary fw-semibold">WhatsApp Business Messaging Policy</a>:
                  </p>
                  <div className="legal-callout-warning">
                    <strong>Mandatory Opt-In Requirement:</strong> You must obtain explicit, verifiable opt-in consent from individuals before initiating WhatsApp broadcast messages. Sending unsolicited messages, spam, or misleading marketing is strictly prohibited and will result in immediate workspace suspension.
                  </div>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Opt-Out Mechanism:</strong> You must provide an explicit opt-out path (such as replying "STOP" or "UNSUBSCRIBE") and honor customer opt-out requests immediately.</li>
                    <li className="mb-2"><strong>24-Hour Service Window:</strong> Free-form messaging is only permitted within 24 hours of the customer's last incoming message. Outside this window, only pre-approved Meta message templates may be used.</li>
                  </ul>
                </section>

                {/* Section 7 */}
                <section id="third-parties" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-diagram-3 text-primary"></i> 7. Third-Party Sharing & Meta Integration
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    <strong>We do not sell, rent, or trade your personal data or your contact lists to data brokers or advertisers.</strong>
                  </p>
                  <p className="text-secondary">We share data only in the following limited scenarios:</p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Meta Platforms, Inc.:</strong> Message contents, recipient phone numbers, and template IDs are transmitted to Meta Cloud API to route and deliver WhatsApp messages.</li>
                    <li className="mb-2"><strong>Cloud Infrastructure:</strong> Secure tier-1 cloud hosting providers (e.g., AWS / DigitalOcean) hosting our databases and application servers.</li>
                    <li className="mb-2"><strong>Payment Gateways:</strong> Payment processors (Stripe, Razorpay) handling subscription billing and invoices.</li>
                    <li className="mb-2"><strong>Legal Compliance:</strong> If required by law, subpoena, or lawful court order.</li>
                  </ul>
                </section>

                {/* Section 8 */}
                <section id="cookies" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-cookie text-primary"></i> 8. Cookies & Tracking Technologies
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    We use cookies, session tokens, and local storage strictly to keep you authenticated, remember your workspace preferences, and ensure application security. You can adjust your browser cookie settings at any time; however, disabling essential session cookies will prevent login to the dashboard.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="data-retention" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-clock-history text-primary"></i> 9. Data Retention & Account Deletion
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    We retain your workspace data for as long as your account is active and in good standing. If you choose to close your account:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">Your contacts, imported CSVs, and message records will be queued for permanent purging within 30 days.</li>
                    <li className="mb-2">Meta OAuth access tokens are immediately invalidated and deleted from our database.</li>
                    <li className="mb-2">Aggregated, anonymized telemetry logs may be retained solely for financial reporting, tax audit, and security fraud analysis as required by law.</li>
                  </ul>
                </section>

                {/* Section 10 */}
                <section id="privacy-rights" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-person-check text-primary"></i> 10. Your Privacy Rights & Choices
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Depending on your geographic location (including the EU, UK, Canada, and India under DPDP Act 2023), you possess specific statutory rights regarding your personal information:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Right of Access:</strong> Request a copy of the personal information we maintain about you.</li>
                    <li className="mb-2"><strong>Right to Rectification:</strong> Update or correct inaccurate or incomplete profile data directly from your Settings page.</li>
                    <li className="mb-2"><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request the complete deletion of your personal account data.</li>
                    <li className="mb-2"><strong>Right to Data Portability:</strong> Export your contacts, broadcast logs, and campaign reports in CSV format at any time.</li>
                    <li className="mb-2"><strong>Right to Withdraw Consent:</strong> Revoke consent for optional communications without affecting the lawfulness of prior processing.</li>
                  </ul>
                  <p className="text-secondary">
                    To exercise any of these rights, email us at <a href="mailto:privacy@aiveexa.com" className="text-primary">privacy@aiveexa.com</a>. We respond to all verified requests within 30 days.
                  </p>
                </section>

                {/* Section 11 */}
                <section id="international" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-globe text-primary"></i> 11. International Data Transfers
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Our platform infrastructure is hosted in secure, globally distributed data centers. When data is transferred across international borders, we ensure adequate protection through standard contractual clauses (SCCs) and robust encryption standards aligned with GDPR.
                  </p>
                </section>

                {/* Section 12 */}
                <section id="children" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-people text-primary"></i> 12. Policy Regarding Minors
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa is an enterprise B2B SaaS platform intended exclusively for commercial entities and individuals aged 18 and older. We do not knowingly solicit or collect data from minors. If we learn that personal data from a child under 18 has been collected, we will take prompt steps to delete it.
                  </p>
                </section>

                {/* Section 13 */}
                <section id="updates" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-arrow-repeat text-primary"></i> 13. Modifications to This Privacy Policy
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    We may update this Privacy Policy from time to time to reflect operational, legal, or regulatory modifications. When updates are published, the "Last Updated" timestamp at the top will be updated. Continued use of our Services following any modifications constitutes your acceptance of the revised policy.
                  </p>
                </section>

                {/* Section 14 */}
                <section id="contact" className="legal-section mb-0">
                  <h2 className="legal-section-title">
                    <i className="bi bi-envelope text-primary"></i> 14. Contact Us & Data Protection Officer
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    If you have questions, feedback, or concerns regarding our privacy practices or wish to submit a data subject request, please reach out to our team:
                  </p>
                  <div className="p-4 bg-light rounded-3 border">
                    <div className="fw-bold text-dark h5 mb-2">Aiveexa Technologies Private Limited</div>
                    <div className="text-secondary mb-1"><strong>Attention:</strong> Data Protection & Privacy Compliance Officer</div>
                    <div className="text-secondary mb-1"><strong>Email:</strong> <a href="mailto:privacy@aiveexa.com" className="text-primary text-decoration-none">privacy@aiveexa.com</a> / <a href="mailto:support@aiveexa.com" className="text-primary text-decoration-none">support@aiveexa.com</a></div>
                    <div className="text-secondary mb-1"><strong>Website:</strong> <a href="https://aiveexa.com" className="text-primary text-decoration-none">https://aiveexa.com</a></div>
                    <div className="text-secondary"><strong>Response SLA:</strong> Within 24-48 business hours</div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ---------------------------------------------------------------------
          Legal Footer
          --------------------------------------------------------------------- */}
      <footer className="landing-footer py-4 mt-5">
        <div className="landing-container text-center small text-muted">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-2">
            <Link to="/" className="text-white text-decoration-none">Home</Link>
            <span>•</span>
            <Link to="/terms" className="text-white text-decoration-none">Terms of Service</Link>
            <span>•</span>
            <Link to="/login" className="text-white text-decoration-none">Log In</Link>
            <span>•</span>
            <Link to="/register" className="text-white text-decoration-none">Start Free Trial</Link>
          </div>
          <div>&copy; {new Date().getFullYear()} Aiveexa Technologies. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
