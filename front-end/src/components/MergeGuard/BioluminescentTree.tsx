import React, { useState } from 'react';

// Real Git Data from the repository
const branchesData = [
  {
    id: 'main',
    name: 'main',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 500 300 L 490 200 L 510 100', // Center upward
    ],
    commits: [
      { id: 'ea90a55', x: 500, y: 300, label: '', r: 24 },
      { id: '4d18a56', x: 490, y: 200, label: '', r: 16 }
    ]
  },
  {
    id: 'feat-map',
    name: 'feat/bioluminescent-map',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 485 400 L 380 370 L 280 340 L 180 280 L 100 200',
    ],
    commits: [
      { id: 'b0e7e4c', x: 380, y: 370, label: 'Commit nodes', r: 18 },
      { id: '980e988', x: 280, y: 340, label: '', r: 14 },
      { id: '2231258', x: 180, y: 280, label: '', r: 14 },
      { id: 'd35e55e', x: 100, y: 200, label: 'feat/bioluminescent-map', r: 18 }
    ]
  },
  {
    id: 'feat-1',
    name: 'feat/bluminescent-1',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 465 420 L 360 400 L 260 370 L 160 310',
    ],
    commits: [
      { id: 'f1_c1', x: 360, y: 400, label: '', r: 18 },
      { id: 'f1_c2', x: 260, y: 370, label: '', r: 14 },
      { id: 'f1_c3', x: 160, y: 310, label: 'feat/bluminescent-1', r: 14 }
    ]
  },
  {
    id: 'feat-oranogn',
    name: 'feat/biolouiloper-oranogn',
    color: '#4ade80',
    glow: 'glow-green',
    paths: [
      'M 470 340 L 370 310 L 270 250 L 170 170',
    ],
    commits: [
      { id: 'fo_c1', x: 370, y: 310, label: 'Commit nodes', r: 16 },
      { id: 'fo_c2', x: 270, y: 250, label: 'feat/biolouiloper-oranogn', r: 16 },
      { id: 'fo_c3', x: 170, y: 170, label: '', r: 16 }
    ]
  },
  {
    id: 'release-v2.1',
    name: 'release/v2.1',
    color: '#3b82f6',
    glow: 'glow-blue',
    paths: [
      'M 515 400 L 620 370 L 750 320 L 850 240',
    ],
    commits: [
      { id: 'r_c1', x: 620, y: 370, label: 'release/v2.1', r: 18 },
      { id: 'r_c2', x: 750, y: 320, label: '', r: 16 },
      { id: 'r_c3', x: 850, y: 240, label: 'release/v2.1', r: 18 }
    ]
  },
  {
    id: 'hotfix',
    name: 'hotfix/conflict-resolution',
    color: '#3b82f6',
    glow: 'glow-blue',
    paths: [
      'M 525 450 L 650 420 L 780 380 L 900 320',
    ],
    commits: [
      { id: 'h_c1', x: 650, y: 420, label: 'hotfix/conflict-resolution', r: 16 },
      { id: 'h_c2', x: 780, y: 380, label: 'Commit nodes', r: 16 },
      { id: 'h_c3', x: 900, y: 320, label: '', r: 16 }
    ]
  },
  {
    id: 'conflict1',
    name: 'conflict #1',
    color: '#f43f5e',
    glow: 'glow-red',
    paths: [
      'M 520 500 L 660 510 L 780 490 L 900 450',
    ],
    commits: [
      { id: 'c1_c1', x: 660, y: 510, label: 'conflict #1', r: 16 }
    ]
  },
  {
    id: 'conflict2',
    name: 'conflict #2',
    color: '#f43f5e',
    glow: 'glow-red',
    paths: [
      'M 530 600 L 680 620 L 820 600 L 950 560',
    ],
    commits: [
      { id: 'c2_c1', x: 680, y: 620, label: 'conflict #2', r: 16 },
      { id: 'c2_c2', x: 820, y: 600, label: 'Commit nodes', r: 14 }
    ]
  }
];

const GeoNode = ({ cx, cy, r, color, filter }: { cx: number, cy: number, r: number, color: string, filter?: string }) => {
  const pts = {
    p0: `${cx},${cy - r}`,
    p1: `${cx + r * 0.866},${cy - r * 0.5}`,
    p2: `${cx + r * 0.866},${cy + r * 0.5}`,
    p3: `${cx},${cy + r}`,
    p4: `${cx - r * 0.866},${cy + r * 0.5}`,
    p5: `${cx - r * 0.866},${cy - r * 0.5}`,
    i0: `${cx},${cy - r * 0.3}`,
    i1: `${cx + r * 0.4},${cy + r * 0.2}`,
    i2: `${cx - r * 0.4},${cy + r * 0.2}`,
  };

  return (
    <g filter={filter}>
      <polygon points={`${pts.p0} ${pts.p1} ${pts.p2} ${pts.p3} ${pts.p4} ${pts.p5}`} fill={color} opacity="0.4" />
      <polygon points={`${pts.p0} ${pts.p1} ${pts.p2} ${pts.p3} ${pts.p4} ${pts.p5}`} fill="none" stroke={color} strokeWidth="2.5" />
      <polygon points={`${pts.i0} ${pts.i1} ${pts.i2}`} fill="none" stroke={color} strokeWidth="2" />
      <path d={`M ${pts.p0} L ${pts.i0} M ${pts.p1} L ${pts.i0} M ${pts.p1} L ${pts.i1} M ${pts.p2} L ${pts.i1} M ${pts.p3} L ${pts.i1} M ${pts.p3} L ${pts.i2} M ${pts.p4} L ${pts.i2} M ${pts.p5} L ${pts.i2} M ${pts.p5} L ${pts.i0}`} fill="none" stroke={color} strokeWidth="1.5" opacity="0.9" />
      <circle cx={cx} cy={cy} r={r * 0.2} fill="#fff" />
    </g>
  );
};


const BioluminescentTree: React.FC = () => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const zoomAmount = e.deltaY * -0.002;
    setTransform(prev => {
       const newScale = Math.max(0.3, Math.min(4, prev.scale + zoomAmount));
       return { ...prev, scale: newScale };
    });
  };

  const handleZoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(4, prev.scale + 0.2) }));
  const handleZoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale - 0.2) }));
  const handleZoomReset = () => setTransform({ x: 0, y: 0, scale: 1 });

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const scaleRatio = Math.min(svgRect.width / 1000, svgRect.height / 950) * transform.scale;
    
    setTransform(prev => ({
      ...prev,
      x: prev.x + e.movementX / scaleRatio,
      y: prev.y + e.movementY / scaleRatio
    }));
  };
  
  // Crystal Faceted Trunk Generator
  const levels = 6;
  const grid = Array.from({ length: levels }).map((_, i) => {
    const y = 800 - i * 100;
    const rOuter = 80 - i * 13; 
    const rInner = 35 - i * 6;
    const yOffset = (i % 2 === 0) ? 15 : -15; // Creates the zig-zag faceting
    return {
      lo: { x: 500 - rOuter, y: y + yOffset },
      li: { x: 500 - rInner, y },
      c:  { x: 500, y: y - yOffset },
      ri: { x: 500 + rInner, y },
      ro: { x: 500 + rOuter, y: y + yOffset }
    };
  });

  const polygons = [];
  const lines = [];

  for (let i = 0; i < levels - 1; i++) {
    const row = grid[i];
    const next = grid[i+1];

    // Left outer to Left inner
    polygons.push({ pts: `${row.lo.x},${row.lo.y} ${row.li.x},${row.li.y} ${next.li.x},${next.li.y}`, op: 0.15 });
    polygons.push({ pts: `${row.lo.x},${row.lo.y} ${next.li.x},${next.li.y} ${next.lo.x},${next.lo.y}`, op: 0.25 });
    
    // Left inner to Center
    polygons.push({ pts: `${row.li.x},${row.li.y} ${row.c.x},${row.c.y} ${next.c.x},${next.c.y}`, op: 0.35 });
    polygons.push({ pts: `${row.li.x},${row.li.y} ${next.c.x},${next.c.y} ${next.li.x},${next.li.y}`, op: 0.45 });

    // Center to Right inner
    polygons.push({ pts: `${row.c.x},${row.c.y} ${row.ri.x},${row.ri.y} ${next.ri.x},${next.ri.y}`, op: 0.35 });
    polygons.push({ pts: `${row.c.x},${row.c.y} ${next.ri.x},${next.ri.y} ${next.c.x},${next.c.y}`, op: 0.25 });

    // Right inner to Right outer
    polygons.push({ pts: `${row.ri.x},${row.ri.y} ${row.ro.x},${row.ro.y} ${next.ro.x},${next.ro.y}`, op: 0.15 });
    polygons.push({ pts: `${row.ri.x},${row.ri.y} ${next.ro.x},${next.ro.y} ${next.ri.x},${next.ri.y}`, op: 0.2 });

    // Lines for the wireframe structure
    lines.push(`M ${row.lo.x} ${row.lo.y} L ${next.lo.x} ${next.lo.y}`);
    lines.push(`M ${row.li.x} ${row.li.y} L ${next.li.x} ${next.li.y}`);
    lines.push(`M ${row.c.x} ${row.c.y} L ${next.c.x} ${next.c.y}`);
    lines.push(`M ${row.ri.x} ${row.ri.y} L ${next.ri.x} ${next.ri.y}`);
    lines.push(`M ${row.ro.x} ${row.ro.y} L ${next.ro.x} ${next.ro.y}`);
    
    // Cross lines
    lines.push(`M ${row.lo.x} ${row.lo.y} L ${row.li.x} ${row.li.y} L ${row.c.x} ${row.c.y} L ${row.ri.x} ${row.ri.y} L ${row.ro.x} ${row.ro.y}`);
    lines.push(`M ${row.lo.x} ${row.lo.y} L ${next.li.x} ${next.li.y}`);
    lines.push(`M ${row.li.x} ${row.li.y} L ${next.c.x} ${next.c.y}`);
    lines.push(`M ${row.c.x} ${row.c.y} L ${next.ri.x} ${next.ri.y}`);
    lines.push(`M ${row.ri.x} ${row.ri.y} L ${next.ro.x} ${next.ro.y}`);
  }

  // Generate geometric roots
  const roots = [
    { pts: `300,880 ${grid[0].lo.x},${grid[0].lo.y} ${grid[0].li.x},${grid[0].li.y} 350,860`, op: 0.2 },
    { pts: `350,860 ${grid[0].li.x},${grid[0].li.y} ${grid[0].c.x},${grid[0].c.y} 420,890`, op: 0.3 },
    { pts: `420,890 ${grid[0].c.x},${grid[0].c.y} ${grid[0].ri.x},${grid[0].ri.y} 580,890`, op: 0.3 },
    { pts: `580,890 ${grid[0].ri.x},${grid[0].ri.y} ${grid[0].ro.x},${grid[0].ro.y} 700,880`, op: 0.2 },
  ];
  const rootLines = [
    `M 300 880 L ${grid[0].lo.x} ${grid[0].lo.y}`,
    `M 350 860 L ${grid[0].li.x} ${grid[0].li.y}`,
    `M 420 890 L ${grid[0].c.x} ${grid[0].c.y}`,
    `M 580 890 L ${grid[0].ri.x} ${grid[0].ri.y}`,
    `M 700 880 L ${grid[0].ro.x} ${grid[0].ro.y}`
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 1000 950" 
        preserveAspectRatio="xMidYMid meet" 
        style={{ pointerEvents: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Nebulas (Static Background) */}
        <ellipse cx="500" cy="250" rx="450" ry="300" fill="url(#nebula-purple)" filter="blur(80px)" opacity="0.4" />
        <ellipse cx="500" cy="650" rx="350" ry="250" fill="url(#nebula-green)" filter="blur(70px)" opacity="0.4" />

        <defs>
          <radialGradient id="nebula-purple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="nebula-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Intense Glow Filters */}
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="15" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge><feMergeNode in="blur2" /><feMergeNode in="blur1" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Structured Canopy Background (Hexagonal web pattern) */}
        <g opacity="0.25" stroke="#a78bfa" strokeWidth="2" filter="url(#glow-purple)">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={`canopy-1-${i}`} d={`M ${100 + i*100} 100 L ${150 + i*100} 200 L ${100 + i*100} 300`} fill="none" strokeLinejoin="round" />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={`canopy-2-${i}`} d={`M ${150 + i*100} 200 L ${250 + i*100} 200`} fill="none" />
          ))}
          <path d="M 100 100 L 900 100 M 100 300 L 900 300" fill="none" strokeDasharray="10,20" />
        </g>

        {/* MAIN TRUNK - Crystal Faceted Lattice */}
        <g filter="url(#glow-green)">
          {/* Base outer glow */}
          <polygon points="400,850 480,300 520,300 600,850" fill="#10b981" opacity="0.1" />
          
          {/* Trunk Faces */}
          {polygons.map((poly, idx) => (
            <polygon key={`trunk-face-${idx}`} points={poly.pts} fill={`rgba(34, 197, 94, ${poly.op})`} />
          ))}
          
          {/* Root Faces */}
          {roots.map((root, idx) => (
            <polygon key={`root-face-${idx}`} points={root.pts} fill={`rgba(34, 197, 94, ${root.op})`} />
          ))}

          {/* Wireframe Structure Lines */}
          <g stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" opacity="0.9">
            {lines.map((line, idx) => (
              <path key={`trunk-line-${idx}`} d={line} fill="none" />
            ))}
            {rootLines.map((line, idx) => (
              <path key={`root-line-${idx}`} d={line} fill="none" />
            ))}
          </g>

          {/* Intense central spine */}
          <path d={`M ${grid[0].c.x} ${grid[0].c.y} L ${grid[1].c.x} ${grid[1].c.y} L ${grid[2].c.x} ${grid[2].c.y} L ${grid[3].c.x} ${grid[3].c.y} L ${grid[4].c.x} ${grid[4].c.y} L ${grid[5].c.x} ${grid[5].c.y}`} fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.9" strokeLinejoin="round" />
        </g>

        {/* Render Branches & Commits */}
        {branchesData.map((branch) => (
          <g key={branch.id}>
            {branch.paths.map((pathStr, i) => (
              <g key={`${branch.id}-path-${i}`}>
                {/* Thick aura */}
                <path d={pathStr} fill="none" stroke={branch.color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" filter={branch.glow ? `url(#${branch.glow})` : undefined} opacity={0.3} />
                {/* Main line - Geometric and sharp */}
                <path d={pathStr} fill="none" stroke={branch.color} strokeWidth={i === 0 ? "5" : "2"} strokeLinecap="round" strokeLinejoin="round" filter={branch.glow ? `url(#${branch.glow})` : undefined} opacity={0.9} />
                {/* Core bright center for main branch paths */}
                {i === 0 && <path d={pathStr} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />}
              </g>
            ))}

            {/* Commits (Nodes) */}
            {branch.commits.map((commit) => (
              <GeoNode key={commit.id} cx={commit.x} cy={commit.y} r={commit.r || 16} color={branch.color} filter={branch.glow ? `url(#${branch.glow})` : undefined} />
            ))}
          </g>
        ))}

        {/* Major Intersection Nodes on Trunk */}
        <GeoNode cx={grid[2].c.x} cy={grid[2].c.y} r={32} color="#4ade80" filter="url(#glow-green)" />
        <GeoNode cx={grid[4].c.x} cy={grid[4].c.y} r={26} color="#4ade80" filter="url(#glow-green)" />

        {/* Root Commits (at the ends of the roots) */}
        <GeoNode cx={300} cy={880} r={18} color="#22c55e" filter="url(#glow-green)" />
        <GeoNode cx={500} cy={880} r={18} color="#22c55e" filter="url(#glow-green)" />
        <GeoNode cx={700} cy={880} r={18} color="#22c55e" filter="url(#glow-green)" />

        {/* Labels */}
        <text x="560" y="550" fill="#4ade80" fontSize="16" fontWeight="bold" filter="url(#glow-green)" letterSpacing="3">MAIN</text>
        <text x="560" y="570" fill="#4ade80" fontSize="16" fontWeight="bold" filter="url(#glow-green)" letterSpacing="3">TRUNK</text>
        
        <text x="500" y="820" fill="#94a3b8" fontSize="14" textAnchor="middle" letterSpacing="1">Project Foundation (Commits)</text>

      {/* HTML Overlays for commit labels moved inside SVG for perfect scaling */}
      {branchesData.map((branch) =>
        branch.commits.map((commit) => {
          if (!commit.label) return null;
          return (
            <foreignObject
              key={`label-${commit.id}`}
              x={commit.x + 15}
              y={commit.y - 35}
              width="250"
              height="60"
              style={{ overflow: 'visible' }}
            >
              <div
                className="commit-label"
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  color: branch.color || '#e2e8f0',
                  background: 'rgba(20, 25, 40, 0.8)',
                  border: `1px solid ${branch.color ? branch.color + '55' : 'rgba(255, 255, 255, 0.1)'}`,
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                {commit.label}
              </div>
            </foreignObject>
          );
        })
      )}
      
      {/* Root commit labels */}
      <foreignObject x="285" y="895" width="100" height="40" style={{ overflow: 'visible' }}>
        <div className="commit-label" style={{ position: 'relative', color: '#4ade80', background: 'rgba(20, 25, 40, 0.8)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', display: 'inline-block' }}>ca3f4g</div>
      </foreignObject>
      <foreignObject x="485" y="895" width="100" height="40" style={{ overflow: 'visible' }}>
        <div className="commit-label" style={{ position: 'relative', color: '#4ade80', background: 'rgba(20, 25, 40, 0.8)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', display: 'inline-block' }}>6d2e1a</div>
      </foreignObject>
      <foreignObject x="685" y="895" width="100" height="40" style={{ overflow: 'visible' }}>
        <div className="commit-label" style={{ position: 'relative', color: '#4ade80', background: 'rgba(20, 25, 40, 0.8)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', display: 'inline-block' }}>8b1d9c</div>
      </foreignObject>

      {/* Branch Name Path Labels */}
      <text x="180" y="290" fill="#4ade80" fontSize="13" fontWeight="bold" letterSpacing="1" filter="url(#glow-green)" transform="rotate(50 180 290)">feat/bioluminescent-map</text>
      
      <text x="240" y="380" fill="#4ade80" fontSize="13" fontWeight="bold" letterSpacing="1" filter="url(#glow-green)" transform="rotate(40 240 380)">feat/bluminescent-1</text>
      
      <text x="300" y="200" fill="#4ade80" fontSize="13" fontWeight="bold" letterSpacing="1" filter="url(#glow-green)" transform="rotate(50 300 200)">feat/biolouiloper-oranogn</text>
      
      <text x="630" y="270" fill="#3b82f6" fontSize="13" fontWeight="bold" letterSpacing="1" filter="url(#glow-cyan)" transform="rotate(-40 630 270)">release/v2.1</text>

      {/* Upper Canopy Labels */}
      <foreignObject x="650" y="100" width="250" height="60" style={{ overflow: 'visible' }}>
        <div className="commit-label" style={{ position: 'relative', color: '#a78bfa', fontSize: '14px', border: 'none', background: 'rgba(20, 25, 40, 0.6)', padding: '8px 16px', borderRadius: '20px', transform: 'none', left: 'auto', top: 'auto', display: 'inline-block' }}>Project Overview (Canopy)</div>
      </foreignObject>
      <foreignObject x="850" y="70" width="150" height="40" style={{ overflow: 'visible' }}>
        <div className="commit-label" style={{ position: 'relative', color: '#94a3b8', fontSize: '12px', border: 'none', transform: 'none', left: 'auto', top: 'auto', display: 'inline-block' }}>3 conflict(s)</div>
      </foreignObject>
        </g>
      </svg>

      {/* Zoom Controls */}
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto', zIndex: 10 }}>
        <button onClick={handleZoomIn} style={{ background: 'rgba(20, 25, 40, 0.8)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
        <button onClick={handleZoomOut} style={{ background: 'rgba(20, 25, 40, 0.8)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
        <button onClick={handleZoomReset} style={{ background: 'rgba(20, 25, 40, 0.8)', border: '1px solid rgba(167, 139, 250, 0.3)', color: '#a78bfa', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>RESET</button>
      </div>
    </div>
  );
};

export default BioluminescentTree;
