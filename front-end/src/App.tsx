import React, { useState, useRef } from 'react'
import {
  Database,
  Plus,
  Search,
  Settings,
  Share2,
  Download,
  Key,
  Link2,
  X,
  Code,
  Copy,
  Check,
  FileText,
  Activity,
  Maximize2,
  Minimize2,
  Grid,
  Trash2,
  HelpCircle
} from 'lucide-react'
import './App.css'

interface Column {
  id: string
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyTargetTableId?: string
  foreignKeyTargetColumnId?: string
}

interface Table {
  id: string
  name: string
  comment: string
  x: number
  y: number
  columns: Column[]
}

export default function App() {
  // State for database schema
  const [tables, setTables] = useState<Table[]>([
    {
      id: 'users',
      name: 'Users',
      comment: 'Stores user accounts and registration data.',
      x: 120,
      y: 100,
      columns: [
        { id: 'u_id', name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false },
        { id: 'u_email', name: 'email', type: 'String', isPrimaryKey: false, isForeignKey: false },
        { id: 'u_created_at', name: 'created_at', type: 'Timestamp', isPrimaryKey: false, isForeignKey: false }
      ]
    },
    {
      id: 'orders',
      name: 'Orders',
      comment: 'Stores transactional record for user purchases across the marketplace platform.',
      x: 480,
      y: 200,
      columns: [
        { id: 'o_id', name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false },
        { id: 'o_user_id', name: 'user_id', type: 'UUID', isPrimaryKey: false, isForeignKey: true, foreignKeyTargetTableId: 'users', foreignKeyTargetColumnId: 'u_id' },
        { id: 'o_total', name: 'total', type: 'Decimal', isPrimaryKey: false, isForeignKey: false }
      ]
    }
  ])

  // UI state
  const [selectedTableId, setSelectedTableId] = useState<string | null>('orders')
  const [zoom, setZoom] = useState<number>(100)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [auditLogging, setAuditLogging] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [activeMenuTab, setActiveMenuTab] = useState<string>('TABLES')
  const [notification, setNotification] = useState<string | null>(null)

  // Dragging table node state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Column types options
  const columnTypes = ['UUID', 'String', 'Timestamp', 'Decimal', 'Integer', 'Boolean', 'Text', 'DateTime']

  // Find selected table
  const selectedTable = tables.find(t => t.id === selectedTableId)

  // Trigger brief alert notification
  const showNotification = (message: string) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle Canvas mouse events for panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-content')) {
      setIsPanning(true)
      panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      })
    } else if (draggingTableId) {
      const zoomFactor = zoom / 100
      setTables(prevTables =>
        prevTables.map(t =>
          t.id === draggingTableId
            ? {
                ...t,
                x: Math.max(20, Math.round((e.clientX - dragStart.current.x) / zoomFactor)),
                y: Math.max(20, Math.round((e.clientY - dragStart.current.y) / zoomFactor))
              }
            : t
        )
      )
    }
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
    setDraggingTableId(null)
  }

  // Handle Table dragging
  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation()
    setSelectedTableId(tableId)
    setDraggingTableId(tableId)
    const table = tables.find(t => t.id === tableId)
    if (table) {
      const zoomFactor = zoom / 100
      dragStart.current = {
        x: e.clientX - table.x * zoomFactor,
        y: e.clientY - table.y * zoomFactor
      }
    }
  }

  // Zoom management
  const zoomIn = () => setZoom(prev => Math.min(prev + 10, 150))
  const zoomOut = () => setZoom(prev => Math.max(prev - 10, 50))
  const resetZoom = () => setZoom(100)

  // Add Table
  const handleAddTable = () => {
    const newId = `table_${Date.now()}`
    const newTable: Table = {
      id: newId,
      name: `NewTable_${tables.length + 1}`,
      comment: 'Stores custom entity records.',
      x: Math.abs(panOffset.x) + 150,
      y: Math.abs(panOffset.y) + 150,
      columns: [
        { id: `c_${Date.now()}_1`, name: 'id', type: 'UUID', isPrimaryKey: true, isForeignKey: false }
      ]
    }
    setTables(prev => [...prev, newTable])
    setSelectedTableId(newId)
    showNotification('Created new table')
  }

  // Delete Table
  const handleDeleteTable = (tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId))
    if (selectedTableId === tableId) {
      setSelectedTableId(null)
    }
    showNotification('Table deleted')
  }

  // Add Column
  const handleAddColumn = () => {
    if (!selectedTableId) return
    setTables(prev =>
      prev.map(t => {
        if (t.id === selectedTableId) {
          const newCol: Column = {
            id: `c_${Date.now()}`,
            name: `column_${t.columns.length + 1}`,
            type: 'String',
            isPrimaryKey: false,
            isForeignKey: false
          }
          return {
            ...t,
            columns: [...t.columns, newCol]
          }
        }
        return t
      })
    )
  }

  // Update Column field
  const handleUpdateColumn = (columnId: string, updates: Partial<Column>) => {
    if (!selectedTableId) return
    setTables(prev =>
      prev.map(t => {
        if (t.id === selectedTableId) {
          return {
            ...t,
            columns: t.columns.map(c => (c.id === columnId ? { ...c, ...updates } : c))
          }
        }
        return t
      })
    )
  }

  // Delete Column
  const handleDeleteColumn = (columnId: string) => {
    if (!selectedTableId) return
    setTables(prev =>
      prev.map(t => {
        if (t.id === selectedTableId) {
          return {
            ...t,
            columns: t.columns.filter(c => c.id !== columnId)
          }
        }
        return t
      })
    )
  }

  // Update Table metadata
  const handleUpdateTableMeta = (updates: Partial<Table>) => {
    if (!selectedTableId) return
    setTables(prev =>
      prev.map(t => (t.id === selectedTableId ? { ...t, ...updates } : t))
    )
  }

  // Generate SQL for a single table
  const generateSQL = (table: Table) => {
    const colLines = table.columns.map(col => {
      let typeStr = col.type
      if (col.type === 'String') typeStr = 'VARCHAR(255)'
      if (col.type === 'Timestamp') typeStr = 'TIMESTAMP WITH TIME ZONE'
      if (col.type === 'Text') typeStr = 'TEXT'
      if (col.type === 'Decimal') typeStr = 'DECIMAL(10,2)'
      if (col.type === 'Integer') typeStr = 'INTEGER'
      if (col.type === 'Boolean') typeStr = 'BOOLEAN'
      if (col.type === 'DateTime') typeStr = 'TIMESTAMP'

      const pkStr = col.isPrimaryKey ? ' PRIMARY KEY' : ''
      return `  "${col.name}" ${typeStr}${pkStr}`
    })

    // Foreign Keys SQL constraints
    const fkLines = table.columns
      .filter(col => col.isForeignKey && col.foreignKeyTargetTableId)
      .map(col => {
        const targetTable = tables.find(t => t.id === col.foreignKeyTargetTableId)
        const targetCol = targetTable?.columns.find(c => c.id === col.foreignKeyTargetColumnId)
        if (targetTable && targetCol) {
          return `  FOREIGN KEY ("${col.name}") REFERENCES "${targetTable.name}" ("${targetCol.name}")`
        }
        return ''
      })
      .filter(line => line !== '')

    const allLines = [...colLines, ...fkLines].join(',\n')
    return `CREATE TABLE "${table.name}" (\n${allLines}\n);`
  }

  // Generate Full schema SQL script
  const generateFullSQL = () => {
    return tables.map(table => generateSQL(table)).join('\n\n')
  }

  // Copy SQL script to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    showNotification('SQL Script copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Export SQL file
  const handleExportScript = () => {
    const fullSql = generateFullSQL()
    const blob = new Blob([fullSql], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'schema.sql'
    link.click()
    URL.revokeObjectURL(url)
    showNotification('Downloaded schema.sql')
  }

  // Relations calculation helper to render visual lines
  const getRelationPoints = () => {
    const points: Array<{
      id: string
      path: string
      targetTableId: string
    }> = []

    tables.forEach(sourceTable => {
      sourceTable.columns.forEach((col, colIdx) => {
        if (col.isForeignKey && col.foreignKeyTargetTableId) {
          const targetTable = tables.find(t => t.id === col.foreignKeyTargetTableId)
          if (targetTable) {
            // Find target column index
            const targetColIdx = targetTable.columns.findIndex(c => c.id === col.foreignKeyTargetColumnId)
            const targetColIndex = targetColIdx === -1 ? 0 : targetColIdx

            // Height and row calculations
            const rowHeight = 35 // column row padding + height
            const headerHeight = 38 // table header height

            // Approximate position on canvas
            // Source (foreign key table) -> usually connects from left/right side
            // Target (primary key table) -> usually connects to left/right side
            // Determine left/right based on X coordinate comparison
            const sourceOnRight = sourceTable.x > targetTable.x

            const xSource = sourceTable.x + (sourceOnRight ? 0 : 210)
            const ySource = sourceTable.y + headerHeight + colIdx * rowHeight + rowHeight / 2

            const xTarget = targetTable.x + (sourceOnRight ? 210 : 0)
            const yTarget = targetTable.y + headerHeight + targetColIndex * rowHeight + rowHeight / 2

            // Curve parameter
            const offset = Math.abs(xSource - xTarget) / 2
            const cp1x = sourceOnRight ? xSource - offset : xSource + offset
            const cp2x = sourceOnRight ? xTarget + offset : xTarget - offset

            const path = `M ${xSource} ${ySource} C ${cp1x} ${ySource}, ${cp2x} ${yTarget}, ${xTarget} ${yTarget}`

            points.push({
              id: `${sourceTable.id}_${col.id}_to_${targetTable.id}`,
              path,
              targetTableId: targetTable.id
            })
          }
        }
      })
    })

    return points
  }

  const relationLines = getRelationPoints()

  // Filtered list of tables for search bar
  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="app-container">
      {/* Success Notification Alert */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e293b',
          color: '#38bdf8',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid #38bdf8',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 100,
          pointerEvents: 'none'
        }}>
          {notification}
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="top-header">
        <div className="header-left">
          <div className="logo-text">
            <Database className="logo-icon" size={20} />
            DataDraft
          </div>
          <div className="search-container">
            <Search className="search-icon-inside" size={14} />
            <input
              type="text"
              placeholder="Search tables..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <nav className="header-nav">
            <span className="nav-link active">Project</span>
            <span className="nav-link" onClick={() => showNotification('View options opened')}>View</span>
            <span className="nav-link" onClick={() => showNotification('Engine properties opened')}>Engine</span>
            <span className="nav-link" onClick={() => showNotification('Help documentation opened')}>Help</span>
          </nav>
        </div>

        <div className="header-right">
          <button className="icon-btn" title="Share Project" onClick={() => showNotification('Sharing link copied!')}>
            <Share2 size={16} />
          </button>
          <button className="icon-btn" title="Project Settings" onClick={() => showNotification('Settings menu')}>
            <Settings size={16} />
          </button>
          <button className="btn-secondary" onClick={() => showNotification('Project saved successfully!')}>
            Save
          </button>
          <button className="btn-primary" onClick={handleExportScript}>
            <Download size={15} />
            Export Script
          </button>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
            alt="Profile Avatar"
            className="profile-avatar"
          />
        </div>
      </header>

      {/* Workspace Area */}
      <div className="workspace-body">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          <div className="sidebar-top">
            <div className="explorer-card">
              <div className="explorer-icon-wrapper">
                <Database size={16} />
              </div>
              <div className="explorer-info">
                <h3>Schema Explorer</h3>
                <p>PostgreSQL v15</p>
              </div>
            </div>

            <button className="btn-new-table" onClick={handleAddTable}>
              <Plus size={14} />
              NEW TABLE
            </button>

            <div className="sidebar-menu">
              <div
                className={`menu-item ${activeMenuTab === 'TABLES' ? 'active' : ''}`}
                onClick={() => setActiveMenuTab('TABLES')}
              >
                <Grid size={14} />
                TABLES ({filteredTables.length})
              </div>
              <div
                className={`menu-item ${activeMenuTab === 'RELATIONS' ? 'active' : ''}`}
                onClick={() => setActiveMenuTab('RELATIONS')}
              >
                <Link2 size={14} />
                RELATIONS
              </div>
              <div
                className={`menu-item ${activeMenuTab === 'INDICES' ? 'active' : ''}`}
                onClick={() => setActiveMenuTab('INDICES')}
              >
                <Key size={14} />
                INDICES
              </div>
              <div
                className={`menu-item ${activeMenuTab === 'QUERIES' ? 'active' : ''}`}
                onClick={() => setActiveMenuTab('QUERIES')}
              >
                <Code size={14} />
                QUERIES
              </div>
            </div>
          </div>

          <div className="sidebar-bottom">
            <div className="bottom-link" onClick={() => showNotification('Opening documentation...')}>
              <FileText size={13} />
              DOCS
            </div>
            <div className="bottom-link" onClick={() => showNotification('Database Status: Connected')}>
              <Activity size={13} />
              STATUS
            </div>
          </div>
        </aside>

        {/* Editor Canvas */}
        <main
          className="canvas-grid"
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div
            className="canvas-content"
            style={{
              transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            {/* SVG Connection Lines */}
            <svg className="connections-svg">
              {relationLines.map((line) => (
                <path
                  key={line.id}
                  d={line.path}
                  className={`connection-line ${selectedTableId === line.targetTableId ? 'selected' : ''}`}
                />
              ))}
            </svg>

            {/* Displaying Tables */}
            {filteredTables.length === 0 ? (
              <div className="empty-canvas-message">
                <h2>No Tables Found</h2>
                <p>Click "+ NEW TABLE" to build database entities.</p>
              </div>
            ) : (
              filteredTables.map((table) => (
                <div
                  key={table.id}
                  className={`table-node ${selectedTableId === table.id ? 'selected' : ''}`}
                  style={{
                    left: `${table.x}px`,
                    top: `${table.y}px`,
                  }}
                  onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                >
                  <div className="table-node-header">
                    <span className="table-node-title">{table.name}</span>
                    <button
                      className="icon-btn table-node-more"
                      title="Delete Table"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTable(table.id)
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="table-node-columns">
                    {table.columns.map((col) => (
                      <div
                        key={col.id}
                        className={`column-row ${
                          selectedTableId === table.id && selectedTable?.columns.find(c => c.id === col.id)
                            ? ''
                            : ''
                        }`}
                      >
                        <div className="column-left">
                          {col.isPrimaryKey ? (
                            <Key className="column-key-icon" size={11} />
                          ) : col.isForeignKey ? (
                            <Link2 className="column-fk-icon" size={11} />
                          ) : (
                            <span style={{ width: 12 }} />
                          )}
                          <span className="column-name">{col.name}</span>
                        </div>
                        <span className="column-type">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Zoom and Navigation controllers */}
          <div className="canvas-controls">
            <button className="icon-btn" onClick={() => showNotification('Search canvas location')} title="Search Position">
              <Search size={13} />
            </button>
            <div className="control-separator" />
            <button className="icon-btn" onClick={zoomOut} title="Zoom Out">
              <Minimize2 size={13} />
            </button>
            <span className="zoom-text" onClick={resetZoom} style={{ cursor: 'pointer' }}>
              {zoom}%
            </span>
            <button className="icon-btn" onClick={zoomIn} title="Zoom In">
              <Maximize2 size={13} />
            </button>
            <div className="control-separator" />
            <button className="icon-btn" onClick={() => { setPanOffset({ x: 0, y: 0 }); resetZoom(); }} title="Recenter Canvas">
              <HelpCircle size={13} />
            </button>
            <button className="icon-btn" onClick={() => showNotification('Grid snapping enabled!')} title="Grid layout toggled">
              <Grid size={13} />
            </button>
          </div>
        </main>

        {/* Right side Properties Panel */}
        <aside className="right-panel">
          {selectedTable ? (
            <>
              <div className="panel-header">
                <h2>Table Properties</h2>
                <button className="icon-btn" onClick={() => setSelectedTableId(null)}>
                  <X size={15} />
                </button>
              </div>

              <div className="panel-body">
                {/* Table details input */}
                <div className="form-group">
                  <label className="form-label">Table Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedTable.name}
                    onChange={(e) => handleUpdateTableMeta({ name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Table Comment</label>
                  <textarea
                    className="form-textarea"
                    value={selectedTable.comment}
                    onChange={(e) => handleUpdateTableMeta({ comment: e.target.value })}
                  />
                </div>

                {/* Columns edit list */}
                <div className="form-group">
                  <div className="section-title-row">
                    <label className="form-label">Columns ({selectedTable.columns.length})</label>
                    <button className="btn-link-add" onClick={handleAddColumn}>
                      <Plus size={11} />
                      Add
                    </button>
                  </div>

                  <div className="columns-edit-list">
                    {selectedTable.columns.map((col) => (
                      <div key={col.id} className="column-edit-item">
                        <div className="column-edit-main">
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            value={col.name}
                            onChange={(e) => handleUpdateColumn(col.id, { name: e.target.value })}
                          />
                          <select
                            className="form-select"
                            value={col.type}
                            onChange={(e) => handleUpdateColumn(col.id, { type: e.target.value })}
                          >
                            {columnTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            className="column-edit-delete"
                            onClick={() => handleDeleteColumn(col.id)}
                            title="Delete Column"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="column-edit-checkboxes">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={col.isPrimaryKey}
                              onChange={(e) =>
                                handleUpdateColumn(col.id, {
                                  isPrimaryKey: e.target.checked,
                                  isForeignKey: e.target.checked ? false : col.isForeignKey
                                })
                              }
                            />
                            PK
                          </label>

                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={col.isForeignKey}
                              onChange={(e) =>
                                handleUpdateColumn(col.id, {
                                  isForeignKey: e.target.checked,
                                  isPrimaryKey: e.target.checked ? false : col.isPrimaryKey,
                                  foreignKeyTargetTableId: e.target.checked
                                    ? tables.find((t) => t.id !== selectedTable.id)?.id || ''
                                    : undefined,
                                  foreignKeyTargetColumnId: e.target.checked
                                    ? tables.find((t) => t.id !== selectedTable.id)?.columns[0]?.id || ''
                                    : undefined
                                })
                              }
                            />
                            FK
                          </label>

                          {col.isForeignKey && (
                            <select
                              className="form-select"
                              style={{ padding: '2px 4px', fontSize: '10px' }}
                              value={col.foreignKeyTargetTableId}
                              onChange={(e) => {
                                const targetTabId = e.target.value
                                const targetTableObj = tables.find((t) => t.id === targetTabId)
                                handleUpdateColumn(col.id, {
                                  foreignKeyTargetTableId: targetTabId,
                                  foreignKeyTargetColumnId: targetTableObj?.columns[0]?.id || ''
                                })
                              }}
                            >
                              {tables
                                .filter((t) => t.id !== selectedTable.id)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engine Settings */}
                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <label className="form-label">Engine Settings</label>
                  <div className="toggle-row">
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Audit Logging</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={auditLogging}
                        onChange={(e) => setAuditLogging(e.target.checked)}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                {/* SQL Preview */}
                <div className="sql-preview-container">
                  <div className="sql-header">
                    <span className="form-label">SQL Preview</span>
                    <button
                      className="icon-btn"
                      onClick={() => copyToClipboard(generateSQL(selectedTable))}
                      title="Copy SQL"
                    >
                      {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                  </div>
                  <pre className="sql-box">
                    <span className="sql-keyword">CREATE TABLE</span> <span className="sql-string">"{selectedTable.name}"</span> ({"\n"}
                    {selectedTable.columns.map((c, idx) => {
                      let typeStr = c.type
                      if (c.type === 'String') typeStr = 'UUID' // uuid target mapping
                      if (c.type === 'Decimal') typeStr = 'DECIMAL(10,2)'
                      const isLast = idx === selectedTable.columns.length - 1
                      return (
                        <span key={c.id}>
                          {"  "}<span className="sql-string">"{c.name}"</span> <span className="sql-type">{typeStr.toUpperCase()}</span>
                          {c.isPrimaryKey && <span className="sql-keyword"> PRIMARY KEY</span>}
                          {!isLast && ","}{"\n"}
                        </span>
                      )
                    })}
                    );
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>No Table Selected</h3>
              <p style={{ fontSize: '12px' }}>Click a table in the canvas to inspect its properties.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
