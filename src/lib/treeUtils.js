export function getParents(personId, relationships) {
  return relationships
    .filter(r => r.toPersonId === personId && r.type === 'parent')
    .map(r => r.fromPersonId);
}

export function getChildren(personId, relationships) {
  return relationships
    .filter(r => r.fromPersonId === personId && r.type === 'parent')
    .map(r => r.toPersonId);
}

export function getSpouses(personId, relationships) {
  return relationships
    .filter(r => (r.type === 'spouse' || r.type === 'partner') &&
      (r.fromPersonId === personId || r.toPersonId === personId))
    .map(r => r.fromPersonId === personId ? r.toPersonId : r.fromPersonId);
}

export function getSiblings(personId, relationships) {
  const parents = getParents(personId, relationships);
  if (parents.length === 0) return [];
  const siblings = new Set();
  parents.forEach(pid => {
    getChildren(pid, relationships).forEach(cid => {
      if (cid !== personId) siblings.add(cid);
    });
  });
  return Array.from(siblings);
}

export function formatYears(person) {
  const birth = person.birthDate ? new Date(person.birthDate).getFullYear() : null;
  const death = person.deathDate ? new Date(person.deathDate).getFullYear() : null;
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `b. ${birth}`;
  if (death) return `d. ${death}`;
  return '';
}

export function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export const RELATIONSHIP_LABELS = {
  parent: 'Parent of',
  spouse: 'Spouse of',
  partner: 'Partner of',
  sibling: 'Sibling of',
  step_parent: 'Step-parent of',
  half_sibling: 'Half-sibling of',
  adopted_parent: 'Adoptive parent of'
};

export const EDGE_COLORS = {
  parent: '#64748B',
  spouse: '#F59E0B',
  partner: '#F59E0B',
  sibling: '#14B8A6',
  step_parent: '#94A3B8',
  half_sibling: '#2DD4BF',
  adopted_parent: '#A78BFA'
};

export const GENDER_BORDER = {
  male: '#3B82F6',
  female: '#EC4899',
  other: '#A78BFA',
  unknown: '#CBD5E1'
};

export function computeHierarchyLayout(people, relationships) {
  const NODE_W = 220;
  const NODE_H = 96;
  const H_GAP = 32;
  const V_GAP = 90;
  const COUPLE_GAP = 16;

  const childrenMap = {};
  const parentMap = {};
  relationships.filter(r => r.type === 'parent').forEach(r => {
    if (!childrenMap[r.fromPersonId]) childrenMap[r.fromPersonId] = [];
    childrenMap[r.fromPersonId].push(r.toPersonId);
    if (!parentMap[r.toPersonId]) parentMap[r.toPersonId] = [];
    parentMap[r.toPersonId].push(r.fromPersonId);
  });

  const spouseOf = {};
  relationships.filter(r => r.type === 'spouse' || r.type === 'partner').forEach(r => {
    if (!spouseOf[r.fromPersonId]) spouseOf[r.fromPersonId] = r.toPersonId;
    if (!spouseOf[r.toPersonId]) spouseOf[r.toPersonId] = r.fromPersonId;
  });

  const positions = {};
  let cursor = 0;

  function place(personId, depth) {
    const children = childrenMap[personId] || [];
    const spouse = spouseOf[personId];
    const y = depth * (NODE_H + V_GAP);

    if (children.length === 0) {
      const x = cursor * (NODE_W + H_GAP);
      positions[personId] = { x, y };
      cursor++;
      if (spouse && !positions[spouse]) {
        positions[spouse] = { x: x + NODE_W + COUPLE_GAP, y };
        cursor++;
      }
      return x;
    }
    const childXs = children.map(c => place(c, depth + 1));
    const minX = Math.min(...childXs);
    const maxX = Math.max(...childXs);
    const cx = (minX + maxX) / 2;
    positions[personId] = { x: cx, y };
    if (spouse && !positions[spouse]) {
      positions[spouse] = { x: cx + NODE_W + COUPLE_GAP, y };
    }
    return cx;
  }

  const roots = people.filter(p => !parentMap[p.id] || parentMap[p.id].length === 0);
  roots.forEach(r => {
    if (!positions[r.id]) place(r.id, 0);
  });
  people.forEach(p => {
    if (!positions[p.id]) {
      positions[p.id] = { x: cursor * (NODE_W + H_GAP), y: 0 };
      cursor++;
    }
  });

  return { positions, childrenMap, parentMap, spouseOf, NODE_W, NODE_H, H_GAP, V_GAP, COUPLE_GAP };
}

export function coupleMidpoint(posA, posB, NODE_W, NODE_H) {
  const left = posA.x <= posB.x ? posA : posB;
  const right = posA.x <= posB.x ? posB : posA;
  return {
    x: (left.x + NODE_W + right.x) / 2,
    y: (left.y + NODE_H / 2 + right.y + NODE_H / 2) / 2
  };
}

export function computeFamilyEdges(people, relationships) {
  const personMap = Object.fromEntries(people.map(p => [p.id, p]));

  const parentsOf = {};
  relationships.filter(r => r.type === 'parent').forEach(r => {
    (parentsOf[r.toPersonId] = parentsOf[r.toPersonId] || []).push(r);
  });

  const spouseOf = {};
  relationships.filter(r => r.type === 'spouse' || r.type === 'partner').forEach(r => {
    spouseOf[r.fromPersonId] = r.toPersonId;
    spouseOf[r.toPersonId] = r.fromPersonId;
  });

  const edges = [];
  const drawnCouples = new Set();

  relationships.filter(r => r.type === 'spouse' || r.type === 'partner').forEach(r => {
    const key = [r.fromPersonId, r.toPersonId].sort().join('-');
    if (drawnCouples.has(key)) return;
    drawnCouples.add(key);
    const a = personMap[r.fromPersonId], b = personMap[r.toPersonId];
    if (a && b) edges.push({ type: 'couple', rel: r, a, b });
  });

  Object.entries(parentsOf).forEach(([childId, rels]) => {
    const child = personMap[childId];
    if (!child) return;
    const used = new Set();
    const parentIds = rels.map(r => r.fromPersonId);
    rels.forEach(r => {
      if (used.has(r.fromPersonId)) return;
      const spouse = spouseOf[r.fromPersonId];
      const spouseRel = spouse && parentIds.includes(spouse)
        ? rels.find(x => x.fromPersonId === spouse)
        : null;
      if (spouseRel) {
        edges.push({ type: 'child_couple', child, p1: personMap[r.fromPersonId], p2: personMap[spouse], rels: [r, spouseRel] });
        used.add(r.fromPersonId);
        used.add(spouse);
      } else {
        edges.push({ type: 'child_single', child, parent: personMap[r.fromPersonId], rel: r });
        used.add(r.fromPersonId);
      }
    });
  });

  relationships.filter(r => !['parent', 'spouse', 'partner'].includes(r.type)).forEach(r => {
    const a = personMap[r.fromPersonId], b = personMap[r.toPersonId];
    if (a && b) edges.push({ type: 'direct', rel: r, a, b });
  });

  return edges;
}