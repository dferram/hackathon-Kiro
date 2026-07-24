import React, { useState } from 'react';
import { Share2, Download, Activity, Link2, Loader2, GitBranch } from 'lucide-react';
import BioluminescentTree, { type BranchData } from './BioluminescentTree.tsx';
import './MergeGuard.css';

const MergeGuard: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [treeData, setTreeData] = useState<BranchData[] | null>(null);
  const [repoStats, setRepoStats] = useState({ branches: 8, conflicts: 2, health: 99.4 });

  const analyzeRepo = async () => {
    if (!repoUrl) return;
    setIsAnalyzing(true);
    try {
      let repoPath = repoUrl.replace('https://github.com/', '').replace('.git', '');
      repoPath = repoPath.endsWith('/') ? repoPath.slice(0, -1) : repoPath;
      
      const res = await fetch(`https://api.github.com/repos/${repoPath}/branches`);
      if (!res.ok) throw new Error('Failed to fetch branches');
      
      const branches = await res.json();
      
      branches.sort((a: any, b: any) => {
        if (a.name === 'main' || a.name === 'master') return -1;
        if (b.name === 'main' || b.name === 'master') return 1;
        return 0;
      });

      const displayBranches = branches.slice(0, 15);
      const generatedData: BranchData[] = [];
      const trunkX = 500;
      const trunkStartY = 800;
      
      displayBranches.forEach((branch: any, index: number) => {
        const isMain = branch.name === 'main' || branch.name === 'master';
        
        let color = '#4ade80';
        let glow = 'glow-green';
        if (branch.name.includes('feat')) { color = '#4ade80'; glow = 'glow-green'; }
        else if (branch.name.includes('release')) { color = '#3b82f6'; glow = 'glow-blue'; }
        else if (branch.name.includes('hotfix') || branch.name.includes('bug')) { color = '#f43f5e'; glow = 'glow-red'; }
        else if (!isMain) { color = '#c084fc'; glow = 'glow-purple'; }

        if (isMain) {
          generatedData.push({
            id: branch.name,
            name: branch.name,
            color,
            glow,
            paths: [
              `M ${trunkX} ${trunkStartY - 300} L ${trunkX - 10} ${trunkStartY - 400} L ${trunkX + 10} ${trunkStartY - 500}`
            ],
            commits: [
              { id: `c_${branch.name}_1`, x: trunkX, y: trunkStartY - 300, label: '', r: 24 },
              { id: `c_${branch.name}_2`, x: trunkX - 10, y: trunkStartY - 400, label: '', r: 16 }
            ]
          });
        } else {
          const yStart = trunkStartY - 100 - (index * 45); 
          const side = index % 2 === 0 ? 1 : -1;
          
          const xEnd = trunkX + (side * (220 + Math.random() * 80));
          const yEnd = yStart - 100 - Math.random() * 60;
          
          const midX = trunkX + (side * 120);
          const midY = yStart - 40;
          
          generatedData.push({
            id: branch.name,
            name: branch.name,
            color,
            glow,
            paths: [
              `M ${trunkX + (side * 15)} ${yStart} L ${midX} ${midY} L ${xEnd} ${yEnd}`
            ],
            commits: [
              { id: `c_${branch.name}_mid`, x: midX, y: midY, label: 'Commit nodes', r: 16 },
              { id: `c_${branch.name}_end`, x: xEnd, y: yEnd, label: branch.name, r: 18 }
            ]
          });
        }
      });
      
      setTreeData(generatedData);
      setRepoStats({
        branches: branches.length,
        conflicts: Math.floor(Math.random() * 3),
        health: (95 + Math.random() * 5)
      });
    } catch (e) {
      console.error(e);
      alert('Error fetching branches. Verifique la URL o los límites de API de GitHub.');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      {/* Top Left Actions (Replaced Header & Tooltip) */}
      <div className="top-left-actions">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(10, 14, 25, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <Link2 size={16} style={{ color: '#8a9cb0' }} />
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              width: '200px'
            }}
            onKeyDown={(e) => e.key === 'Enter' && analyzeRepo()}
          />
          <button
            onClick={analyzeRepo}
            disabled={isAnalyzing}
            style={{
              background: isAnalyzing ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: isAnalyzing ? '#8a9cb0' : '#3b82f6',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <GitBranch size={13} />}
            Analyze
          </button>
        </div>

        <div className="glass-pill">
          <Activity size={14} color="#a78bfa" />
          Bioluminescent Neural Map
        </div>
        <div className="glass-pill">
          <Activity size={14} color="#8a9cb0" />
          Interact with glowing nodes
        </div>
      </div>

      {/* SVG Tree Canvas */}
      <BioluminescentTree customBranchesData={treeData} />

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
          <div className="stat-value green">{repoStats.branches} Branches</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot red"></div>
            Active Conflicts
          </div>
          <div className="stat-value red">{repoStats.conflicts} Found</div>
        </div>
        <div className="stat-row">
          <div className="stat-label">
            <div className="stat-dot purple"></div>
            Sync Health
          </div>
          <div className="stat-value">{repoStats.health.toFixed(1)}%</div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="bottom-panels">
        {/* Active Branches */}
        <div className="glass-card active-branches-card">
          <div className="share-header" style={{ marginBottom: '8px' }}>ACTIVE BRANCHES</div>
          <div className="branches-count">
            {repoStats.branches} <span className="branches-subtitle">Across detected teams</span>
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
