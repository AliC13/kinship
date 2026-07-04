import React, { useRef, useState, useEffect } from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import PersonNode from './PersonNode';
import { EDGE_COLORS, computeFamilyEdges, coupleMidpoint } from '@/lib/treeUtils';

const NODE_W = 200;
const NODE_H = 88;

export default function CanvasView({ people, relationships, selectedPersonId, selectedRelId, onSelectPerson, onSelectRelationship, onMovePerson, onMovePersonEnd, onBackgroundClick, searchQuery, focusRequest }) {
  const [transform, setTransform] = useState({ x: 60, y: 60, scale: 1 });
  const [dragging, setDragging] = useState(null);
  const movedRef = useRef(false);
  const containerRef = useRef(null);

  // Non-passive wheel for zoom-to-cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setTransform(t => {
        const newScale = Math.min(2, Math.max(0.3, t.scale + (-e.deltaY * 0.0015)));
        const scaleRatio = newScale / t.scale;
        return { x: mx - (mx - t.x) * scaleRatio, y: my - (my - t.y) * scaleRatio, scale: newScale };
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Center on a searched person
  useEffect(() => {
    if (!focusRequest) return;
    const p = people.find(x => x.id === focusRequest.id);
    if (!p) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = (p.canvasX || 0) + NODE_W / 2;
    const cy = (p.canvasY || 0) + NODE_H / 2;
    setTransform({ x: rect.width / 2 - cx, y: rect.height / 2 - cy, scale: 1 });
  }, [focusRequest]);

  const onPointerDown = (e) => {
    const nodeEl = e.target.closest('[data-node]');
    if (nodeEl) {
      const personId = nodeEl.getAttribute('data-person-id');
      const person = people.find(p => p.id === personId);
      if (person) {
        movedRef.current = false;
        setDragging({ type: 'node', personId, startX: e.clientX, startY: e.clientY, origX: person.canvasX || 0, origY: person.canvasY || 0 });
        containerRef.current.setPointerCapture(e.pointerId);
      }
      return;
    }
    if (e.target.closest('[data-edge]')) return;
    movedRef.current = false;
    setDragging({ type: 'pan', startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y });
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    if (dragging.type === 'pan') {
      setTransform(t => ({ ...t, x: dragging.origX + dx, y: dragging.origY + dy }));
    } else {
      onMovePerson(dragging.personId, dragging.origX + dx / transform.scale, dragging.origY + dy / transform.scale);
    }
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    if (dragging.type === 'node') {
      if (movedRef.current) {
        onMovePersonEnd(dragging.personId);
      } else {
        const person = people.find(p => p.id === dragging.personId);
        if (person) onSelectPerson(person);
      }
    } else if (dragging.type === 'pan' && !movedRef.current) {
      onBackgroundClick?.();
    }
    setDragging(null);
    try { containerRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  const pos = (p) => ({ x: p.canvasX || 0, y: p.canvasY || 0 });
  const edges = computeFamilyEdges(people, relationships);

  const matches = (p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
        <svg className="absolute top-0 left-0" style={{ width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}>
          {edges.map((edge) => {
            let key, color, path, selectableRel, isDashed = false;
            if (edge.type === 'couple') {
              const pa = pos(edge.a), pb = pos(edge.b);
              const left = pa.x <= pb.x ? pa : pb;
              const right = pa.x <= pb.x ? pb : pa;
              path = `M ${left.x + NODE_W} ${left.y + NODE_H / 2} L ${right.x} ${right.y + NODE_H / 2}`;
              color = EDGE_COLORS[edge.rel.type] || '#94A3B8';
              key = edge.rel.id;
              selectableRel = edge.rel;
            } else if (edge.type === 'child_couple') {
              const mp = coupleMidpoint(pos(edge.p1), pos(edge.p2), NODE_W, NODE_H);
              const c = pos(edge.child);
              const cx = c.x + NODE_W / 2;
              const my = (mp.y + c.y) / 2;
              path = `M ${mp.x} ${mp.y} L ${mp.x} ${my} L ${cx} ${my} L ${cx} ${c.y}`;
              color = EDGE_COLORS.parent;
              key = edge.rels.map(r => r.id).join('-');
              selectableRel = edge.rels[0];
            } else {
              const p = pos(edge.parent || edge.a), c = pos(edge.child || edge.b);
              const x1 = p.x + NODE_W / 2;
              const y1 = p.y + NODE_H;
              const x2 = c.x + NODE_W / 2;
              const my = (y1 + c.y) / 2;
              path = `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${c.y}`;
              color = EDGE_COLORS[edge.rel.type] || '#94A3B8';
              key = edge.rel.id;
              selectableRel = edge.rel;
              isDashed = edge.rel.type === 'sibling' || edge.rel.type === 'half_sibling';
            }
            const selected = edge.type === 'child_couple'
              ? edge.rels.some(r => r.id === selectedRelId)
              : selectedRelId === selectableRel?.id;
            return (
              <g key={key} style={{ pointerEvents: 'auto' }}>
                <path d={path} stroke="transparent" strokeWidth="16" fill="none" data-edge style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onSelectRelationship(selectableRel); }} />
                <path
                  d={path}
                  stroke={color}
                  strokeWidth={selected ? 3 : 2}
                  fill="none"
                  opacity={selected ? 1 : 0.55}
                  strokeDasharray={isDashed ? '5 4' : 'none'}
                />
              </g>
            );
          })}
        </svg>

        {people.map(p => {
          const dimmed = searchQuery && !matches(p);
          return (
            <div
              key={p.id}
              data-node
              data-person-id={p.id}
              className="absolute"
              style={{ left: p.canvasX || 0, top: p.canvasY || 0, width: NODE_W, cursor: 'grab' }}
            >
              <PersonNode person={p} selected={selectedPersonId === p.id} dimmed={dimmed} />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(2, t.scale + 0.15) }))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-600"><Plus className="w-4 h-4" /></button>
        <div className="border-t border-slate-100" />
        <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.3, t.scale - 0.15) }))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-600"><Minus className="w-4 h-4" /></button>
        <div className="border-t border-slate-100" />
        <button onClick={() => setTransform({ x: 60, y: 60, scale: 1 })} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 text-slate-600"><Maximize className="w-3.5 h-3.5" /></button>
      </div>

      <div className="absolute bottom-4 left-4 text-[11px] text-slate-400 bg-white/70 backdrop-blur px-2.5 py-1 rounded-md pointer-events-none">
        Drag nodes to rearrange • Scroll to zoom • Click a line to edit
      </div>
    </div>
  );
}