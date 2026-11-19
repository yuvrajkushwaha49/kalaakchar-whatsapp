import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import iconImg from '../assets/icon.png';
import '../styles/legal.css';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service — Aiveexa';

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
    { id: 'section-1', title: '1. Introduction' },
    { id: 'section-2', title: '2. Acceptance of Terms' },
    { id: 'section-3', title: '3. Modifications to Terms' },
    { id: 'section-4', title: '4. Eligibility & Authority' },
    { id: 'section-5', title: '5. Account & Security' },
    { id: 'section-6', title: '6. Description of Services' },
    { id: 'section-7', title: '7. Meta & WhatsApp Policy' },
    { id: 'section-8', title: '8. Subscriptions & Billing' },
    { id: 'section-9', title: '9. Meta Conversation Fees' },
    { id: 'section-10', title: '10. Cancellation & Refunds' },
    { id: 'section-11', title: '11. Data Ownership & IP' },
    { id: 'section-12', title: '12. Acceptable Use Policy' },
    { id: 'section-13', title: '13. Third-Party Integrations' },
    { id: 'section-14', title: '14. Service Level & Uptime' },
    { id: 'section-15', title: '15. Disclaimers & Warranties' },
    { id: 'section-16', title: '16. Limitation of Liability' },
    { id: 'section-17', title: '17. Indemnification' },
    { id: 'section-18', title: '18. Suspension & Termination' },
    { id: 'section-19', title: '19. Governing Law' },
    { id: 'section-20', title: '20. Contact Information' },
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
            <Link to="/privacy" className="btn btn-sm btn-outline-secondary fw-medium">
              Privacy Policy
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
            <span className="legal-badge-tos">
              <i className="bi bi-file-earmark-text fs-6"></i>
              Official Master SaaS Service Agreement
            </span>
            <span className="badge bg-light text-muted border px-3 py-2 rounded-pill small">
              Enterprise Terms & Conditions
            </span>
          </div>

          <h1 className="legal-hero-title mb-3">Terms of Service</h1>
          <p className="legal-hero-subtitle mb-3">
            These Terms of Service govern your access to and use of <strong>Aiveexa</strong>, including our web applications, WhatsApp automation tools, APIs, and customer engagement services.
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
                  <i className="bi bi-patch-question text-primary me-1"></i> Questions About Terms?
                </div>
                <div className="text-muted small">
                  Contact our Legal Department at{' '}
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
                  Introduction
                </div>
                <p className="legal-text">
                  Welcome to <strong>Aiveexa</strong> ("Aiveexa", "we", "us", or "our"). These Terms of Service ("Terms") constitute a legally binding agreement between you (whether individually or as an authorized representative of a business entity) and Aiveexa, concerning your access to and use of <code>https://aiveexa.com</code>, our software platform, APIs, sub-domains, and associated services (collectively, the "Services").
                </p>
                <p className="legal-text">
                  Aiveexa provides a cloud-based multi-tenant customer communication and marketing automation platform built upon the official <strong>Meta WhatsApp Business Cloud API</strong>.
                </p>
              </section>

              {/* Section 2 */}
              <section className="legal-section" id="section-2">
                <div className="legal-section-title">
                  <span className="legal-section-num">2</span>
                  Acceptance of Terms
                </div>
                <p className="legal-text">
                  By registering for an account, accessing the workspace, connecting a WhatsApp Business Account (WABA), or clicking "I Agree", you explicitly acknowledge that you have read, understood, and agreed to be bound by all of these Terms and Conditions and our <Link to="/privacy" className="text-primary fw-bold text-decoration-none">Privacy Policy</Link>.
                </p>
                <div className="legal-callout-danger">
                  <strong>DISCONTINUATION NOTICE:</strong> IF YOU DO NOT AGREE WITH ALL OF THESE TERMS AND CONDITIONS, YOU ARE EXPRESSLY PROHIBITED FROM USING THE PLATFORM AND MUST DISCONTINUE USE IMMEDIATELY.
                </div>
              </section>

              {/* Section 3 */}
              <section className="legal-section" id="section-3">
                <div className="legal-section-title">
                  <span className="legal-section-num">3</span>
                  Modifications to the Terms
                </div>
                <p className="legal-text">
                  We reserve the right, at our sole discretion, to modify or replace these Terms from time to time. When changes occur, we will update the "Last Updated" date at the top of this page. Material revisions will be communicated through in-app dashboard notices or via email at least 15 days before taking effect. Your continued use of the Services after the effective date of revisions constitutes acceptance of the modified Terms.
                </p>
              </section>

              {/* Section 4 */}
              <section className="legal-section" id="section-4">
                <div className="legal-section-title">
                  <span className="legal-section-num">4</span>
                  Eligibility & Authority
                </div>
                <p className="legal-text">
                  The Services are intended solely for businesses, commercial enterprises, and persons who are at least <strong>18 years of age</strong>. By using Aiveexa, you represent and warrant that:
                </p>
                <ul className="legal-list">
                  <li>You possess the legal capacity to enter into binding agreements.</li>
                  <li>If registering on behalf of a company, corporation, or entity, you have full legal authority to bind that entity to these Terms.</li>
                  <li>You will not use the Services for any unlawful, fraudulent, or prohibited purposes.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section className="legal-section" id="section-5">
                <div className="legal-section-title">
                  <span className="legal-section-num">5</span>
                  Account Registration, Passwords & Workspace Security
                </div>
                <p className="legal-text">
                  To utilize the platform, you must create a workspace account. You agree to:
                </p>
                <ul className="legal-list">
                  <li>Provide accurate, current, and complete registration details and business contact information.</li>
                  <li>Maintain the security and confidentiality of your login passwords and API credentials.</li>
                  <li>Notify us immediately at <code>support@aiveexa.com</code> if you suspect any unauthorized access or breach of your account.</li>
                  <li>Assume full legal responsibility for all broadcasts, messages, and actions dispatched from your workspace or through connected WhatsApp numbers.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="legal-section" id="section-6">
                <div className="legal-section-title">
                  <span className="legal-section-num">6</span>
                  Description of SaaS Services
                </div>
                <p className="legal-text">
                  Aiveexa provides a suite of WhatsApp automation features, including:
                </p>
                <ul className="legal-list">
                  <li><strong>WhatsApp Campaign Manager:</strong> Automated bulk broadcasting, scheduled campaigns, and delivery tracking.</li>
                  <li><strong>Meta Template Studio:</strong> Template creation, submission for Meta approval, and live status synchronization.</li>
                  <li><strong>Multi-Agent Team Inbox:</strong> Shared inbox for support agents, 24-hour customer care session handling, and contact tagging.</li>
                  <li><strong>Contact & Excel Manager:</strong> Audience list management, attribute mapping, and CSV/Excel data importing.</li>
                  <li><strong>Automation & Webhook Engine:</strong> Inbound message routing, automated replies, and external webhook integrations.</li>
                </ul>
              </section>

              {/* Section 7 - CRITICAL FOR WHATSAPP/META COMPLIANCE */}
              <section className="legal-section" id="section-7">
                <div className="legal-section-title">
                  <span className="legal-section-num">7</span>
                  Meta Platforms & WhatsApp Business Policy Compliance
                </div>
                <div className="legal-callout-warning">
                  <strong>Zero-Tolerance Spam Policy:</strong> Because Aiveexa operates directly on the official Meta WhatsApp Business Cloud API, all users must strictly comply with Meta’s <a href="https://www.whatsapp.com/legal/business-messaging-policy/" target="_blank" rel="noopener noreferrer" className="fw-bold text-dark">WhatsApp Business Messaging Policy</a> and <a href="https://www.whatsapp.com/legal/commerce-policy/" target="_blank" rel="noopener noreferrer" className="fw-bold text-dark">Commerce Policy</a>.
                </div>
                <p className="legal-text">
                  By using Aiveexa, you explicitly agree that:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>Verifiable Opt-In Consent:</strong> You will only send WhatsApp messages to recipients who have explicitly consented (opted in) to receive communications from your business.
                  </li>
                  <li>
                    <strong>Immediate Opt-Out Fulfillment:</strong> You must promptly honor recipient opt-out requests (e.g., when a contact messages "STOP", "UNSUBSCRIBE", or requests to cease communications).
                  </li>
                  <li>
                    <strong>Template Approval Mandate:</strong> All marketing, utility, and authentication messages initiated outside the 24-hour service window must utilize pre-approved Meta message templates.
                  </li>
                  <li>
                    <strong>Prohibited Goods & Services:</strong> You may not promote illegal drugs, firearms, tobacco, adult services, gambling, deceptive financial schemes, or counterfeit products.
                  </li>
                  <li>
                    <strong>Quality Rating Maintenance:</strong> You are responsible for monitoring your WhatsApp Phone Number Quality Rating. High user block or report rates may cause Meta to restrict or downgrade your messaging tiers.
                  </li>
                </ul>
              </section>

              {/* Section 8 */}
              <section className="legal-section" id="section-8">
                <div className="legal-section-title">
                  <span className="legal-section-num">8</span>
                  Subscription Plans, Free Trial & Billing Terms
                </div>
                <p className="legal-text">
                  Access to Aiveexa is billed on a subscription basis (monthly or annual billing cycles):
                </p>
                <ul className="legal-list">
                  <li><strong>Free Trial:</strong> If offered, trial accounts provide limited features and message allowances for evaluation. After the trial period expires, continued access requires upgrading to a paid plan.</li>
                  <li><strong>Automatic Renewal:</strong> Paid subscriptions automatically renew at the end of each billing cycle unless cancelled prior to the renewal date.</li>
                  <li><strong>Price Adjustments:</strong> We reserve the right to revise subscription fees upon 30 days’ advance notice to active subscribers.</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section className="legal-section" id="section-9">
                <div className="legal-section-title">
                  <span className="legal-section-num">9</span>
                  Meta Cloud API Conversation Fees & Pass-Through Charges
                </div>
                <p className="legal-text">
                  Meta Platforms charges for WhatsApp Business conversations based on category (Marketing, Utility, Authentication, and Service):
                </p>
                <ul className="legal-list">
                  <li>Meta conversation costs are established and updated independently by Meta Platforms, Inc.</li>
                  <li>Depending on your account setup, Meta conversation fees are billed directly to your payment card linked within Meta Business Manager, or managed via platform wallet credits.</li>
                  <li>Aiveexa is not liable for Meta price fluctuations, country-specific conversation tariffs, or exchange rate variations.</li>
                </ul>
              </section>

              {/* Section 10 */}
              <section className="legal-section" id="section-10">
                <div className="legal-section-title">
                  <span className="legal-section-num">10</span>
                  Cancellation & Refund Policy
                </div>
                <p className="legal-text">
                  You may cancel your subscription at any time via <code>Settings → Billing & Plans</code>:
                </p>
                <ul className="legal-list">
                  <li><strong>Cancellation:</strong> Cancellation takes effect at the end of your current paid billing period; you will retain access until the cycle concludes.</li>
                  <li><strong>No Prorated Refunds:</strong> Subscription fees are non-refundable once billed. We do not provide prorated refunds for partial months or unused platform allowances.</li>
                  <li><strong>Consumed Message Credits:</strong> Any messaging charges or third-party API costs already consumed are non-refundable.</li>
                </ul>
              </section>

              {/* Section 11 */}
              <section className="legal-section" id="section-11">
                <div className="legal-section-title">
                  <span className="legal-section-num">11</span>
                  Customer Data Ownership & Intellectual Property
                </div>
                <p className="legal-text">
                  <strong>Your Data:</strong> You retain 100% full ownership, title, and copyright in and to all contact records, uploaded files, message text, media assets, and customer communications stored in your workspace.
                </p>
                <p className="legal-text">
                  <strong>Aiveexa IP:</strong> Aiveexa and its licensors retain exclusive ownership of the platform software, source code, visual design, user interfaces, branding, logos, documentation, and all related intellectual property rights. You are granted a non-exclusive, non-transferable, revocable license to access the SaaS during your paid subscription.
                </p>
              </section>

              {/* Section 12 */}
              <section className="legal-section" id="section-12">
                <div className="legal-section-title">
                  <span className="legal-section-num">12</span>
                  Acceptable Use Policy & Prohibited Conduct
                </div>
                <p className="legal-text">
                  You agree that you will NOT under any circumstances:
                </p>
                <ul className="legal-list">
                  <li>Decompile, disassemble, decrypt, reverse engineer, or attempt to extract the source code of the platform.</li>
                  <li>Transmit unsolicited commercial broadcasts (spam), phishing campaigns, or fraudulent promotions.</li>
                  <li>Bypass or tamper with multi-tenant workspace isolation boundaries, rate limits, or access controls.</li>
                  <li>Use automated web scrapers, bots, or extraction scripts without express written permission.</li>
                  <li>Sub-license, resell, lease, or rent the platform to third parties outside of authorized partner programs.</li>
                </ul>
              </section>

              {/* Section 13 */}
              <section className="legal-section" id="section-13">
                <div className="legal-section-title">
                  <span className="legal-section-num">13</span>
                  Third-Party Integrations & External Webhooks
                </div>
                <p className="legal-text">
                  The Services interface with third-party software including Meta Platforms, CRM providers, and external webhooks. Aiveexa is not responsible for the availability, uptime, policy enforcement, or data practices of third-party platforms.
                </p>
              </section>

              {/* Section 14 */}
              <section className="legal-section" id="section-14">
                <div className="legal-section-title">
                  <span className="legal-section-num">14</span>
                  Service Level & Platform Uptime
                </div>
                <p className="legal-text">
                  We strive to maintain an operational service uptime of <strong>99.9%</strong>. However, scheduled maintenance, emergency security patches, or telecommunication outages outside our reasonable control may temporarily impact availability. We provide advance notification for scheduled maintenance whenever practicable.
                </p>
              </section>

              {/* Section 15 */}
              <section className="legal-section" id="section-15">
                <div className="legal-section-title">
                  <span className="legal-section-num">15</span>
                  Disclaimers & Warranties
                </div>
                <p className="legal-text">
                  THE SERVICES ARE PROVIDED ON AN <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE"</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
                <p className="legal-text">
                  AIVEEXA DOES NOT GUARANTEE THAT META WILL APPROVE ANY SPECIFIC MESSAGE TEMPLATES, MAINTAIN ANY SPECIFIC WHATSAPP QUALITY RATING, OR REFRAIN FROM ENFORCING ACCOUNT RESTRICTIONS CAUSED BY CUSTOMER POLICY INFRACTIONS.
                </p>
              </section>

              {/* Section 16 */}
              <section className="legal-section" id="section-16">
                <div className="legal-section-title">
                  <span className="legal-section-num">16</span>
                  Limitation of Liability
                </div>
                <p className="legal-text">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AIVEEXA, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITY).
                </p>
                <p className="legal-text">
                  OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO AIVEEXA IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                </p>
              </section>

              {/* Section 17 */}
              <section className="legal-section" id="section-17">
                <div className="legal-section-title">
                  <span className="legal-section-num">17</span>
                  Indemnification
                </div>
                <p className="legal-text">
                  You agree to defend, indemnify, and hold harmless Aiveexa, its subsidiaries, affiliates, officers, and employees from and against any claims, liabilities, damages, losses, or legal expenses arising out of:
                </p>
                <ul className="legal-list">
                  <li>Your violation of these Terms or Meta’s WhatsApp Business Policies.</li>
                  <li>Your broadcast of unsolicited messages, spam, or non-compliant communications.</li>
                  <li>Any infringement or violation by your user content of third-party privacy, copyright, or intellectual property rights.</li>
                </ul>
              </section>

              {/* Section 18 */}
              <section className="legal-section" id="section-18">
                <div className="legal-section-title">
                  <span className="legal-section-num">18</span>
                  Suspension & Termination
                </div>
                <p className="legal-text">
                  We reserve the right to immediately suspend or terminate your account without notice if:
                </p>
                <ul className="legal-list">
                  <li>You engage in spamming, abusive messaging, or blatant violation of Meta policies.</li>
                  <li>Your payment fails and remains overdue following reminder notifications.</li>
                  <li>Your usage poses a security threat or operational hazard to other multi-tenant customers.</li>
                </ul>
                <p className="legal-text">
                  Upon termination, your right to access the Services ceases immediately. You may request an export of your contact data within 14 days of account closure.
                </p>
              </section>

              {/* Section 19 */}
              <section className="legal-section" id="section-19">
                <div className="legal-section-title">
                  <span className="legal-section-num">19</span>
                  Governing Law & Dispute Resolution
                </div>
                <p className="legal-text">
                  These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any legal dispute or claim arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts of Gurugram / New Delhi, India.
                </p>
              </section>

              {/* Section 20 */}
              <section className="legal-section" id="section-20">
                <div className="legal-section-title">
                  <span className="legal-section-num">20</span>
                  Contact Information
                </div>
                <p className="legal-text">
                  If you have any questions or require clarification regarding these Terms of Service, please reach out to our legal and customer operations team:
                </p>
                <div className="p-4 bg-light rounded-3 border">
                  <div className="fw-bold text-dark fs-6 mb-2">Aiveexa Legal Department</div>
                  <div className="text-secondary small mb-1">
                    <strong>Official Platform Domain:</strong>{' '}
                    <a href="https://aiveexa.com" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                      https://aiveexa.com
                    </a>
                  </div>
                  <div className="text-secondary small mb-1">
                    <strong>Legal & Support Email:</strong>{' '}
                    <a href="mailto:support@aiveexa.com" className="text-primary text-decoration-none fw-medium">
                      support@aiveexa.com
                    </a>
                  </div>
                  <div className="text-secondary small mb-0">
                    <strong>Business Hours:</strong> Monday through Friday, 9:00 AM – 6:00 PM IST
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
