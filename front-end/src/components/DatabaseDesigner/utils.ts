import type { Table } from './types'

// Helper to escape HTML characters
export const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Custom shorthand syntax highlighter
export const highlightShorthand = (code: string) => {
  const lines = code.split('\n')
  return lines.map(line => {
    if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
      return `<span class="editor-comment">${escapeHtml(line)}</span>`
    }
    
    let highlighted = escapeHtml(line)
    
    const tableMatch = line.match(/^([a-zA-Z0-9_]+)\s*\{/)
    if (tableMatch) {
      const name = tableMatch[1]
      highlighted = highlighted.replace(name, `<span class="editor-table-name">${name}</span>`)
    }
    
    highlighted = highlighted
      .replace(/\bpk\b/g, '<span class="editor-keyword">pk</span>')
      .replace(/\bprimary\b/g, '<span class="editor-keyword">primary</span>')
      .replace(/\bfk\b/g, '<span class="editor-keyword">fk</span>')
      
    const types = ['UUID', 'String', 'Timestamp', 'Decimal', 'Integer', 'Boolean', 'Text', 'DateTime', 'Int']
    types.forEach(t => {
      const regex = new RegExp(`\\b${t}\\b`, 'g')
      highlighted = highlighted.replace(regex, `<span class="editor-type">${t}</span>`)
    })
    
    return highlighted
  }).join('\n')
}

// Serialize tables back to shorthand syntax
export const serializeTablesToShorthand = (currentTables: Table[]) => {
  return currentTables.map(t => {
    const colsStr = t.columns.map(c => {
      let line = `  ${c.name} ${c.type}`
      if (c.isPrimaryKey) line += ' pk'
      if (c.isForeignKey && c.foreignKeyTargetTableId) {
        const targetTableObj = currentTables.find(tbl => tbl.id === c.foreignKeyTargetTableId)
        const targetColObj = targetTableObj?.columns.find(col => col.id === c.foreignKeyTargetColumnId)
        if (targetTableObj && targetColObj) {
          line += ` fk ${targetTableObj.name.toLowerCase()}.${targetColObj.name}`
        }
      }
      return line
    }).join('\n')
    return `${t.name.toLowerCase()} {\n${colsStr}\n}`
  }).join('\n\n')
}
