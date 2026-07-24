import React from 'react';
import { Share2, Download, ChevronDown, Activity } from 'lucide-react';
import BioluminescentTree from './BioluminescentTree';
import './MergeGuard.css';

const MergeGuard: React.FC = () => {
  return (
    <div className="mergeguard-container">
      {/* Background SVG filters */}
      <svg width="0" height="0">
        <defs>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="10" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Header */}
      <header className="mergeguard-header">
        <div className="header-titles">
          <h1 className="header-title">Bandwidth - Bio-Digital Evolution</h1>
          <p className="header-subtitle">Real-time repository architecture and branch lifecycle visualization.</p>
        </div>
        <div className="repo-selector">
          infrastructure-core-v2
          <ChevronDown size={16} color="#8a9cb0" />
        </div>
      </header>

      {/* SVG Tree Canvas */}
      <BioluminescentTree />

      {/* Tooltip Overlay */}
      <div className="tree-tooltip" style={{ position: 'absolute', top: '150px', right: '150px', background: 'rgba(10, 14, 25, 0.8)', border: '1px solid rgba(167, 139, 250, 0.3)', padding: '16px', borderRadius: '12px', backdropFilter: 'blur(10px)', color: '#fff', zIndex: 10 }}>
        <div className="tooltip-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          <Activity size={16} color="#a78bfa" />
          Bioluminescent Neural Map
        </div>
        <div className="tooltip-action" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8a9cb0', opacity: 0.8 }}>
          <Activity size={14} />
          Interact with glowing nodes
        </div>
      </div>

      {/* Share Card */}
      <div className="glass-card share-card">
        <div className="share-header">
          SHARE GROWTH
          <Share2 size={14} />
        </div>
        <button className="action-button">
          <Activity size={16} /> Post to X
        </button>
        <button className="action-button">
          <Download size={16} /> Export SVG
        </button>
      </div>

      {/* Snapshot Card */}
      <div className="glass-card snapshot-card">
        <div className="snapshot-header">
          LIVE SNAPSHOT
          <div className="status-dot"></div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot green"></div>
            Active Development
          </div>
          <div className="stat-value green">8 Branches</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot red"></div>
            Active Conflicts
          </div>
          <div className="stat-value red">2 Found</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot purple"></div>
            Sync Health
          </div>
          <div className="stat-value">99.4%</div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="bottom-panels">
        {/* Active Branches */}
        <div className="glass-card active-branches-card">
          <div className="share-header" style={{ marginBottom: '8px' }}>ACTIVE BRANCHES</div>
          <div className="branches-count">
            12 <span className="branches-subtitle">Across 4 teams</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="glass-card contributors-card">
          <div className="contributors-header">
            Top Contributors
            <span className="full-breakdown">Full Breakdown</span>
          </div>
          <div className="contributors-list">
            <div className="contributor">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=a042581f4e29026704d)' }}></div>
              <div className="contributor-info">
                <span className="contributor-name">Alex Rivera</span>
                <span className="contributor-commits">128</span>
              </div>
            </div>
            <div className="contributor">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=a042581f4e29026703d)' }}></div>
              <div className="contributor-info">
                <span className="contributor-name">Sarah Chen</span>
                <span className="contributor-commits">94</span>
              </div>
            </div>
            <div className="contributor">
              <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/150?u=a042581f4e29026702d)' }}></div>
              <div className="contributor-info">
                <span className="contributor-name">Marco Rossi</span>
                <span className="contributor-commits">76</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergeGuard;
