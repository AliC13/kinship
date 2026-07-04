import React, { useRef, useEffect } from 'react';
import PersonNode from './PersonNode';
import { computeHierarchyLayout, EDGE_COLORS, computeFamilyEdges, coupleMidpoint } from '@/lib/treeUtils';

export default function HierarchyView({ people, relationships, selectedPersonId, onSelectPerson, searchQuery, focusRequest }) {
  const scrollRef = useRef(null);
  const layout = computeHierarchyLayout(people, relationships);
  const { positions, childrenMap, spouseOf, NODE_W, NODE_H } = layout;

  const xs = Object.values(positions).map(p => p.x);
  const ys = Object.values(positions).map(p => p.y);
  const width = xs.length ? Math.max(...xs) + NODE_W + 80 : 800;
  const height = ys.length ? Math.max(...ys) + NODE_H + 80 : 600;

  const familyEdges = computeFamilyEdges(people, relationships);
  const edges = [];
  familyEdges.forEach(edge => {
    if (edge.type === 'couple') {
      const pa = positions[edge.a.id], pb = positions[edge.b.id];
      if (!pa || !pb) return;
      const left = pa.x <= pb.x ? pa : pb;
      const right = pa.x <= pb.x ? pb : pa;
      edges.push({ kind: 'spouse', x1: left.x + NODE_W, y1: left.y + NODE_H / 2, x2: right.x, y2: right.y + NODE_H / 2 });
    } else if (edge.type === 'child_couple') {
      const p1 = positions[edge.p1.id], p2 = positions[edge.p2.id], c = positions[edge.child.id];
      if (!p1 || !p2 || !c) return;
      const mp = coupleMidpoint(p1, p2, NODE_W, NODE_H);
      edges.push({ kind: 'parent', x1: mp.x, y1: mp.y, x2: c.x + NODE_W / 2, y2: c.y });
    } else if (edge.type === 'child_single') {
      const p = positions[edge.parent.id], c = positions[edge.child.id];
      if (!p || !c) return;
      edges.push({ kind: 'parent', x1: p.x + NODE_W / 2, y1: p.y + NODE_H, x2: c.x + NODE_W / 2, y2: c.y });
    }
  });

  const matches = (p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());

  useEffect(() => {
    if (!focusRequest) return;
    const el = scrollRef.current?.querySelector(`[data-node-id="${focusRequest.id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }, [focusRequest]);

  return (
    <div ref={scrollRef} className="w-full h-full overflow-auto p-10 bg-[#F8FAFC]">
      <div className="relative" style={{ width, height, minWidth: '100%' }}>
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
          {edges.map((e, i) => {
            const color = e.kind === 'spouse' ? EDGE_COLORS.spouse : EDGE_COLORS.parent;
            let path;
            if (e.kind === 'spouse') {
              path = `M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`;
            } else {
              const my = (e.y1 + e.y2) / 2;
              path = `M ${e.x1} ${e.y1} L ${e.x1} ${my} L ${e.x2} ${my} L ${e.x2} ${e.y2}`;
            }
            return <path key={i} d={path} stroke={color} strokeWidth="2" fill="none" opacity="0.55" />;
          })}
        </svg>

        {people.map(p => {
          const pos = positions[p.id];
          if (!pos) return null;
          return (
            <div
              key={p.id}
              data-node-id={p.id}
              className="absolute cursor-pointer"
              style={{ left: pos.x, top: pos.y, width: NODE_W }}
              onClick={() => onSelectPerson(p)}
            >
              <PersonNode person={p} selected={selectedPersonId === p.id} dimmed={searchQuery && !matches(p)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}