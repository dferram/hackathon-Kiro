import React, { useState } from 'react'
import {
  Sparkles,
  FileCode,
  GitBranch,
  Check,
  X,
  Search,
  Filter,
  ArrowLeft,
  FileText,
  Activity
} from 'lucide-react'
import './DeepLint.css'

// ── Demo file data ──────────────────────────────────────────
export interface FileEntry {
  name: string
  hasSuggestion: boolean
  source: SourceLine[]
  optimized: SourceLine[]
  filePath: string
  metrics: {
    complexity: number
    aiOptimized: number
    securityScore: number
    executionSpeed: string
  }
  suggestion: string
}

interface SourceLine {
  text: string
  highlight?: 'added' | 'removed' | 'normal'
}

export const demoFiles: FileEntry[] = [
  {
    name: 'validate.ts',
    hasSuggestion: true,
    filePath: 'main/src/auth/validate.ts',
    metrics: { complexity: 12, aiOptimized: 4, securityScore: 88, executionSpeed: '14ms' },
    suggestion: 'Refactoring reduces cyclomatic complexity by 24%',
    source: [
      { text: 'function validateSession(user:User) {' },
      { text: '  const s =getSession(user.id);' },
      { text: '  if(s === null || s === undefined) {', highlight: 'removed' },
      { text: '    return false;', highlight: 'removed' },
      { text: '  }' },
      { text: '' },
      { text: '  const isExpired =Date.now() > s.expiresAt;' },
      { text: '  if(isExpired)removeSession(s.id);', highlight: 'removed' },
      { text: '  return !isExpired;' },
      { text: '}' },
    ],
    optimized: [
      { text: 'export const validateSession= (user:User):boolean=> {', highlight: 'added' },
      { text: '  const session =getSession(user.id);' },
      { text: '  if(!session) return false;', highlight: 'added' },
      { text: '  const isExpired =Date.now() > session.expiresAt;', highlight: 'added' },
      { text: '' },
      { text: '  if(isExpired) {' },
      { text: '    removeSession(session.id);', highlight: 'added' },
      { text: '    return false;', highlight: 'added' },
      { text: '  }' },
      { text: '' },
      { text: '  return true;', highlight: 'added' },
      { text: '};' },
    ],
  },
  {
    name: 'auth.ts',
    hasSuggestion: false,
    filePath: 'main/src/auth/auth.ts',
    metrics: { complexity: 8, aiOptimized: 2, securityScore: 92, executionSpeed: '8ms' },
    suggestion: 'Token refresh logic can be simplified',
    source: [
      { text: 'import { jwt } from "./jwt";' },
      { text: '' },
      { text: 'export function authenticate(token: string) {' },
      { text: '  try {' },
      { text: '    const payload = jwt.verify(token);' },
      { text: '    if (payload.exp < Date.now()) {' },
      { text: '      throw new Error("Token expired");' },
      { text: '    }' },
      { text: '    return { valid: true, user: payload.sub };' },
      { text: '  } catch (e) {' },
      { text: '    return { valid: false, user: null };' },
      { text: '  }' },
      { text: '}' },
    ],
    optimized: [
      { text: 'import { jwt } from "./jwt";', highlight: 'added' },
      { text: '' },
      { text: 'export const authenticate = (token: string) => {', highlight: 'added' },
      { text: '  const payload = jwt.safeParse(token);', highlight: 'added' },
      { text: '' },
      { text: '  if (!payload.ok || payload.data.exp < Date.now()) {' },
      { text: '    return { valid: false, user: null };' },
      { text: '  }' },
      { text: '' },
      { text: '  return { valid: true, user: payload.data.sub };', highlight: 'added' },
      { text: '};' },
    ],
  },
  {
    name: 'api.ts',
    hasSuggestion: true,
    filePath: 'main/src/services/api.ts',
    metrics: { complexity: 15, aiOptimized: 6, securityScore: 79, executionSpeed: '22ms' },
    suggestion: 'Error handling can be consolidated with a shared handler',
    source: [
      { text: 'async function fetchUser(id: string) {' },
      { text: '  const res = await fetch(`/api/users/${id}`);' },
      { text: '  if (!res.ok) {', highlight: 'removed' },
      { text: '    console.error("Failed to fetch user");', highlight: 'removed' },
      { text: '    return null;', highlight: 'removed' },
      { text: '  }', highlight: 'removed' },
      { text: '  return res.json();' },
      { text: '}' },
      { text: '' },
      { text: 'async function fetchOrders(userId: string) {' },
      { text: '  const res = await fetch(`/api/orders?uid=${userId}`);' },
      { text: '  if (!res.ok) {', highlight: 'removed' },
      { text: '    console.error("Failed to fetch orders");', highlight: 'removed' },
      { text: '    return [];', highlight: 'removed' },
      { text: '  }', highlight: 'removed' },
      { text: '  return res.json();' },
      { text: '}' },
    ],
    optimized: [
      { text: 'const safeFetch = async <T>(url: string, fallback: T): Promise<T> => {', highlight: 'added' },
      { text: '  const res = await fetch(url);', highlight: 'added' },
      { text: '  if (!res.ok) return fallback;', highlight: 'added' },
      { text: '  return res.json();', highlight: 'added' },
      { text: '};', highlight: 'added' },
      { text: '' },
      { text: 'export const fetchUser = (id: string) =>' },
      { text: '  safeFetch(`/api/users/${id}`, null);', highlight: 'added' },
      { text: '' },
      { text: 'export const fetchOrders = (userId: string) =>' },
      { text: '  safeFetch(`/api/orders?uid=${userId}`, []);', highlight: 'added' },
    ],
  },
  {
    name: 'utils.ts',
    hasSuggestion: false,
    filePath: 'main/src/lib/utils.ts',
    metrics: { complexity: 5, aiOptimized: 1, securityScore: 95, executionSpeed: '3ms' },
    suggestion: 'Minor improvements to type safety',
    source: [
      { text: 'export function formatDate(d: Date): string {' },
      { text: '  const year = d.getFullYear();' },
      { text: '  const month = String(d.getMonth() + 1).padStart(2, "0");' },
      { text: '  const day = String(d.getDate()).padStart(2, "0");' },
      { text: '  return `${year}-${month}-${day}`;' },
      { text: '}' },
      { text: '' },
      { text: 'export function debounce(fn: Function, ms: number) {' },
      { text: '  let timer: any;' },
      { text: '  return (...args: any[]) => {' },
      { text: '    clearTimeout(timer);' },
      { text: '    timer = setTimeout(() => fn(...args), ms);' },
      { text: '  };' },
      { text: '}' },
    ],
    optimized: [
      { text: 'export const formatDate = (d: Date): string => {', highlight: 'added' },
      { text: '  const year = d.getFullYear();' },
      { text: '  const month = String(d.getMonth() + 1).padStart(2, "0");' },
      { text: '  const day = String(d.getDate()).padStart(2, "0");' },
      { text: '  return `${year}-${month}-${day}`;' },
      { text: '};' },
      { text: '' },
      { text: 'export const debounce = <T extends (...a: unknown[]) => void>(', highlight: 'added' },
      { text: '  fn: T,', highlight: 'added' },
      { text: '  ms: number', highlight: 'added' },
      { text: ') => {', highlight: 'added' },
      { text: '  let timer: ReturnType<typeof setTimeout>;', highlight: 'added' },
      { text: '  return (...args: Parameters<T>) => {' },
      { text: '    clearTimeout(timer);' },
      { text: '    timer = setTimeout(() => fn(...args), ms);' },
      { text: '  };' },
      { text: '};' },
    ],
  },
]


// ══════════════════════════════════════════════════════════════
// DeepLint SIDEBAR (renders inside the master left sidebar)
// ══════════════════════════════════════════════════════════════
export function DeepLintSidebar({
  selectedFileIdx,
  setSelectedFileIdx,
  repoUrl,
  setRepoUrl,
  onAnalyze,
  onNavigateHome,
}: {
  selectedFileIdx: number
  setSelectedFileIdx: (idx: number) => void
  repoUrl: string
  setRepoUrl: (url: string) => void
  onAnalyze: () => void
  onNavigateHome: () => void
}) {
  return (
    <div className="left-sidebar" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', borderRight: 'none' }}>

      {/* Header — back arrow + title */}
      <div className="master-sidebar-logo-group" style={{ cursor: 'pointer', borderBottom: '1px solid #131924' }} onClick={onNavigateHome}>
        <ArrowLeft size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
        <div className="master-logo-text-group">
          <span className="master-logo-text" style={{ fontSize: '13px' }}>DeepLint</span>
          <span className="master-logo-sub">code optimization</span>
        </div>
      </div>

      <div className="sidebar-top" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>

        {/* Explorer card */}
        <div className="explorer-card" style={{ marginBottom: '4px' }}>
          <div className="explorer-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Sparkles size={16} />
          </div>
          <div className="explorer-info">
            <h3>AI Analyzer</h3>
            <p>Structural &amp; perf refactoring</p>
          </div>
        </div>

        {/* ── Repository Selector (ABOVE File Explorer) ──── */}
        <div className="deeplint-sidebar-repo-section">
          <span className="sidebar-list-title">Choose Repository</span>
          <div className="deeplint-sidebar-repo-input-row">
            <input
              className="deeplint-sidebar-repo-input"
              type="text"
              placeholder="github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAnalyze() }}
            />
            <button
              className="deeplint-sidebar-analyze-btn"
              onClick={onAnalyze}
              disabled={!repoUrl.trim()}
              title="Analyze"
            >
              <Search size={13} />
            </button>
          </div>
        </div>

        {/* ── File Explorer ──────────────────────────────── */}
        <div className="sidebar-menu" style={{ padding: 0, marginTop: '8px' }}>
          <div className="menu-item active">
            <Filter size={14} />
            FILE EXPLORER
          </div>
        </div>

        <div className="sidebar-content-area" style={{ flex: 1, overflowY: 'auto' }}>
          <span className="sidebar-list-title">Files ({demoFiles.length})</span>
          {demoFiles.map((file, idx) => (
            <div
              key={file.name}
              className={`sidebar-list-item ${selectedFileIdx === idx ? 'selected' : ''}`}
              onClick={() => setSelectedFileIdx(idx)}
            >
              <span className="sidebar-item-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={12} style={{ color: '#38bdf8' }} />
                {file.name}
              </span>
              {file.hasSuggestion ? (
                <span style={{
                  fontSize: '8px',
                  fontWeight: 600,
                  color: '#10b981',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  whiteSpace: 'nowrap',
                }}>
                  AI Suggestion
                </span>
              ) : (
                <span className="sidebar-item-meta">{file.source.length} ln</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="master-sidebar-footer" style={{ borderTop: '1px solid #131924' }}>
        <div className="master-footer-item">
          <FileText size={13} /><span>DOCS</span>
        </div>
        <div className="master-footer-item">
          <Activity size={13} /><span>STATUS</span>
        </div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
// DeepLint VIEW (renders in the main content area)
// ══════════════════════════════════════════════════════════════
export function DeepLintView({
  selectedFileIdx,
}: {
  selectedFileIdx: number
}) {
  const [showDialog, setShowDialog] = useState(true)
  const [acceptedFiles, setAcceptedFiles] = useState<Set<number>>(new Set())

  const currentFile = demoFiles[selectedFileIdx]

  // Reset dialog when file changes
  React.useEffect(() => {
    if (!acceptedFiles.has(selectedFileIdx)) {
      setShowDialog(true)
    }
  }, [selectedFileIdx, acceptedFiles])

  const handleAccept = () => {
    setAcceptedFiles(prev => new Set(prev).add(selectedFileIdx))
    setShowDialog(false)
  }

  const handleDecline = () => {
    setShowDialog(false)
  }

  // Render a code line with basic syntax highlighting
  const renderCodeContent = (text: string) => {
    const tokens: React.ReactNode[] = []
    let remaining = text
    let key = 0

    const patterns: Array<{ regex: RegExp; className: string }> = [
      { regex: /^(\/\/.*)/, className: 'dl-comment' },
      { regex: /\b(function|const|let|var|return|if|else|export|import|from|async|await|try|catch|throw|new|typeof)\b/, className: 'dl-keyword' },
      { regex: /\b(string|number|boolean|void|null|undefined|any|Date|Error|Promise|Function)\b/i, className: 'dl-type' },
      { regex: /\b(true|false)\b/, className: 'dl-boolean' },
      { regex: /(["'`])(?:(?!\1|\\).|\\.)*\1/, className: 'dl-string' },
      { regex: /\b(\d+)\b/, className: 'dl-number' },
      { regex: /([a-zA-Z_]\w*)\s*(?=\()/, className: 'dl-function' },
    ]

    while (remaining.length > 0) {
      let earliest: { index: number; length: number; className: string } | null = null

      for (const { regex, className } of patterns) {
        const match = remaining.match(regex)
        if (match && match.index !== undefined) {
          if (!earliest || match.index < earliest.index) {
            earliest = { index: match.index, length: match[0].length, className }
          }
        }
      }

      if (earliest && earliest.index < remaining.length) {
        if (earliest.index > 0) {
          tokens.push(<span key={key++} className="dl-property">{remaining.slice(0, earliest.index)}</span>)
        }
        tokens.push(
          <span key={key++} className={earliest.className}>
            {remaining.slice(earliest.index, earliest.index + earliest.length)}
          </span>
        )
        remaining = remaining.slice(earliest.index + earliest.length)
      } else {
        tokens.push(<span key={key++} className="dl-property">{remaining}</span>)
        break
      }
    }

    return tokens
  }

  return (
    <div className="deeplint-container">
      {/* ── Top Sub-header (Blueprint-style) ────────────── */}
      <div className="blueprint-sub-header">
        <div className="sub-header-left">
          <span className="workspace-title-label">
            <Sparkles size={13} style={{ marginRight: '6px', verticalAlign: '-2px' }} />
            DeepLint – Code Optimization / {currentFile.name}
          </span>
        </div>
        <div className="sub-header-right">
          <span style={{ fontSize: '11px', color: '#64748b' }}>Real-time AI-powered structural analysis and performance refactoring</span>
        </div>
      </div>

      {/* ── Code Area ──────────────────────────────────── */}
      <div className="deeplint-body" style={{ flex: 1 }}>
        <div className="deeplint-code-area">
          {/* ── Code Panels ─────────────────────────── */}
          <div className="deeplint-code-panels">
            {/* Source Panel */}
            <div className="deeplint-code-panel">
              <div className="deeplint-panel-header">
                <div>
                  <div className="deeplint-panel-title">
                    <GitBranch size={13} />
                    GitHub Source
                  </div>
                  <div className="deeplint-panel-filepath">{currentFile.filePath}</div>
                </div>
              </div>
              <div className="deeplint-code-block">
                <pre>
                  {currentFile.source.map((line, idx) => (
                    <div
                      key={idx}
                      className={`deeplint-code-line ${line.highlight === 'removed' ? 'removed' : ''}`}
                    >
                      <span className="deeplint-line-number">{idx + 1}</span>
                      <span className="deeplint-line-content">
                        {renderCodeContent(line.text)}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {/* Optimized Panel */}
            <div className="deeplint-code-panel">
              <div className="deeplint-panel-header">
                <div>
                  <div className="deeplint-panel-title">
                    <Sparkles size={13} />
                    DeepLint AI
                  </div>
                </div>
                <div className="deeplint-panel-badges">
                  <span className="deeplint-badge-optimized">Optimized</span>
                  <span className="deeplint-badge-refactored">Refactored Output</span>
                </div>
              </div>
              <div className="deeplint-code-block">
                <pre>
                  {currentFile.optimized.map((line, idx) => (
                    <div
                      key={idx}
                      className={`deeplint-code-line ${line.highlight === 'added' ? 'highlighted' : ''}`}
                    >
                      <span className="deeplint-line-number">{idx + 1}</span>
                      <span className="deeplint-line-content">
                        {renderCodeContent(line.text)}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>

          {/* ── Changes Dialog ──────────────────────── */}
          {showDialog && !acceptedFiles.has(selectedFileIdx) && (
            <div className="deeplint-dialog-overlay">
              <div className="deeplint-dialog" style={{ position: 'relative' }}>
                <div className="deeplint-dialog-icon">
                  <Check size={18} />
                </div>
                <div className="deeplint-dialog-content">
                  <div className="deeplint-dialog-title">Allow changes?</div>
                  <div className="deeplint-dialog-desc">{currentFile.suggestion}</div>
                </div>
                <div className="deeplint-dialog-actions">
                  <button className="deeplint-btn-decline" onClick={handleDecline}>
                    Decline
                  </button>
                  <button className="deeplint-btn-accept" onClick={handleAccept}>
                    <Check size={14} />
                    Accept
                  </button>
                </div>
                <button className="deeplint-dialog-close" onClick={handleDecline}>
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Metrics Bar ─────────────────────────── */}
      <div className="deeplint-metrics-bar">
        <div className="deeplint-metric-card">
          <span className="deeplint-metric-label">Complexity</span>
          <div className="deeplint-metric-value-row">
            <span className="deeplint-metric-value red">{currentFile.metrics.complexity}</span>
            <div className="deeplint-metric-indicator">
              <svg className="deeplint-sparkline" viewBox="0 0 48 18" fill="none">
                <polyline
                  points="0,14 8,10 16,12 24,6 32,9 40,4 48,8"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="deeplint-metric-card">
          <span className="deeplint-metric-label">AI Optimized</span>
          <div className="deeplint-metric-value-row">
            <span className="deeplint-metric-value green">{currentFile.metrics.aiOptimized}</span>
            <div className="deeplint-metric-indicator">
              <svg className="deeplint-sparkline" viewBox="0 0 48 18" fill="none">
                <polyline
                  points="0,14 8,12 16,10 24,8 32,6 40,4 48,2"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="deeplint-metric-card">
          <span className="deeplint-metric-label">Security Score</span>
          <div className="deeplint-metric-value-row">
            <span className="deeplint-metric-value blue">{currentFile.metrics.securityScore}/100</span>
            <div className="deeplint-progress-bar">
              <div
                className="deeplint-progress-fill blue"
                style={{ width: `${currentFile.metrics.securityScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="deeplint-metric-card">
          <span className="deeplint-metric-label">Execution Speed</span>
          <div className="deeplint-metric-value-row">
            <span className="deeplint-metric-value cyan">{currentFile.metrics.executionSpeed}</span>
            <div className="deeplint-toggle-track">
              <div className="deeplint-toggle-thumb" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeepLintView
