import React from 'react';
import { Outlet } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import '../styles/login.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="text-center mb-4">
              <img
                src={logoImg}
                alt="Aiveexa"
                style={{ height: '52px', width: 'auto', maxWidth: '220px', objectFit: 'contain' }}
                className="mb-2"
              />
              <p className="text-muted small mb-0">Automate • Engage • Grow</p>
            </div>
            
            <div className="card auth-card">
              <div className="card-body p-4 p-md-5">
                <Outlet />
              </div>
            </div>

            <div className="text-center mt-4 text-muted small">
              &copy; {new Date().getFullYear()} Aiveexa. All rights reserved. Cloud API Compliant.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
