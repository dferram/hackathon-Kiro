import React from 'react'
import logoImg from '../../logo/logo.jpeg'

interface ForgotPasswordProps {
  authInputs: any
  setAuthInputs: React.Dispatch<React.SetStateAction<any>>
  setAuthScreen: (screen: any) => void
  showNotification: (msg: string) => void
}

export default function ForgotPassword({
  authInputs,
  setAuthInputs,
  setAuthScreen,
  showNotification
}: ForgotPasswordProps) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo-wrapper">
          <div className="auth-logo">
            <img src={logoImg} alt="DevSync Logo" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
          </div>
          <div className="auth-logo-text">DevSync</div>
        </div>

        <div className="auth-header-info">
          <h1 className="auth-app-title">DevSync</h1>
          <p className="auth-app-subtitle" style={{ color: '#34d399' }}>
            <span className="footer-status-dot active" style={{ display: 'inline-block', marginRight: 6, transform: 'translateY(-1px)' }}></span>
            AUTH_PROTOCOL: RECOVERY_INITIATED
          </p>
        </div>

        <div className="auth-card">
          <h2 className="card-title-main">ForgotPassword</h2>
          <p className="card-desc-text">
            Enter your registered email address below. System-generated recovery instructions will be dispatched to your inbox.
          </p>

          <div className="auth-form-group">
            <label className="auth-label">EMAIL ADDRESS</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon" style={{ left: '12px', fontSize: '13px', color: '#4b5563' }}>@</span>
              <input 
                type="email" 
                placeholder="admin@infrastructure.io" 
                className="auth-input"
                value={authInputs.username}
                onChange={(e) => setAuthInputs((prev: any) => ({ ...prev, username: e.target.value }))}
              />
            </div>
          </div>

          <button 
            className="btn-auth-primary" 
            onClick={() => {
              showNotification('Recovery instructions sent to email!')
              setAuthScreen('login')
            }}
          >
            <span style={{ marginRight: 6 }}>➔</span> Send Recovery Link
          </button>
        </div>

        <p className="auth-footer-text">
          <span className="auth-link-back" onClick={() => { setAuthScreen('login') }}>← Back to Login</span>
        </p>

        <div className="auth-page-footer-split">
          <div className="footer-split-left">
            <span>ENCRYPTION</span>
            <span className="footer-split-val">AES-256-GCM_ACTIVE</span>
          </div>
          <div className="footer-split-right">
            <span>INSTANCE ID</span>
            <span className="footer-split-val">NODE_742_X_DEV</span>
          </div>
        </div>
      </div>
    </div>
  )
}
