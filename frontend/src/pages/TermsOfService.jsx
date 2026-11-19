import React from 'react';
import { Link } from 'react-router-dom';
import iconImg from '../assets/icon.png';
import logoImg from '../assets/logo.png';
import '../styles/landing.css';

export default function TermsOfService() {
  const sections = [
    { id: 'agreement', title: '1. Agreement to Terms & Eligibility' },
    { id: 'service-desc', title: '2. Description of SaaS Services & Meta Cloud API' },
    { id: 'whatsapp-compliance', title: '3. Meta WhatsApp Business Policy Compliance' },
    { id: 'account-security', title: '4. Account Registration & Mandatory 2FA' },
    { id: 'multi-tenant', title: '5. Multi-Tenant Environment & Data Ownership' },
    { id: 'billing-meta-fees', title: '6. Subscriptions, Free Trial & Meta Conversation Fees' },
    { id: 'cancellation-refund', title: '7. Cancellation & Refund Policy' },
    { id: 'acceptable-use', title: '8. Acceptable Use Policy & Prohibited Conduct' },
    { id: 'user-content', title: '9. User Content & Message Broadcast Dispatches' },
    { id: 'intellectual-property', title: '10. Intellectual Property & Software License' },
    { id: 'availability-sla', title: '11. Service Availability & Maintenance' },
    { id: 'limitation-liability', title: '12. Limitation of Liability & Disclaimers' },
    { id: 'indemnification', title: '13. Indemnification' },
    { id: 'termination', title: '14. Termination & Account Suspension' },
    { id: 'governing-law', title: '15. Governing Law & Dispute Resolution' },
    { id: 'contact', title: '16. Contact Information' }
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
            <Link to="/privacy" className="btn btn-sm btn-outline-secondary d-none d-sm-inline-flex">
              Privacy Policy
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
                  <div className="fw-semibold text-dark small mb-1">Legal Queries?</div>
                  <p className="text-muted small mb-2">Reach our legal team directly.</p>
                  <a href="mailto:legal@aiveexa.com" className="btn btn-sm btn-outline-primary w-100">
                    Email Legal Team
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
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill">
                      Official SaaS Service Agreement
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill">
                      Meta Cloud API Standards
                    </span>
                  </div>
                  <h1 className="fw-bold text-dark display-6 mb-2">Terms of Service</h1>
                  <p className="text-muted small mb-0">
                    Effective Date: November 1, 2026 • Last Updated: November 19, 2026
                  </p>
                </div>

                <div className="legal-callout-box">
                  <strong>Important Notice:</strong> These Terms of Service constitute a legally binding agreement between you (or your company) and <strong>Aiveexa Technologies Private Limited</strong> ("Aiveexa"). By accessing or utilizing the Aiveexa WhatsApp SaaS automation platform, you explicitly agree to comply with all terms herein, as well as Meta Platforms' official WhatsApp Business Messaging Policies.
                </div>

                <hr className="my-4" />

                {/* Section 1 */}
                <section id="agreement" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-file-earmark-check text-primary"></i> 1. Agreement to Terms & Eligibility
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    By registering for, accessing, or using the <strong>Aiveexa</strong> software platform, applications, and web services available at <code>aiveexa.com</code> (collectively, the "Services"), you agree to be bound by these Terms of Service.
                  </p>
                  <p className="text-secondary leading-relaxed">
                    <strong>Eligibility:</strong> You must be at least 18 years of age and possess full legal authority to enter into this agreement on behalf of yourself or the business entity you represent. If you do not have such authority, or if you disagree with any part of these terms, you are prohibited from using the platform.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="service-desc" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-cpu text-primary"></i> 2. Description of SaaS Services & Meta Cloud API
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa provides a cloud-based Software-as-a-Service (SaaS) suite enabling businesses to connect with customers through the official <strong>Meta WhatsApp Business Cloud API</strong>. Services include:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">Automated and broadcast WhatsApp messaging campaigns.</li>
                    <li className="mb-2">Multi-agent shared team inbox with conversation routing, tags, and internal notes.</li>
                    <li className="mb-2">Meta WhatsApp message template builder and synchronization with Meta review systems.</li>
                    <li className="mb-2">Automated chatbots, webhook integration, and real-time delivery telemetry.</li>
                    <li className="mb-2">Contact audience manager and Excel/CSV import capabilities.</li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section id="whatsapp-compliance" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-whatsapp text-success"></i> 3. Meta WhatsApp Business Policy Compliance
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    You acknowledge and agree that your use of the Services is strictly conditioned upon compliance with Meta Platforms, Inc.’s policies, including the <a href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noopener noreferrer" className="text-primary fw-semibold">WhatsApp Business Messaging Policy</a> and <a href="https://www.whatsapp.com/legal/commerce-policy/" target="_blank" rel="noopener noreferrer" className="text-primary fw-semibold">WhatsApp Commerce Policy</a>.
                  </p>
                  <div className="legal-callout-warning">
                    <strong>Strict Opt-In & Anti-Spam Requirements:</strong>
                    <ul className="mb-0 mt-2 ps-3">
                      <li>You must have verifiable, opt-in consent from all recipients before initiating WhatsApp messages.</li>
                      <li>Unsolicited commercial messages, automated scraping, phishing, scams, or misleading content are strictly forbidden.</li>
                      <li>You must honor all user opt-out requests (e.g., recipient texting "STOP", "UNSUBSCRIBE") immediately.</li>
                      <li>Prohibited business categories (weapons, gambling, adult content, illicit drugs, predatory financial schemes) may not use the platform.</li>
                    </ul>
                  </div>
                  <p className="text-secondary">
                    Violation of Meta policies may lead to immediate suspension of your WhatsApp Business Account (WABA) by Meta, for which Aiveexa bears zero liability.
                  </p>
                </section>

                {/* Section 4 */}
                <section id="account-security" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-shield-check text-primary"></i> 4. Account Registration & Mandatory 2FA
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    To access the platform, you must register a workspace account with valid business information. You agree to:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">Maintain the confidentiality and security of your workspace login credentials and API tokens.</li>
                    <li className="mb-2">Enable Two-Factor Authentication (2FA) where required to safeguard access to customer message records.</li>
                    <li className="mb-2">Assume full legal responsibility for all broadcasts, campaigns, and interactions dispatched under your workspace account.</li>
                    <li className="mb-2">Notify Aiveexa immediately at <a href="mailto:security@aiveexa.com" className="text-primary">security@aiveexa.com</a> upon detecting any unauthorized account access.</li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section id="multi-tenant" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-database-lock text-primary"></i> 5. Multi-Tenant Environment & Data Ownership
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa operates on an enterprise multi-tenant architecture with cryptographic isolation:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>Customer Data Ownership:</strong> You retain complete and exclusive ownership of your customer lists, uploaded CSV files, message content, and media assets ("Customer Data"). Aiveexa does not own or claim rights to your Customer Data.</li>
                    <li className="mb-2"><strong>Platform IP:</strong> Aiveexa retains all rights, titles, software source code, patents, and intellectual property in and to the platform and underlying algorithms.</li>
                    <li className="mb-2"><strong>Credential Encryption:</strong> Meta OAuth tokens and client secrets are encrypted using AES-256-CBC at rest and are strictly isolated by <code>business_id</code>.</li>
                  </ul>
                </section>

                {/* Section 6 */}
                <section id="billing-meta-fees" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-credit-card text-primary"></i> 6. Subscriptions, Free Trial & Meta Conversation Fees
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa offers tiered software subscription plans and a 14-day free trial on eligible plans:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2"><strong>SaaS Subscription Fees:</strong> Software subscription charges (Monthly or Annual) cover access to platform features, shared team inbox, bots, and infrastructure. Subscriptions renew automatically unless cancelled before the renewal date.</li>
                    <li className="mb-2"><strong>Meta Conversation Fees:</strong> WhatsApp messaging charges are levied directly by Meta Platforms based on 24-hour conversation categories (Marketing, Utility, Authentication, Service). Meta fees are charged according to Meta's regional rate card and are the sole financial responsibility of the account owner.</li>
                    <li className="mb-2"><strong>Free Tier Allowances:</strong> Meta provides 1,000 free Service conversations per month per WABA.</li>
                  </ul>
                </section>

                {/* Section 7 */}
                <section id="cancellation-refund" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-arrow-counterclockwise text-primary"></i> 7. Cancellation & Refund Policy
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    <strong>Subscription Cancellation:</strong> You may cancel your subscription at any time through the Billing & Plans page in your dashboard. Upon cancellation, your workspace retains active access until the conclusion of your current prepaid billing cycle.
                  </p>
                  <p className="text-secondary leading-relaxed">
                    <strong>Refund Policy:</strong> Because Aiveexa offers a comprehensive 14-day free trial, SaaS subscription payments are non-refundable once billed. In exceptional circumstances involving verified platform downtime exceeding our SLA, refund requests may be submitted to <a href="mailto:billing@aiveexa.com" className="text-primary">billing@aiveexa.com</a>.
                  </p>
                </section>

                {/* Section 8 */}
                <section id="acceptable-use" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-slash-circle text-danger"></i> 8. Acceptable Use Policy & Prohibited Conduct
                  </h2>
                  <p className="text-secondary leading-relaxed">You agree not to use the Services to:</p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">Broadcast spam, unsolicited bulk messages, pyramid schemes, or deceptive promotional content.</li>
                    <li className="mb-2">Transmit malicious software, viruses, Trojan horses, or harmful code.</li>
                    <li className="mb-2">Reverse engineer, decompile, or extract the source code of our platform or APIs.</li>
                    <li className="mb-2">Engage in automated scraping or systematic data extraction without prior written authorization.</li>
                    <li className="mb-2">Violate intellectual property rights, copyrights, or trademarks of third parties.</li>
                    <li className="mb-2">Bypass, disable, or tamper with security protocols, rate limiters, or access boundaries.</li>
                  </ul>
                </section>

                {/* Section 9 */}
                <section id="user-content" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-chat-dots text-primary"></i> 9. User Content & Message Broadcast Dispatches
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    By submitting message text, contact lists, templates, and multimedia through our platform, you grant Aiveexa a limited, non-exclusive license solely to transmit, process, and display such content as necessary to execute your requested WhatsApp messaging operations. You represent that you have all necessary rights, licenses, and permissions to broadcast such content.
                  </p>
                </section>

                {/* Section 10 */}
                <section id="intellectual-property" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-award text-primary"></i> 10. Intellectual Property & Software License
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    All software, design elements, graphics, dashboards, logos, and trademarks associated with Aiveexa are the intellectual property of Aiveexa Technologies Private Limited. We grant you a limited, revocable, non-exclusive, non-transferable license to access and use the platform for internal business operations in accordance with these Terms.
                  </p>
                </section>

                {/* Section 11 */}
                <section id="availability-sla" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-speedometer2 text-primary"></i> 11. Service Availability & Maintenance
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    We strive to maintain a 99.9% uptime SLA for core messaging services. However, occasional scheduled maintenance or downtime resulting from third-party cloud infrastructure (AWS) or Meta WhatsApp Cloud API network outages may occur. We provide advance notification for major scheduled maintenance windows.
                  </p>
                </section>

                {/* Section 12 */}
                <section id="limitation-liability" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-exclamation-triangle text-warning"></i> 12. Limitation of Liability & Disclaimers
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AIVEEXA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p className="text-secondary leading-relaxed">
                    IN NO EVENT SHALL AIVEEXA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS REPUTATION, ARISING FROM META-IMPOSED ACCOUNT TIER ADJUSTMENTS, TEMPLATE REJECTIONS, OR SERVICE SUSPENSIONS BY META PLATFORMS.
                  </p>
                </section>

                {/* Section 13 */}
                <section id="indemnification" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-shield-fill-check text-primary"></i> 13. Indemnification
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    You agree to indemnify, defend, and hold harmless Aiveexa, its officers, directors, employees, and affiliates from and against any third-party claims, liabilities, damages, and expenses (including reasonable legal fees) arising from: (a) your breach of these Terms, (b) violation of Meta WhatsApp Business Policies, or (c) transmission of unsolicited or illegal messages to recipients.
                  </p>
                </section>

                {/* Section 14 */}
                <section id="termination" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-door-closed text-danger"></i> 14. Termination & Account Suspension
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    Aiveexa reserves the right to immediately suspend or terminate your workspace access without prior notice if we determine that:
                  </p>
                  <ul className="text-secondary ps-3">
                    <li className="mb-2">Your account has engaged in spam, phishing, fraud, or harassment.</li>
                    <li className="mb-2">Your WhatsApp Business Account has been flagged or banned by Meta Platforms for severe quality degradation.</li>
                    <li className="mb-2">You fail to settle overdue subscription fees after formal notice.</li>
                  </ul>
                </section>

                {/* Section 15 */}
                <section id="governing-law" className="legal-section">
                  <h2 className="legal-section-title">
                    <i className="bi bi-bank text-primary"></i> 15. Governing Law & Dispute Resolution
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
                  </p>
                </section>

                {/* Section 16 */}
                <section id="contact" className="legal-section mb-0">
                  <h2 className="legal-section-title">
                    <i className="bi bi-envelope text-primary"></i> 16. Contact Information
                  </h2>
                  <p className="text-secondary leading-relaxed">
                    For legal questions, compliance inquiries, or notices regarding these Terms of Service, please contact:
                  </p>
                  <div className="p-4 bg-light rounded-3 border">
                    <div className="fw-bold text-dark h5 mb-2">Aiveexa Technologies Private Limited</div>
                    <div className="text-secondary mb-1"><strong>Attention:</strong> Legal Department & General Counsel</div>
                    <div className="text-secondary mb-1"><strong>Email:</strong> <a href="mailto:legal@aiveexa.com" className="text-primary text-decoration-none">legal@aiveexa.com</a> / <a href="mailto:support@aiveexa.com" className="text-primary text-decoration-none">support@aiveexa.com</a></div>
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
            <Link to="/privacy" className="text-white text-decoration-none">Privacy Policy</Link>
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
