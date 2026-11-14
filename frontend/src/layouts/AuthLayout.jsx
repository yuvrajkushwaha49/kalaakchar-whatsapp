import React from 'react';
import { Outlet } from 'react-router-dom';
import '../styles/login.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="text-center mb-4">
              <div className="auth-logo-badge">
                <i className="bi bi-whatsapp text-white fs-2"></i>
              </div>
              <h2 className="brand-font text-white mb-1">CampaignFlow</h2>
              <p className="text-muted small">Official WhatsApp Business Marketing Automation</p>
            </div>
            
            <div className="card auth-card">
              <div className="card-body p-4 p-md-5">
                <Outlet />
              </div>
            </div>

            <div className="text-center mt-4 text-muted small">
              &copy; {new Date().getFullYear()} CampaignFlow SaaS. Cloud API v21.0 Compliant.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
