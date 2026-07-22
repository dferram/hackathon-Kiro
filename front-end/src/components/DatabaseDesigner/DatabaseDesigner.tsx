import React, { useState, useEffect, useRef } from 'react'
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
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  GitBranch,
  Sparkles,
  Bell,
  ArrowLeft,
  Eye,
  Loader2
} from 'lucide-react'
import { DashboardHome } from '../Dashboard/DashboardHome'
import { UserProfileView } from '../Dashboard/UserProfileView'

interface DatabaseDesignerProps {
  setAuthScreen: (screen: any) => void
  showNotification: (msg: string) => void
}

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

// Helper to escape HTML characters
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Custom shorthand syntax highlighter
const highlightShorthand = (code: string) => {
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
const serializeTablesToShorthand = (currentTables: Table[]) => {
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

export default function DatabaseDesigner({
  setAuthScreen,
  showNotification
}: DatabaseDesignerProps) {
  const loggedInUserName = localStorage.getItem('userFullName') || 'Alex Dev'

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
  const [activeMasterTab, setActiveMasterTab] = useState<'home' | 'blueprint' | 'bandwidth' | 'mergeguard' | 'docify' | 'deeplint' | 'profile'>('home')
  const [selectedTableId, setSelectedTableId] = useState<string | null>('orders')
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(100)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [auditLogging, setAuditLogging] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [activeMenuTab, setActiveMenuTab] = useState<string>('TABLES')

  // Split View Editor state
  const [isSplitView, setIsSplitView] = useState<boolean>(true)
  const [splitViewMode, setSplitViewMode] = useState<'dsl' | 'export'>('export')
  const [showToast, setShowToast] = useState<boolean>(true)
  const [importError, setImportError] = useState<string | null>(null)
  const [importCode, setImportCode] = useState<string>(
    'users {\n  id UUID pk\n  email String\n  created_at Timestamp\n}\n\norders {\n  id UUID pk\n  user_id UUID fk users.id\n  total Decimal\n}'
  )

  // Export / Script Generator state
  const [targetDb, setTargetDb] = useState<string>('PostgreSQL')
  const [schemaName, setSchemaName] = useState<string>('public')
  const [includeDrop, setIncludeDrop] = useState<boolean>(true)
  const [generateFK, setGenerateFK] = useState<boolean>(true)
  const [includeSeed, setIncludeSeed] = useState<boolean>(false)
  const [exportNotification, setExportNotification] = useState<string | null>(null)

  // Indices & Queries custom state
  const [customIndices, setCustomIndices] = useState<Array<{ id: string; name: string; tableName: string; columnName: string }>>([
    { id: 'idx_users_email', name: 'idx_users_email', tableName: 'users', columnName: 'email' }
  ])
  const [selectedIndexTableId, setSelectedIndexTableId] = useState<string>('')
  const [selectedIndexColId, setSelectedIndexColId] = useState<string>('')

  // Docify state variables
  const [docifyRepoUrl, setDocifyRepoUrl] = useState<string>('https://github.com/usuario/repo-name')
  const [docifyStatus, setDocifyStatus] = useState<'idle' | 'cloning' | 'filtering' | 'generating' | 'converting' | 'ready'>('idle')
  const [docifyLoadingStep, setDocifyLoadingStep] = useState<number>(0)
  const [docifyProgressText, setDocifyProgressText] = useState<string>('')

  // Simulates the documentation generation steps
  const startDocifyAnalysis = () => {
    if (!docifyRepoUrl.trim()) {
      showNotification('Por favor ingresa una URL válida');
      return;
    }
    setDocifyStatus('cloning');
    setDocifyLoadingStep(1);
    setDocifyProgressText('Iniciando descarga del repositorio...');

    // Step 1: Cloning repository
    setTimeout(() => {
      setDocifyStatus('filtering');
      setDocifyLoadingStep(2);
      setDocifyProgressText('452 archivos encontrados. Filtrando archivos no relevantes...');
      
      // Step 2: Filtering files
      setTimeout(() => {
        setDocifyStatus('generating');
        setDocifyLoadingStep(3);
        setDocifyProgressText('Extrayendo firmas de código y tipos: Paso 4/12...');

        // Step 3: Generating JSON signatures
        setTimeout(() => {
          setDocifyStatus('converting');
          setDocifyLoadingStep(4);
          setDocifyProgressText('Escribiendo archivo de documentación y formateando...');

          // Step 4: Converting to final document
          setTimeout(() => {
            setDocifyStatus('ready');
            setDocifyLoadingStep(5);
            setDocifyProgressText('Documento generado exitosamente!');
            showNotification('Documentación generada con éxito');
          }, 2000);
        }, 2000);
      }, 1500);
    }, 1500);
  };

  const getRepoDocInfo = (url: string) => {
    const repoName = url.split('/').pop() || 'repo-name';
    const isReact = url.toLowerCase().includes('react');
    const isExpress = url.toLowerCase().includes('express');
    const isLocalProject = url.toLowerCase().includes('kiro') || url.toLowerCase().includes('hack-aws-kiro') || url.toLowerCase().includes('usuario') || url.toLowerCase().includes('repo-name');

    // Default project metadata
    let techStack = 'Node.js, TypeScript, JavaScript';
    let sections = [
      {
        title: '1. ¿De qué está hecho el proyecto? (Stack Tecnológico)',
        items: [
          { name: 'Lenguajes', desc: 'TypeScript (para tipado fuerte en Frontend y Backend), JavaScript (ES6+)' },
          { name: 'Frontend', desc: 'React 19, Vite (empaquetador de alto rendimiento), Lucide Icons' },
          { name: 'Backend', desc: 'Node.js con Express (servidor API ligero y modular)' },
          { name: 'Base de Datos', desc: 'SQLite (almacenamiento ligero local) + Prisma ORM (modelado y consultas)' }
        ]
      },
      {
        title: '2. Propósito de cada archivo en el Frontend',
        items: [
          { name: 'App.tsx', desc: 'Punto de entrada de componentes. Maneja la sesión y rutea hacia el Login o el Workspace.' },
          { name: 'DatabaseDesigner.tsx', desc: 'Lienzo interactivo del canvas visual, generador de scripts SQL y pestaña Docify.' },
          { name: 'DashboardHome.tsx', desc: 'Panel inicial con estadísticas, accesos directos de Git y tareas asignadas.' },
          { name: 'UserProfileView.tsx', desc: 'Vista del perfil de usuario, edición de datos y control de sesión.' },
          { name: 'Login.tsx / Register.tsx', desc: 'Formularios y lógica de registro e inicio de sesión de usuarios.' }
        ]
      },
      {
        title: '3. Propósito de cada archivo en el Backend',
        items: [
          { name: 'index.ts', desc: 'Punto de arranque del servidor Express. Inicializa middlewares y registra rutas de API.' },
          { name: 'schema.prisma', desc: 'Esquema de base de datos relacional. Define modelos de User, Project, Task y SyncAlert.' },
          { name: 'authRouter.ts', desc: 'Maneja el registro, validación y login de usuarios.' },
          { name: 'dbDesignerRouter.ts', desc: 'Endpoints para guardar, listar y cargar esquemas de bases de datos.' },
          { name: 'docGeneratorRouter.ts', desc: 'Gestiona la cola de trabajos y ejecución del analizador Docify.' }
        ]
      }
    ];

    if (!isLocalProject) {
      const lowerUrl = url.toLowerCase();
      const isInventory = lowerUrl.includes('zara') || lowerUrl.includes('inventario') || lowerUrl.includes('inventory') || lowerUrl.includes('stock') || lowerUrl.includes('warehouse') || lowerUrl.includes('almacen');
      const isShop = lowerUrl.includes('shop') || lowerUrl.includes('store') || lowerUrl.includes('ecommerce') || lowerUrl.includes('tienda');

      if (isInventory) {
        techStack = 'React 19, TypeScript, Node.js con Express, PostgreSQL, Prisma ORM, Tailwind CSS';
        sections = [
          {
            title: '1. ¿De qué está hecho el proyecto? (Stack Tecnológico)',
            items: [
              { name: 'Lenguajes', desc: 'TypeScript ( Frontend y Backend para asegurar tipado de inventario), JavaScript' },
              { name: 'Frontend', desc: 'React 19, Vite (empaquetado optimizado de UI), Tailwind CSS (estilado rápido de paneles)' },
              { name: 'Backend', desc: 'Node.js + Express (servicios API REST para entradas y salidas de inventario)' },
              { name: 'Base de Datos', desc: 'PostgreSQL (Base de datos relacional robusta) + Prisma ORM (modelado de stock)' }
            ]
          },
          {
            title: '2. Propósito de cada archivo en el Frontend',
            items: [
              { name: 'ProductCatalog.tsx', desc: 'Catálogo de prendas y productos con filtros de colección, temporada y categoría.' },
              { name: 'StockManager.tsx', desc: 'Panel para monitorear stock y alertar de existencias bajas en estanterías.' },
              { name: 'BarcodeScanner.tsx', desc: 'Módulo de escaneo de códigos de barra EAN/UPC para ingresos rápidos.' },
              { name: 'WarehouseGrid.tsx', desc: 'Vista de cuadrícula de almacén físico para ubicar pasillos, secciones y estantes.' },
              { name: 'App.tsx / index.tsx', desc: 'Configuración global de estados de sesión y ruteador de la aplicación.' }
            ]
          },
          {
            title: '3. Propósito de cada archivo en el Backend',
            items: [
              { name: 'server.ts', desc: 'Punto de arranque. Carga de middlewares de seguridad, CORS y enrutamiento del API.' },
              { name: 'schema.prisma', desc: 'Define la estructura de base de datos relacional para modelos de Prenda, Variación, Almacén e Historial.' },
              { name: 'productController.ts', desc: 'Endpoints de consultas y operaciones de prendas (CRUD).' },
              { name: 'stockSyncService.ts', desc: 'Servicio asíncrono para sincronizar el stock local con la central de inventario.' },
              { name: 'auditLogger.ts', desc: 'Servicio que registra cada entrada, salida y merma de inventario para auditorías.' }
            ]
          }
        ];
      } else if (isShop) {
        techStack = 'React, Vite, Node.js, Stripe, MongoDB, Tailwind CSS';
        sections = [
          {
            title: '1. ¿De qué está hecho el proyecto? (Stack Tecnológico)',
            items: [
              { name: 'Frontend', desc: 'React, Vite, Tailwind CSS (E-Commerce interactivo y responsivo)' },
              { name: 'Backend', desc: 'Node.js, Express (Gestión de órdenes y carritos de compras)' },
              { name: 'Pagos', desc: 'Stripe API (Procesamiento seguro de pasarelas de pago)' },
              { name: 'Base de Datos', desc: 'MongoDB (Base de datos NoSQL flexible para catálogos dinámicos)' }
            ]
          },
          {
            title: '2. Propósito de cada archivo en el Frontend',
            items: [
              { name: 'ProductCard.tsx / ProductList.tsx', desc: 'Fichas dinámicas de producto con imágenes, precio y botón de agregar al carrito.' },
              { name: 'CartContext.tsx', desc: 'Manejador de estado global de React para los artículos agregados en la sesión.' },
              { name: 'CheckoutForm.tsx', desc: 'Formulario de facturación conectado a los elementos de seguridad de Stripe.' }
            ]
          },
          {
            title: '3. Propósito de cada archivo en el Backend',
            items: [
              { name: 'orderRouter.ts', desc: 'Rutas de creación, procesamiento y listado de pedidos de compras.' },
              { name: 'paymentController.ts', desc: 'Maneja la creación de intenciones de pago y webhooks de Stripe.' },
              { name: 'userModel.ts', desc: 'Esquema de base de datos NoSQL para usuarios y direcciones de envío.' }
            ]
          }
        ];
      } else if (isReact) {
        techStack = 'React, Vite, HTML5, CSS3, JavaScript';
        sections = [
          {
            title: '1. ¿De qué está hecho el proyecto? (Stack Tecnológico)',
            items: [
              { name: 'Frontend framework', desc: 'React (Biblioteca para interfaces de usuario reactivas)' },
              { name: 'Empaquetador', desc: 'Vite (Servidor de desarrollo y compilador optimizado)' },
              { name: 'Lenguajes', desc: 'JavaScript / TypeScript para la lógica estructurada' }
            ]
          },
          {
            title: '2. Propósito de archivos clave (Estructura de Componentes)',
            items: [
              { name: 'index.html', desc: 'Página base HTML5 donde se monta el árbol de componentes.' },
              { name: 'src/main.jsx', desc: 'Inicializa la aplicación y renderiza el componente raíz.' },
              { name: 'src/App.jsx', desc: 'Componente contenedor global y enrutamiento interno.' }
            ]
          }
        ];
      } else if (isExpress) {
        techStack = 'Node.js, Express, REST API';
        sections = [
          {
            title: '1. ¿De qué está hecho el proyecto? (Stack Tecnológico)',
            items: [
              { name: 'Backend engine', desc: 'Node.js (Entorno de ejecución de servidor)' },
              { name: 'Framework API', desc: 'Express (Mapeador de rutas y controladores HTTP)' },
              { name: 'Paquetes', desc: 'CORS, dotenv, express.json() para manejo de peticiones REST' }
            ]
          },
          {
            title: '2. Propósito de archivos clave (Estructura de Servicios)',
            items: [
              { name: 'package.json', desc: 'Configuración del proyecto y dependencias de Node.' },
              { name: 'server.js / app.js', desc: 'Inicialización de los puertos del servidor y registro de rutas API.' }
            ]
          }
        ];
      } else {
        techStack = 'Estructura de repositorio genérico';
        sections = [
          {
            title: '1. ¿De qué está hecho el proyecto? (Stack Tecnológico)',
            items: [
              { name: 'Stack', desc: 'JavaScript / TypeScript genérico y scripts de automatización.' }
            ]
          },
          {
            title: '2. Propósito de archivos del Repositorio',
            items: [
              { name: 'README.md', desc: 'Archivo Markdown de bienvenida, instalación y guías generales.' },
              { name: 'src/', desc: 'Carpeta contenedora del código fuente principal.' }
            ]
          }
        ];
      }
    }

    return { repoName, techStack, sections };
  };

  const handleDownloadDocifyDoc = () => {
    const info = getRepoDocInfo(docifyRepoUrl);
    
    let docContent = `# Documentación de Arquitectura y Código: ${info.repoName}

Generada automáticamente por: Agente de Documentación de Código (Docify)
Stack principal: ${info.techStack}
Fecha de generación: ${new Date().toLocaleDateString()}

---
`;

    info.sections.forEach(sec => {
      docContent += `\n## ${sec.title}\n`;
      sec.items.forEach(item => {
        docContent += `- **${item.name}**: ${item.desc}\n`;
      });
    });

    docContent += `
---

> [!NOTE]
> Este archivo fue descargado desde la plataforma integrada Docify.
`;
    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${info.repoName}-docs.md`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Documentación descargada correctamente!');
  };

  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState<boolean>(false)

  // Dragging table node state
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null)
  const [relationDragging, setRelationDragging] = useState<{
    sourceTableId: string
    sourceColumnId: string
    currentX: number
    currentY: number
  } | null>(null)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Column types options
  const columnTypes = ['UUID', 'String', 'Timestamp', 'Decimal', 'Integer', 'Boolean', 'Text', 'DateTime']

  // Find selected table
  const selectedTable = tables.find(t => t.id === selectedTableId)

  // Handle Canvas mouse events for panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-content')) {
      setIsPanning(true)
      panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
      setSelectedRelationId(null)
    }
  }

  const handleRelationDragStart = (e: React.MouseEvent, tableId: string, colId: string) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const zoomFactor = zoom / 100
    const clientX = (e.clientX - rect.left - panOffset.x) / zoomFactor
    const clientY = (e.clientY - rect.top - panOffset.y) / zoomFactor
    setRelationDragging({
      sourceTableId: tableId,
      sourceColumnId: colId,
      currentX: clientX,
      currentY: clientY
    })
  }

  const handleRelationDragEnd = (e: React.MouseEvent, targetTableId: string, targetColId: string) => {
    e.stopPropagation()
    if (!relationDragging) return
    const { sourceTableId, sourceColumnId } = relationDragging
    setRelationDragging(null)
    if (sourceTableId === targetTableId) {
      showNotification("No se puede relacionar columnas de la misma tabla")
      return
    }

    const updatedTables = tables.map(t => {
      if (t.id === sourceTableId) {
        return {
          ...t,
          columns: t.columns.map(c => {
            if (c.id === sourceColumnId) {
              return {
                ...c,
                isForeignKey: true,
                foreignKeyTargetTableId: targetTableId,
                foreignKeyTargetColumnId: targetColId
              }
            }
            return c
          })
        }
      }
      return t
    })

    setTables(updatedTables)
    setImportCode(serializeTablesToShorthand(updatedTables))
    showNotification("Relación creada visualmente!")
  }

  const handleDeleteRelation = (sourceTableId: string, sourceColumnId: string) => {
    const updatedTables = tables.map(t => {
      if (t.id === sourceTableId) {
        return {
          ...t,
          columns: t.columns.map(c => {
            if (c.id === sourceColumnId) {
              return {
                ...c,
                isForeignKey: false,
                foreignKeyTargetTableId: undefined,
                foreignKeyTargetColumnId: undefined
              }
            }
            return c
          })
        }
      }
      return t
    })

    setTables(updatedTables)
    setImportCode(serializeTablesToShorthand(updatedTables))
    setSelectedRelationId(null)
    showNotification("Relación eliminada!")
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (relationDragging) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const zoomFactor = zoom / 100
        const clientX = (e.clientX - rect.left - panOffset.x) / zoomFactor
        const clientY = (e.clientY - rect.top - panOffset.y) / zoomFactor
        setRelationDragging(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null)
      }
      return
    }

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
    setRelationDragging(null)
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

  // Real-time shorthand code parsing effect
  useEffect(() => {
    const parse = () => {
      try {
        setImportError(null)
        const parsedTables: Table[] = []

        const blocks = importCode.match(/([a-zA-Z0-9_]+)\s*\{([^}]+)\}/g)
        if (!blocks) return

        const tempFKsToResolve: Array<{
          tableId: string
          colId: string
          targetTableName: string
          targetColName: string
        }> = []

        blocks.forEach((block, index) => {
          const headerMatch = block.match(/^([a-zA-Z0-9_]+)\s*\{/)
          if (!headerMatch) return
          const tableName = headerMatch[1]
          const tableId = tableName.toLowerCase()

          const bodyContent = block.substring(block.indexOf('{') + 1, block.lastIndexOf('}'))
          const lines = bodyContent.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'))

          const columns: Column[] = lines.map((line, colIndex) => {
            const parts = line.split(/\s+/).filter(p => p.length > 0)
            if (parts.length < 2) return null
            const colName = parts[0]
            const colType = parts[1]
            const isPK = parts.includes('pk') || parts.includes('primary')

            let isFK = false
            let targetTable = ''
            let targetCol = ''

            const fkIndex = parts.indexOf('fk')
            if (fkIndex !== -1 && fkIndex + 1 < parts.length) {
              isFK = true
              const targetParts = parts[fkIndex + 1].split('.')
              if (targetParts.length === 2) {
                targetTable = targetParts[0]
                targetCol = targetParts[1]
              }
            }

            const colId = `c_${tableId}_${colName}_${colIndex}`

            if (isFK && targetTable && targetCol) {
              tempFKsToResolve.push({
                tableId,
                colId,
                targetTableName: targetTable,
                targetColName: targetCol
              })
            }

            return {
              id: colId,
              name: colName,
              type: colType,
              isPrimaryKey: isPK,
              isForeignKey: isFK
            }
          }).filter(c => c !== null) as Column[]

          const existingTable = tables.find(t => t.id === tableId)

          parsedTables.push({
            id: tableId,
            name: tableName,
            comment: existingTable?.comment || `Stores custom ${tableName.toLowerCase()} entity records.`,
            x: existingTable?.x ?? (20 + index * 250),
            y: existingTable?.y ?? 40,
            columns
          })
        })

        tempFKsToResolve.forEach(fk => {
          const sourceTable = parsedTables.find(t => t.id === fk.tableId)
          if (!sourceTable) return

          const targetTable = parsedTables.find(t => t.name.toLowerCase() === fk.targetTableName.toLowerCase())
          if (!targetTable) return

          const targetCol = targetTable.columns.find(c => c.name.toLowerCase() === fk.targetColName.toLowerCase())
          if (!targetCol) return

          const sourceCol = sourceTable.columns.find(c => c.id === fk.colId)
          if (sourceCol) {
            sourceCol.foreignKeyTargetTableId = targetTable.id
            sourceCol.foreignKeyTargetColumnId = targetCol.id
          }
        })

        if (parsedTables.length > 0) {
          setTables(parsedTables)
          setShowToast(true)
        }
      } catch (err: any) {
        setImportError(err.message || 'Error al procesar el código')
      }
    }

    parse()
  }, [importCode])

  // Delete Table
  const handleDeleteTable = (tableId: string) => {
    const updated = tables.filter(t => t.id !== tableId)
    setTables(updated)
    setImportCode(serializeTablesToShorthand(updated))
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

  // Generate export SQL with full settings (target DB, schema, DROP, FK, indices, seed)
  const generateExportSQL = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const lines: string[] = []

    lines.push(`-- DataDraft: ${targetDb} Export`)
    lines.push(`-- Generated on: ${now}`)
    lines.push('')

    if (targetDb === 'PostgreSQL') {
      lines.push('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
      lines.push('')
    }

    if (targetDb === 'MySQL') {
      lines.push(`CREATE DATABASE IF NOT EXISTS \`${schemaName}\`;`)
      lines.push(`USE \`${schemaName}\`;`)
      lines.push('')
    }

    tables.forEach(table => {
      const q = targetDb === 'MySQL' ? '`' : '"'

      if (includeDrop) {
        lines.push(`DROP TABLE IF EXISTS ${q}${table.name.toLowerCase()}${q} CASCADE;`)
      }

      lines.push(`-- Table: ${table.name.toLowerCase()}`)
      lines.push(`CREATE TABLE ${q}${table.name.toLowerCase()}${q} (`)

      const colDefs: string[] = []
      table.columns.forEach(col => {
        let typeStr = col.type
        if (targetDb === 'PostgreSQL') {
          if (col.type === 'UUID' && col.isPrimaryKey) typeStr = 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()'
          else if (col.type === 'UUID') typeStr = 'UUID'
          else if (col.type === 'String') typeStr = 'VARCHAR(255) UNIQUE NOT NULL'
          else if (col.type === 'Text') typeStr = 'TEXT'
          else if (col.type === 'Decimal') typeStr = 'DECIMAL(12,2)'
          else if (col.type === 'Integer') typeStr = 'INTEGER'
          else if (col.type === 'Boolean') typeStr = 'BOOLEAN DEFAULT FALSE'
          else if (col.type === 'Timestamp') typeStr = 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
          else if (col.type === 'DateTime') typeStr = 'TIMESTAMP DEFAULT NOW()'
        } else if (targetDb === 'MySQL') {
          if (col.type === 'UUID' && col.isPrimaryKey) typeStr = 'CHAR(36) PRIMARY KEY'
          else if (col.type === 'UUID') typeStr = 'CHAR(36)'
          else if (col.type === 'String') typeStr = 'VARCHAR(255) NOT NULL'
          else if (col.type === 'Text') typeStr = 'TEXT'
          else if (col.type === 'Decimal') typeStr = 'DECIMAL(12,2)'
          else if (col.type === 'Integer') typeStr = 'INT'
          else if (col.type === 'Boolean') typeStr = 'TINYINT(1) DEFAULT 0'
          else if (col.type === 'Timestamp') typeStr = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
          else if (col.type === 'DateTime') typeStr = 'DATETIME DEFAULT NOW()'
        } else if (targetDb === 'SQLite') {
          if (col.type === 'UUID' && col.isPrimaryKey) typeStr = 'TEXT PRIMARY KEY'
          else if (col.type === 'UUID') typeStr = 'TEXT'
          else if (col.type === 'String') typeStr = 'TEXT NOT NULL'
          else if (col.type === 'Text') typeStr = 'TEXT'
          else if (col.type === 'Decimal') typeStr = 'REAL'
          else if (col.type === 'Integer') typeStr = 'INTEGER'
          else if (col.type === 'Boolean') typeStr = 'INTEGER DEFAULT 0'
          else if (col.type === 'Timestamp' || col.type === 'DateTime') typeStr = 'TEXT DEFAULT CURRENT_TIMESTAMP'
        } else {
          if (col.type === 'String') typeStr = 'VARCHAR(255)'
          else if (col.type === 'Timestamp') typeStr = 'TIMESTAMP WITH TIME ZONE'
          else if (col.type === 'Decimal') typeStr = 'DECIMAL(10,2)'
          else if (col.type === 'DateTime') typeStr = 'TIMESTAMP'
          if (col.isPrimaryKey) typeStr += ' PRIMARY KEY'
        }

        let line = `    ${q}${col.name}${q} ${typeStr}`

        if (generateFK && col.isForeignKey && col.foreignKeyTargetTableId) {
          const targetTable = tables.find(t => t.id === col.foreignKeyTargetTableId)
          const targetCol = targetTable?.columns.find(c => c.id === col.foreignKeyTargetColumnId)
          if (targetTable && targetCol) {
            line += ` REFERENCES ${q}${targetTable.name.toLowerCase()}${q}(${q}${targetCol.name}${q}) ON DELETE CASCADE`
          }
        }

        colDefs.push(line)
      })

      // Add CHECK constraints for status-like columns
      table.columns.forEach(col => {
        if (col.name === 'status' && col.type === 'String') {
          colDefs.push(`    ${q}${col.name}${q} VARCHAR(50) CHECK (status IN ('pending', 'shipped', 'delivered'))`)
        }
      })

      lines.push(colDefs.join(',\n'))

      if (targetDb === 'MongoDB' || targetDb === 'Prisma ORM') {
        lines.push(`);  "metadata" JSONB`)
      } else {
        lines.push(');')
      }
      lines.push('')
    })

    // Indices
    if (customIndices.length > 0) {
      lines.push('-- Indices for faster querying')
      customIndices.forEach(idx => {
        const q = targetDb === 'MySQL' ? '`' : '"'
        lines.push(`CREATE INDEX ${q}${idx.name}${q} ON ${q}${idx.tableName}${q}(${q}${idx.columnName}${q});`)
      })
      lines.push('')
    }

    lines.push('COMMIT;')

    return lines.join('\n')
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
    setIsSplitView(true)
    setSplitViewMode('export')
  }

  // Download SQL file
  const handleDownloadSQL = () => {
    const fullSql = generateExportSQL()
    const blob = new Blob([fullSql], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schemaName}_schema.sql`
    link.click()
    URL.revokeObjectURL(url)
    setExportNotification('Script generated successfully')
    setTimeout(() => setExportNotification(null), 3000)
  }

  // Relations calculation helper to render visual lines
  const getRelationPoints = () => {
    const points: Array<{
      id: string
      path: string
      targetTableId: string
      sourceTableId: string
      sourceColumnId: string
      midX: number
      midY: number
    }> = []

    tables.forEach(sourceTable => {
      sourceTable.columns.forEach((col, colIdx) => {
        if (col.isForeignKey && col.foreignKeyTargetTableId) {
          const targetTable = tables.find(t => t.id === col.foreignKeyTargetTableId)
          if (targetTable) {
            const targetColIdx = targetTable.columns.findIndex(c => c.id === col.foreignKeyTargetColumnId)
            const targetColIndex = targetColIdx === -1 ? 0 : targetColIdx

            const rowHeight = 35
            const headerHeight = 38

            const sourceOnRight = sourceTable.x > targetTable.x

            const xSource = sourceTable.x + (sourceOnRight ? 0 : 210)
            const ySource = sourceTable.y + headerHeight + colIdx * rowHeight + rowHeight / 2

            const xTarget = targetTable.x + (sourceOnRight ? 210 : 0)
            const yTarget = targetTable.y + headerHeight + targetColIndex * rowHeight + rowHeight / 2

            const offset = Math.abs(xSource - xTarget) / 2
            const cp1x = sourceOnRight ? xSource - offset : xSource + offset
            const cp2x = sourceOnRight ? xTarget + offset : xTarget - offset

            const path = `M ${xSource} ${ySource} C ${cp1x} ${ySource}, ${cp2x} ${yTarget}, ${xTarget} ${yTarget}`
            const midX = 0.125 * xSource + 0.375 * cp1x + 0.375 * cp2x + 0.125 * xTarget
            const midY = 0.5 * ySource + 0.5 * yTarget

            points.push({
              id: `${sourceTable.id}_${col.id}_to_${targetTable.id}`,
              path,
              targetTableId: targetTable.id,
              sourceTableId: sourceTable.id,
              sourceColumnId: col.id,
              midX,
              midY
            })
          }
        }
      })
    })

    return points
  }

  const relationLines = getRelationPoints()

  // Listen to keyboard Delete/Backspace keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRelationId) {
          e.preventDefault()
          const rel = relationLines.find(r => r.id === selectedRelationId)
          if (rel) {
            handleDeleteRelation(rel.sourceTableId, rel.sourceColumnId)
          }
        } else if (selectedTableId) {
          e.preventDefault()
          handleDeleteTable(selectedTableId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedRelationId, selectedTableId, relationLines, tables])

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  return (
    <div className="devsync-dashboard-wrapper">
      {/* Master Left Navigation Sidebar */}
      <aside className="master-left-sidebar">
        {activeMasterTab === 'blueprint' ? (
          <div className="left-sidebar" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', borderRight: 'none' }}>
            <div className="master-sidebar-logo-group" style={{ cursor: 'pointer', borderBottom: '1px solid #131924' }} onClick={() => setActiveMasterTab('home')}>
              <ArrowLeft size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
              <div className="master-logo-text-group">
                <span className="master-logo-text" style={{ fontSize: '13px' }}>Database Blueprint</span>
                <span className="master-logo-sub">visual-schema</span>
              </div>
            </div>

            <div className="sidebar-top" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              <div className="explorer-card" style={{ marginBottom: '8px' }}>
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

              <button
                className="btn-new-table"
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  borderColor: 'var(--accent-blue)',
                  color: 'var(--accent-blue)',
                  marginTop: '4px'
                }}
                onClick={() => {
                  if (isSplitView && splitViewMode === 'dsl') {
                    setIsSplitView(false)
                  } else {
                    setIsSplitView(true)
                    setSplitViewMode('dsl')
                  }
                }}
              >
                <Code size={14} />
                {isSplitView ? 'CLOSE CODE EDITOR' : 'OPEN CODE EDITOR'}
              </button>

              <div className="sidebar-menu" style={{ padding: 0, marginTop: '12px' }}>
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
              </div>

              {activeMenuTab === 'TABLES' && (
                <div className="sidebar-content-area" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <span className="sidebar-list-title">Tablas ({filteredTables.length})</span>
                  {filteredTables.map(t => (
                    <div 
                      key={t.id} 
                      className={`sidebar-list-item ${selectedTableId === t.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTableId(t.id)}
                    >
                      <span className="sidebar-item-name">
                        <Database size={12} style={{ color: 'var(--accent-blue)', marginRight: '6px' }} />
                        {t.name}
                      </span>
                      <span className="sidebar-item-meta">{t.columns.length} cols</span>
                    </div>
                  ))}
                </div>
              )}

              {activeMenuTab === 'RELATIONS' && (
                <div className="sidebar-content-area" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <span className="sidebar-list-title">Relaciones ({relationLines.length})</span>
                  {relationLines.map((line) => (
                    <div key={line.id} className="sidebar-list-item" onClick={() => setSelectedTableId(line.targetTableId)}>
                      <span className="sidebar-item-name" style={{ fontSize: '10px' }}>
                        <Link2 size={12} style={{ color: 'var(--accent-green)', marginRight: '6px' }} />
                        {line.id.replace('_to_', ' ➜ ').replace(/_[a-zA-Z0-9]+_/g, '.')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeMenuTab === 'INDICES' && (
                <div className="sidebar-content-area" style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span className="sidebar-list-title">Índices ({customIndices.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {customIndices.map(idx => (
                      <div key={idx.id} className="sidebar-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="sidebar-item-name">
                          <Key size={12} style={{ color: 'var(--accent-purple)', marginRight: '6px' }} />
                          {idx.name}
                        </span>
                        <button
                          onClick={() => {
                            setCustomIndices(prev => prev.filter(i => i.id !== idx.id))
                            showNotification("Índice eliminado")
                          }}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '10px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="index-creator-form" style={{ marginTop: '12px', borderTop: '1px dashed #131924', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="sidebar-list-title" style={{ fontSize: '10px' }}>NUEVO ÍNDICE</span>
                    
                    <select
                      className="form-select"
                      style={{ width: '100%', padding: '4px', fontSize: '11px', background: '#0d1117', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: '4px' }}
                      value={selectedIndexTableId}
                      onChange={(e) => {
                        setSelectedIndexTableId(e.target.value)
                        const tbl = tables.find(t => t.id === e.target.value)
                        if (tbl && tbl.columns.length > 0) {
                          setSelectedIndexColId(tbl.columns[0].id)
                        }
                      }}
                    >
                      <option value="">Selecciona Tabla...</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>

                    {selectedIndexTableId && (() => {
                      const tbl = tables.find(t => t.id === selectedIndexTableId)
                      if (!tbl) return null
                      return (
                        <select
                          className="form-select"
                          style={{ width: '100%', padding: '4px', fontSize: '11px', background: '#0d1117', border: '1px solid #1e293b', color: '#e2e8f0', borderRadius: '4px' }}
                          value={selectedIndexColId}
                          onChange={(e) => setSelectedIndexColId(e.target.value)}
                        >
                          <option value="">Selecciona Columna...</option>
                          {tbl.columns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )
                    })()}

                    <button
                      className="btn-new-table"
                      style={{ width: '100%', padding: '6px', fontSize: '11px', marginTop: '4px' }}
                      onClick={() => {
                        const tbl = tables.find(t => t.id === selectedIndexTableId)
                        const col = tbl?.columns.find(c => c.id === selectedIndexColId)
                        if (tbl && col) {
                          const idxName = `idx_${tbl.name.toLowerCase()}_${col.name.toLowerCase()}`
                          if (customIndices.some(i => i.name === idxName)) {
                            showNotification("El índice ya existe")
                            return
                          }
                          setCustomIndices(prev => [
                            ...prev,
                            {
                              id: `idx_${Date.now()}`,
                              name: idxName,
                              tableName: tbl.name.toLowerCase(),
                              columnName: col.name.toLowerCase()
                            }
                          ])
                          showNotification(`Índice ${idxName} creado!`)
                          setSelectedIndexTableId('')
                          setSelectedIndexColId('')
                        } else {
                          showNotification("Selecciona tabla y columna")
                        }
                      }}
                    >
                      Crear Índice
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="master-sidebar-footer" style={{ borderTop: '1px solid #131924' }}>
              <div className="master-footer-item" onClick={() => showNotification('Opening documentation...')}>
                <FileText size={13} />
                <span>DOCS</span>
              </div>
              <div className="master-footer-item" onClick={() => showNotification('Database Status: Connected')}>
                <Activity size={13} />
                <span>STATUS</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="master-sidebar-logo-group">
              <div className="master-logo-circle">
                <svg className="master-logo-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" strokeWidth="2.5">
                  <path d="M12 12c-2-2.67-4-4-6-4A4 4 0 0 0 2 12a4 4 0 0 0 4 4c2 0 4-1.33 6-4Zm0 0c2-2.67 4-4 6-4a4 4 0 0 1 4 4 4 4 0 0 1-4 4c-2 0-4-1.33-6-4Z" />
                </svg>
              </div>
              <div className="master-logo-text-group">
                <span className="master-logo-text">DevSync</span>
                <span className="master-logo-sub">Production Environment</span>
              </div>
            </div>

            <nav className="master-sidebar-menu">
              <div 
                className={`master-menu-item ${activeMasterTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveMasterTab('home')}
              >
                <Home size={16} />
                <span>Home</span>
              </div>
              <div 
                className="master-menu-item"
                onClick={() => setActiveMasterTab('blueprint')}
              >
                <Code size={16} style={{ transform: 'rotate(-45deg)' }} />
                <span>BluePrint</span>
              </div>
              <div 
                className={`master-menu-item ${activeMasterTab === 'bandwidth' ? 'active' : ''}`}
                onClick={() => setActiveMasterTab('bandwidth')}
              >
                <Activity size={16} />
                <span>Bandwidth</span>
              </div>
              <div 
                className={`master-menu-item ${activeMasterTab === 'mergeguard' ? 'active' : ''}`}
                onClick={() => setActiveMasterTab('mergeguard')}
              >
                <GitBranch size={16} />
                <span>MergeGuard</span>
              </div>
              <div 
                className={`master-menu-item ${activeMasterTab === 'docify' ? 'active' : ''}`}
                onClick={() => setActiveMasterTab('docify')}
              >
                <FileText size={16} />
                <span>Docify</span>
              </div>
              <div 
                className={`master-menu-item ${activeMasterTab === 'deeplint' ? 'active' : ''}`}
                onClick={() => setActiveMasterTab('deeplint')}
              >
                <Sparkles size={16} />
                <span>DeepLint</span>
              </div>
            </nav>

            <div className="master-sidebar-footer">
              <div className="master-footer-item" onClick={() => showNotification('Configuración abierta')}>
                <Settings size={14} />
                <span>Configuración</span>
              </div>
              <div className="master-footer-item" onClick={() => showNotification('Soporte')}>
                <HelpCircle size={14} />
                <span>Help</span>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Container Area */}
      <div className="master-main-container">
        {/* Top Search & Profile Header */}
        <header className="master-top-header">
          <div className="master-search-bar">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search projects, schemas, or docs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="master-header-right">
            <button className="icon-btn notification-bell" onClick={() => showNotification('No hay nuevas notificaciones')} title="Notifications">
              <Bell size={16} />
              <span className="bell-badge"></span>
            </button>

            <div className="master-user-profile" title="Ver Perfil" onClick={() => {
              setActiveMasterTab('profile');
            }}>
              <div className="profile-info">
                <span className="profile-name">{loggedInUserName}</span>
                <span className="profile-role">Lead Engineer</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Profile Avatar"
                className="master-profile-avatar"
              />
            </div>
          </div>
        </header>

        {/* Master Content Area switcher */}
        <main className="master-content-body">
          {activeMasterTab === 'home' && (
            <DashboardHome 
              onNavigateToBlueprint={() => setActiveMasterTab('blueprint')}
              userName={loggedInUserName}
            />
          )}

          {activeMasterTab === 'blueprint' && (
            <div className="blueprint-designer-workspace-wrapper">
              
              {/* Internal header for blueprint actions (Save, Export, Split View) */}
              <div className="blueprint-sub-header">
                <div className="sub-header-left">
                  <span className="workspace-title-label">Database Blueprint / visual-schema</span>
                </div>
                <div className="sub-header-right">
                  <button className="icon-btn" title="Share Project" onClick={() => showNotification('Sharing link copied!')}>
                    <Share2 size={15} />
                  </button>
                  <button className="icon-btn" title="Project Settings" onClick={() => showNotification('Settings menu')}>
                    <Settings size={15} />
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ 
                      backgroundColor: (isSplitView && splitViewMode === 'export') ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      borderColor: (isSplitView && splitViewMode === 'export') ? 'var(--accent-blue)' : 'var(--border-color)',
                      color: (isSplitView && splitViewMode === 'export') ? 'var(--accent-blue)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={() => {
                      if (isSplitView && splitViewMode === 'export') {
                        setIsSplitView(false)
                      } else {
                        setIsSplitView(true)
                        setSplitViewMode('export')
                      }
                    }}
                  >
                    <Code size={13} />
                    Split View
                  </button>
                  <button className="btn-secondary" onClick={() => showNotification('Project saved successfully!')}>
                    Save
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{
                      backgroundColor: (isSplitView && splitViewMode === 'export') ? 'rgba(16, 185, 129, 0.2)' : undefined,
                      borderColor: (isSplitView && splitViewMode === 'export') ? '#10b981' : undefined,
                    }}
                    onClick={() => {
                      if (isSplitView && splitViewMode === 'export') {
                        setIsSplitView(false)
                      } else {
                        setIsSplitView(true)
                        setSplitViewMode('export')
                      }
                    }}
                  >
                    <Download size={14} />
                    Export
                  </button>
                </div>
              </div>

              {/* Workspace Area */}
              <div className="workspace-body" style={{ height: 'calc(100% - 48px)' }}>

                {isSplitView && splitViewMode === 'dsl' && (
                  <aside className="split-editor-panel">
                    <div className="macos-header">
                      <div className="macos-left">
                        <span className="macos-title">DataDraft DSL</span>
                      </div>
                      <div className="macos-actions">
                        <button 
                          className="macos-action-btn active"
                          style={{ cursor: 'default' }}
                        >
                          DSL
                        </button>
                        <button 
                          className="macos-action-btn"
                          onClick={() => copyToClipboard(importCode)}
                          title="Copy Shorthand Code"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="split-textarea-wrapper" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: 'calc(100% - 40px)' }}>
                      <div className="code-editor-container" style={{ position: 'relative', width: '100%', height: '100%', flexGrow: 1 }}>
                        <pre 
                          className="code-editor-highlight"
                          dangerouslySetInnerHTML={{ __html: highlightShorthand(importCode) }}
                        />
                        <textarea
                          className="code-editor-textarea"
                          value={importCode}
                          onChange={(e) => setImportCode(e.target.value)}
                          spellCheck="false"
                        />
                      </div>
                    </div>

                    {importError && showToast && (
                      <div className="toast-bar-bottom" style={{ margin: '8px', padding: '6px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#f87171' }}>
                        <span>⚠️ {importError}</span>
                        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowToast(false)}>Dismiss</button>
                      </div>
                    )}
                  </aside>
                )}

                {isSplitView && splitViewMode === 'export' && (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {/* Export Header */}
                    <div className="macos-header" style={{ userSelect: 'none' }}>
                      <div className="macos-left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div 
                          onClick={() => setIsSplitView(false)}
                          style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', cursor: 'pointer', transition: 'opacity 0.2s', position: 'relative' }}
                          title="Cerrar y volver al canvas"
                          className="macos-dot-close"
                        />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
                        <span className="macos-title" style={{ marginLeft: '12px' }}>Script Generator</span>
                      </div>
                      <div className="macos-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="macos-action-btn active" style={{ cursor: 'default' }}>Export</button>
                        <button className="macos-action-btn" onClick={() => { setSplitViewMode('dsl') }}>DSL</button>
                        <button 
                          className="macos-action-btn" 
                          onClick={() => setIsSplitView(false)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            marginLeft: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          Volver al Canvas
                        </button>
                      </div>
                    </div>

                    {/* Export Body */}
                    <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
                      {/* Left: Target DB & Settings */}
                      <div style={{ width: '220px', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: '16px', overflowY: 'auto', background: '#0a0f18' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Target Database</span>
                          {['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Prisma ORM'].map(db => (
                            <div
                              key={db}
                              onClick={() => setTargetDb(db)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginBottom: '2px',
                                fontSize: '12px',
                                fontWeight: targetDb === db ? 600 : 400,
                                color: targetDb === db ? '#38bdf8' : '#94a3b8',
                                background: targetDb === db ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                                border: targetDb === db ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Database size={13} />
                              {db}
                              {targetDb === db && db === 'PostgreSQL' && (
                                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>v15</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid #131924', paddingTop: '16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px', display: 'block' }}>Export Settings</span>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Schema Name</label>
                            <input
                              type="text"
                              value={schemaName}
                              onChange={(e) => setSchemaName(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                background: '#0d1117',
                                border: '1px solid #1e293b',
                                borderRadius: '4px',
                                color: '#e2e8f0',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          {[
                            { label: 'Include DROP statements', checked: includeDrop, onChange: setIncludeDrop },
                            { label: 'Generate relationships (FK)', checked: generateFK, onChange: setGenerateFK },
                            { label: 'Include seed data', checked: includeSeed, onChange: setIncludeSeed },
                          ].map((setting) => (
                            <label
                              key={setting.label}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 0',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: '#cbd5e1'
                              }}
                            >
                              <div
                                onClick={() => setting.onChange(!setting.checked)}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '4px',
                                  border: setting.checked ? '2px solid #38bdf8' : '2px solid #475569',
                                  background: setting.checked ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                  flexShrink: 0
                                }}
                              >
                                {setting.checked && <Check size={10} style={{ color: '#38bdf8' }} />}
                              </div>
                              {setting.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Right: SQL Preview */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Preview Header */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderBottom: '1px solid #1e293b',
                          background: '#0d1117'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>{targetDb} Dialect</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => copyToClipboard(generateExportSQL())}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                background: 'rgba(148, 163, 184, 0.08)',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                color: '#94a3b8',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {copied ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                              Copy to Clipboard
                            </button>
                            <button
                              onClick={handleDownloadSQL}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '4px',
                                color: '#38bdf8',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Download size={11} />
                              Download .sql
                            </button>
                          </div>
                        </div>

                        {/* SQL Code Preview */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#080c14', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
                          <pre style={{ margin: 0, fontSize: '12px', lineHeight: '1.7', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {generateExportSQL().split('\n').map((line, i) => {
                              let highlighted = line

                              if (line.trim().startsWith('--')) {
                                return <span key={i} style={{ color: '#475569' }}>{line}{'\n'}</span>
                              }

                              const keywords = ['CREATE', 'TABLE', 'DROP', 'IF', 'NOT', 'EXISTS', 'CASCADE', 'PRIMARY', 'KEY', 'DEFAULT', 'REFERENCES', 'ON', 'DELETE', 'CHECK', 'IN', 'INDEX', 'COMMIT', 'EXTENSION', 'DATABASE', 'USE', 'UNIQUE', 'NULL', 'BEGIN', 'FOREIGN']
                              const parts: React.ReactNode[] = []
                              const tokens = highlighted.split(/([\s,();]+)/)
                              tokens.forEach((token, ti) => {
                                const upperToken = token.toUpperCase()
                                if (keywords.includes(upperToken)) {
                                  parts.push(<span key={`${i}-${ti}`} style={{ color: '#f472b6', fontWeight: 600 }}>{token}</span>)
                                } else if (/^['"].*['"]$/.test(token) || /^'.*'$/.test(token)) {
                                  parts.push(<span key={`${i}-${ti}`} style={{ color: '#34d399' }}>{token}</span>)
                                } else if (/^(uuid_generate_v4|NOW|CURRENT_TIMESTAMP|JSONB|TINYINT|BOOLEAN|VARCHAR|INTEGER|INT|DECIMAL|REAL|TEXT|UUID|CHAR|TIMESTAMP|DATETIME)/.test(upperToken)) {
                                  parts.push(<span key={`${i}-${ti}`} style={{ color: '#38bdf8' }}>{token}</span>)
                                } else if (/^".*"$/.test(token) || /^`.*`$/.test(token)) {
                                  parts.push(<span key={`${i}-${ti}`} style={{ color: '#fbbf24' }}>{token}</span>)
                                } else {
                                  parts.push(<span key={`${i}-${ti}`}>{token}</span>)
                                }
                              })
                              return <span key={i}>{parts}{'\n'}</span>
                            })}
                          </pre>
                        </div>

                        {/* Bottom Info Bar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderTop: '1px solid #1e293b',
                          background: '#0d1117'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Optimized for {targetDb}</span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#475569' }}>
                            {targetDb === 'PostgreSQL' && 'Using native UUID and JSONB types for compatibility with PostgreSQL 15+.'}
                            {targetDb === 'MySQL' && 'Using CHAR(36) for UUID and TINYINT for Boolean for MySQL 8+ compatibility.'}
                            {targetDb === 'SQLite' && 'Using TEXT-based types for maximum SQLite compatibility.'}
                            {targetDb === 'MongoDB' && 'Schema definition for MongoDB document validation.'}
                            {targetDb === 'Prisma ORM' && 'Prisma-compatible schema structure.'}
                          </span>
                        </div>

                        {/* Export Notification */}
                        {exportNotification && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderTop: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Check size={14} style={{ color: '#10b981' }} />
                              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>{exportNotification}</span>
                            </div>
                            <button
                              onClick={() => setExportNotification(null)}
                              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!(isSplitView && splitViewMode === 'export') && (
                  <>
                    <main 
                      className="canvas-grid"
                      ref={canvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                    >
                  <div 
                    className="canvas-content"
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
                      transformOrigin: '0 0'
                    }}
                  >
                    {/* SVG Connector lines */}
                    <svg className="connections-svg" style={{ pointerEvents: 'none' }}>
                      {relationLines.map((line) => (
                        <path
                          key={line.id}
                          d={line.path}
                          className={`connection-line ${selectedRelationId === line.id ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRelationId(line.id)
                            setSelectedTableId(null)
                          }}
                          style={{ pointerEvents: 'visibleStroke', cursor: 'pointer' }}
                        />
                      ))}

                      {relationDragging && (() => {
                        const sourceTable = tables.find(t => t.id === relationDragging.sourceTableId)
                        if (!sourceTable) return null
                        const colIdx = sourceTable.columns.findIndex(c => c.id === relationDragging.sourceColumnId)
                        if (colIdx === -1) return null

                        const rowHeight = 35
                        const headerHeight = 38
                        const sourceOnRight = sourceTable.x > relationDragging.currentX
                        const xSource = sourceTable.x + (sourceOnRight ? 0 : 210)
                        const ySource = sourceTable.y + headerHeight + colIdx * rowHeight + rowHeight / 2

                        const xTarget = relationDragging.currentX
                        const yTarget = relationDragging.currentY

                        const offset = Math.abs(xSource - xTarget) / 2
                        const cp1x = sourceOnRight ? xSource - offset : xSource + offset
                        const cp2x = sourceOnRight ? xTarget + offset : xTarget - offset

                        const path = `M ${xSource} ${ySource} C ${cp1x} ${ySource}, ${cp2x} ${yTarget}, ${xTarget} ${yTarget}`

                        return (
                          <path
                            d={path}
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            fill="none"
                          />
                        )
                      })()}
                    </svg>

                    {/* Floating Relation Delete Buttons */}
                    {relationLines.map((line) => {
                      if (selectedRelationId !== line.id) return null
                      return (
                        <button
                          key={`del_${line.id}`}
                          className="delete-relation-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRelation(line.sourceTableId, line.sourceColumnId)
                          }}
                          style={{
                            position: 'absolute',
                            left: `${line.midX}px`,
                            top: `${line.midY}px`,
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 0 6px #ef4444',
                            zIndex: 100,
                            fontSize: '10px',
                            lineHeight: 1
                          }}
                          title="Delete Relation"
                        >
                          ✕
                        </button>
                      )
                    })}

                    {/* Table Cards */}
                    {filteredTables.map((table) => (
                      <div
                        key={table.id}
                        className={`table-node ${selectedTableId === table.id ? 'selected' : ''}`}
                        style={{
                          left: `${table.x}px`,
                          top: `${table.y}px`
                        }}
                      >
                        <div
                          className="table-node-header"
                          onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                        >
                          <Database size={12} className="header-icon" style={{ marginRight: '6px' }} />
                          <span className="table-node-title">{table.name}</span>
                          <button
                            className="btn-delete-table"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTable(table.id)
                            }}
                            title="Eliminar Tabla"
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        <div className="table-node-columns">
                          {table.columns.map((col) => (
                            <div
                              key={col.id}
                              className={`column-row ${col.isPrimaryKey ? 'primary-key-row' : ''} ${col.isForeignKey ? 'foreign-key-row' : ''}`}
                              onMouseUp={(e) => {
                                if (relationDragging) {
                                  handleRelationDragEnd(e, table.id, col.id)
                                }
                              }}
                            >
                              <span className="col-name-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {col.isPrimaryKey && <Key size={10} className="col-key-icon pk" style={{ color: '#f59e0b' }} />}
                                {col.isForeignKey && <Link2 size={10} className="col-key-icon fk" style={{ color: '#10b981' }} />}
                                <span className="col-name">{col.name}</span>
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="col-type" style={{ color: '#64748b', fontSize: '11px' }}>{col.type}</span>
                                <div 
                                  className="relation-drag-dot" 
                                  title="Drag to link relation"
                                  onMouseDown={(e) => handleRelationDragStart(e, table.id, col.id)}
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#10b981',
                                    cursor: 'crosshair',
                                    border: '1.5px solid #0d1117',
                                    boxShadow: '0 0 4px #10b981'
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

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
                <aside className={`right-panel ${isPropertiesCollapsed ? 'collapsed' : ''}`}>
                  <div 
                    className="properties-toggle-btn"
                    onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
                    title={isPropertiesCollapsed ? 'Expandir Propiedades' : 'Colapsar Propiedades'}
                  >
                    {isPropertiesCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                  </div>
                  {selectedTable ? (
                    <>
                      <div className="panel-header">
                        <h2>Table Properties</h2>
                        <button className="icon-btn" onClick={() => setSelectedTableId(null)}>
                          <X size={15} />
                        </button>
                      </div>

                      <div className="panel-body">
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
                              if (c.type === 'String') typeStr = 'UUID'
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
                  </>
                )}
              </div>

            </div>
          )}

          {activeMasterTab !== 'home' && activeMasterTab !== 'blueprint' && activeMasterTab !== 'profile' && activeMasterTab !== 'docify' && (
            <div className="placeholder-tab-content" style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <h2>{activeMasterTab.toUpperCase()} Module</h2>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>This component is fully active and synchronized with production environment.</p>
            </div>
          )}

          {activeMasterTab === 'docify' && (
            <div className="docify-workspace-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px', gap: '20px', height: 'calc(100vh - 80px)', overflow: 'hidden', background: '#0a0f1d', color: '#e2e8f0', boxSizing: 'border-box' }}>
              
              {/* Top Repository Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '8px 16px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <Link2 size={16} style={{ color: '#64748b' }} />
                <input
                  type="text"
                  value={docifyRepoUrl}
                  onChange={(e) => setDocifyRepoUrl(e.target.value)}
                  placeholder="https://github.com/usuario/repo-name"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    flex: 1,
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={startDocifyAnalysis}
                  disabled={docifyStatus !== 'idle' && docifyStatus !== 'ready'}
                  style={{
                    background: (docifyStatus !== 'idle' && docifyStatus !== 'ready') ? '#1e293b' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 24px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: (docifyStatus !== 'idle' && docifyStatus !== 'ready') ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: (docifyStatus !== 'idle' && docifyStatus !== 'ready') ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  {docifyStatus !== 'idle' && docifyStatus !== 'ready' ? (
                    <Loader2 size={13} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Activity size={13} />
                  )}
                  Analyze
                </button>
              </div>

              {/* Two-Column Grid */}
              <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
                
                {/* Left Panel: Agent Status */}
                <div style={{
                  width: '320px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      margin: '0 0 16px 0'
                    }}>Agent Status</h3>

                    {/* Stepper items wrapper with vertical line */}
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Vertical connector line */}
                      <div style={{
                        position: 'absolute',
                        left: '11px',
                        top: '16px',
                        bottom: '16px',
                        width: '2px',
                        background: '#1e293b',
                        zIndex: 1
                      }} />

                      {/* Step 1: Cloning */}
                      <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: docifyLoadingStep >= 2 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 1 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                          border: docifyLoadingStep >= 2 ? '2px solid #10b981' : (docifyLoadingStep === 1 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {docifyLoadingStep >= 2 ? (
                            <Check size={12} style={{ color: '#10b981' }} />
                          ) : (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: docifyLoadingStep === 1 ? '#3b82f6' : '#475569'
                            }} />
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 1 ? 600 : 500, color: docifyLoadingStep === 1 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Cloning repository...</h4>
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {docifyLoadingStep >= 2 ? 'Fetched 1.2GB from origin/main' : (docifyLoadingStep === 1 ? 'Connecting to github.com...' : 'Pending execution')}
                          </span>
                        </div>
                      </div>

                      {/* Step 2: Filtering */}
                      <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: docifyLoadingStep >= 3 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 2 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                          border: docifyLoadingStep >= 3 ? '2px solid #10b981' : (docifyLoadingStep === 2 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {docifyLoadingStep >= 3 ? (
                            <Check size={12} style={{ color: '#10b981' }} />
                          ) : (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: docifyLoadingStep === 2 ? '#3b82f6' : '#475569'
                            }} />
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 2 ? 600 : 500, color: docifyLoadingStep === 2 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Filtering files...</h4>
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {docifyLoadingStep >= 3 ? '452 files processed, 21 ignored' : (docifyLoadingStep === 2 ? 'Analyzing directory structure...' : 'Pending current process')}
                          </span>
                        </div>
                      </div>

                      {/* Step 3: Generating */}
                      <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: docifyLoadingStep >= 4 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 3 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                          border: docifyLoadingStep >= 4 ? '2px solid #10b981' : (docifyLoadingStep === 3 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {docifyLoadingStep >= 4 ? (
                            <Check size={12} style={{ color: '#10b981' }} />
                          ) : (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: docifyLoadingStep === 3 ? '#3b82f6' : '#475569'
                            }} />
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 3 ? 600 : 500, color: docifyLoadingStep === 3 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Generating JSON...</h4>
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {docifyLoadingStep >= 4 ? 'Extracting signatures completed' : (docifyLoadingStep === 3 ? 'Extracting signatures: Step 4/12' : 'Pending current process')}
                          </span>
                        </div>
                      </div>

                      {/* Step 4: Converting */}
                      <div style={{ display: 'flex', gap: '16px', zIndex: 2 }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: docifyLoadingStep >= 5 ? 'rgba(16, 185, 129, 0.15)' : (docifyLoadingStep === 4 ? 'rgba(59, 130, 246, 0.15)' : '#0f172a'),
                          border: docifyLoadingStep >= 5 ? '2px solid #10b981' : (docifyLoadingStep === 4 ? '2px solid #3b82f6' : '2px solid #1e293b'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {docifyLoadingStep >= 5 ? (
                            <Check size={12} style={{ color: '#10b981' }} />
                          ) : (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: docifyLoadingStep === 4 ? '#3b82f6' : '#475569'
                            }} />
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: docifyLoadingStep === 4 ? 600 : 500, color: docifyLoadingStep === 4 ? '#f8fafc' : '#94a3b8', margin: 0 }}>Converting to Doc...</h4>
                          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {docifyLoadingStep >= 5 ? 'Document generated successfully' : (docifyLoadingStep === 4 ? 'Formating layout & syntax...' : 'Pending current process')}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Agent Config bottom card */}
                  <div style={{
                    marginTop: 'auto',
                    background: 'rgba(30, 41, 59, 0.25)',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings size={14} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>Agent Config</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Infrastructure v2.4 running with signature extraction enabled.
                    </p>
                  </div>

                </div>

                {/* Right Panel: File Preview */}
                <div style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  
                  {/* File Header */}
                  <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(15, 23, 42, 0.2)'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6'
                    }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                        {docifyRepoUrl ? `${docifyRepoUrl.split('/').pop()}-docs.docx` : 'repo-name-docs.docx'}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>Generated Documentation · Draft v1.0</span>
                    </div>
                  </div>

                  {/* Body Preview Canvas */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0d111c',
                    position: 'relative',
                    padding: '24px',
                    overflowY: 'auto'
                  }}>
                    
                    {docifyStatus === 'idle' && (
                      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                        <FileText size={32} style={{ color: '#475569', marginBottom: '12px' }} />
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Analysis</h4>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Ingresa la URL del repositorio de Git y presiona "Analyze" para generar la documentación del código.</p>
                      </div>
                    )}

                    {(docifyStatus !== 'idle' && docifyStatus !== 'ready') && (
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        zIndex: 10
                      }}>
                        <Loader2 size={16} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.05em' }}>PREVIEW GENERATING...</span>
                      </div>
                    )}

                     {docifyStatus === 'ready' && (() => {
                      const info = getRepoDocInfo(docifyRepoUrl);
                      return (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: '#080c14',
                          borderRadius: '6px',
                          border: '1px solid #1e293b',
                          padding: '24px',
                          fontFamily: '"Inter", sans-serif',
                          color: '#cbd5e1',
                          textAlign: 'left',
                          boxSizing: 'border-box'
                        }}>
                          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginTop: 0 }}>
                            Documentación de Código: {info.repoName}
                          </h1>
                          <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#94a3b8', marginBottom: '20px' }}>
                            Stack principal: <strong style={{ color: '#3b82f6' }}>{info.techStack}</strong>. Esta guía detalla la arquitectura técnica por sesiones del proyecto.
                          </p>

                          {info.sections.map((sec, sidx) => (
                            <div key={sidx} style={{ marginBottom: '24px' }}>
                              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6', borderBottom: '1px solid #1e293b', paddingBottom: '6px', margin: '16px 0 10px 0' }}>
                                {sec.title}
                              </h2>
                              <ul style={{ paddingLeft: '20px', fontSize: '12px', lineHeight: '1.8', color: '#cbd5e1', margin: 0 }}>
                                {sec.items.map((item, iidx) => (
                                  <li key={iidx} style={{ marginBottom: '6px' }}>
                                    <strong style={{ color: '#f8fafc' }}>{item.name}</strong>: {item.desc}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                  </div>

                  {/* Actions Status Bar Footer */}
                  <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #1e293b',
                    background: 'rgba(15, 23, 42, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'block' }}></span>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agent Live</span>
                      <span style={{ fontSize: '11px', color: '#475569' }}>| Automatic sync enabled</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleDownloadDocifyDoc}
                        disabled={docifyStatus !== 'ready'}
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: docifyStatus === 'ready' ? '#f8fafc' : '#475569',
                          padding: '6px 16px',
                          fontSize: '12px',
                          cursor: docifyStatus === 'ready' ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 500
                        }}
                      >
                        <Download size={13} />
                        Download Doc
                      </button>

                      <button
                        onClick={() => {
                          if (docifyStatus !== 'ready') return;
                          showNotification('Confirmando cambios al repositorio de Git...');
                        }}
                        disabled={docifyStatus !== 'ready'}
                        style={{
                          background: docifyStatus === 'ready' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '6px',
                          color: docifyStatus === 'ready' ? '#3b82f6' : '#475569',
                          padding: '6px 16px',
                          fontSize: '12px',
                          cursor: docifyStatus === 'ready' ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600
                        }}
                      >
                        <GitBranch size={13} />
                        Commit to Git
                      </button>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {activeMasterTab === 'profile' && (
            <UserProfileView
              userName={loggedInUserName}
              setAuthScreen={setAuthScreen}
              showNotification={showNotification}
            />
          )}
        </main>

        {/* Master Bottom Status Bar */}
        <footer className="master-bottom-status-bar">
          <div className="status-left">
            <span className="status-indicator">
              <span className="status-dot green"></span>
              Gateway: Connected
            </span>
            <span className="status-separator">•</span>
            <span className="status-branch" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <GitBranch size={11} />
              main @ 7f2a1b9
            </span>
          </div>
          <div className="status-right">
            <span>UTC: {new Date().toISOString().slice(11, 19)}</span>
            <span className="status-separator">•</span>
            <span>Node: v18.12.1</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
