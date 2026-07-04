import React, { useState, useEffect, useCallback } from 'react';
import { Person, Relationship } from '@/api/entities';
import { Loader2 } from 'lucide-react';
import TreeViewToolbar from '@/components/tree/TreeViewToolbar';
import CanvasView from '@/components/tree/CanvasView';
import HierarchyView from '@/components/tree/HierarchyView';
import PersonPanel from '@/components/tree/PersonPanel';
import RelationshipPanel from '@/components/tree/RelationshipPanel';
import AddMemberModal from '@/components/tree/AddMemberModal';
import ConnectMembersModal from '@/components/tree/ConnectMembersModal';
import EmptyState from '@/components/tree/EmptyState';

const stripBuiltins = ({ id, created_date, updated_date, created_by_id, ...rest }) => rest;

export default function Home() {
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('canvas');
  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedRelId, setSelectedRelId] = useState(null);
  const [addModal, setAddModal] = useState({ open: false, contextPerson: null, contextRole: null, secondParent: null });
  const [connectModal, setConnectModal] = useState(false);
  const [focusRequest, setFocusRequest] = useState(null);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      Person.list('-created_date', 500),
      Relationship.list('-created_date', 500)
    ]);
    setPeople(p);
    setRelationships(r);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedPerson = people.find(p => p.id === selectedPersonId) || null;
  const selectedRel = relationships.find(r => r.id === selectedRelId) || null;

  const openAdd = () => setAddModal({ open: true, contextPerson: null, contextRole: null, secondParent: null });
  const closeAdd = () => setAddModal(m => ({ ...m, open: false }));

  const handleAddRelative = (person, role) => {
    setAddModal({ open: true, contextPerson: person, contextRole: role, secondParent: null });
  };

  const handleAddChildOfCouple = (person1, person2) => {
    setAddModal({ open: true, contextPerson: person1, contextRole: 'child', secondParent: person2 });
  };

  const handleConnect = async ({ personAId, personBId, relType, marriageDate, separationDate, notes }) => {
    let rel;
    if (relType === 'parent') rel = { fromPersonId: personAId, toPersonId: personBId, type: 'parent' };
    else if (relType === 'step_parent') rel = { fromPersonId: personAId, toPersonId: personBId, type: 'step_parent' };
    else if (relType === 'adopted_parent') rel = { fromPersonId: personAId, toPersonId: personBId, type: 'adopted_parent' };
    else rel = { fromPersonId: personAId, toPersonId: personBId, type: relType, marriageDate, separationDate, notes };
    await Relationship.create(rel);
    await load();
  };

  const handleAddMember = async (personData, { contextPersonId, role, secondParentId }) => {
    const context = people.find(p => p.id === contextPersonId);
    let canvasX = 300, canvasY = 300;
    if (context) {
      const cx = context.canvasX || 300, cy = context.canvasY || 300;
      if (role === 'parent') { canvasX = cx; canvasY = cy - 130; }
      else if (role === 'child') { canvasX = cx; canvasY = cy + 130; }
      else { canvasX = cx + 240; canvasY = cy; }
    }
    if (secondParentId) {
      const p2 = people.find(p => p.id === secondParentId);
      if (p2 && context) {
        const cx1 = context.canvasX || 0, cy1 = context.canvasY || 0;
        const cx2 = p2.canvasX || 0, cy2 = p2.canvasY || 0;
        canvasX = (Math.min(cx1, cx2) + 200 + Math.max(cx1, cx2)) / 2 - 100;
        canvasY = Math.max(cy1, cy2) + 130;
      }
    }
    const created = await Person.create({ ...personData, canvasX, canvasY });
    if (contextPersonId) {
      let rel;
      if (role === 'parent') rel = { fromPersonId: created.id, toPersonId: contextPersonId, type: 'parent' };
      else if (role === 'child') rel = { fromPersonId: contextPersonId, toPersonId: created.id, type: 'parent' };
      else if (role === 'spouse') rel = { fromPersonId: contextPersonId, toPersonId: created.id, type: 'spouse' };
      else rel = { fromPersonId: contextPersonId, toPersonId: created.id, type: 'sibling' };
      await Relationship.create(rel);
      if (role === 'child' && secondParentId) {
        await Relationship.create({ fromPersonId: secondParentId, toPersonId: created.id, type: 'parent' });
      }
    }
    await load();
    setSelectedPersonId(created.id);
  };

  const handleSavePerson = async (id, data) => {
    await Person.update(id, stripBuiltins(data));
    await load();
  };

  const handleDeletePerson = async (id) => {
    const p = people.find(x => x.id === id);
    if (!window.confirm(`Delete ${p?.name || 'this person'} and all their connections?`)) return;
    const rels = relationships.filter(r => r.fromPersonId === id || r.toPersonId === id);
    await Promise.all(rels.map(r => Relationship.delete(r.id)));
    await Person.delete(id);
    setSelectedPersonId(null);
    await load();
  };

  const handleSaveRelationship = async (id, data) => {
    await Relationship.update(id, stripBuiltins(data));
    await load();
  };

  const handleDeleteRelationship = async (id) => {
    if (!window.confirm('Remove this connection?')) return;
    await Relationship.delete(id);
    setSelectedRelId(null);
    await load();
  };

  const handleMovePerson = (id, x, y) => {
    setPeople(ps => ps.map(p => p.id === id ? { ...p, canvasX: x, canvasY: y } : p));
  };

  const handleMovePersonEnd = async (id) => {
    const p = people.find(x => x.id === id);
    if (p) await Person.update(p.id, { canvasX: p.canvasX, canvasY: p.canvasY });
  };

  const handleSelectPerson = (p) => {
    setSelectedPersonId(p ? p.id : null);
    setSelectedRelId(null);
  };

  const handleSelectRelationship = (r) => {
    setSelectedRelId(r.id);
    setSelectedPersonId(null);
  };

  const handleSearchSelect = (personId) => {
    setSelectedPersonId(personId);
    setSelectedRelId(null);
    setFocusRequest({ id: personId, t: Date.now() });
  };

  const handleBackgroundClick = () => {
    setSelectedPersonId(null);
    setSelectedRelId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <TreeViewToolbar
        view={view}
        onViewChange={setView}
        searchQuery={search}
        onSearchChange={setSearch}
        onSearchSelect={handleSearchSelect}
        onAddClick={openAdd}
        onConnectClick={() => setConnectModal(true)}
        peopleCount={people.length}
        people={people}
      />

      <div className="relative flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ) : people.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : view === 'canvas' ? (
          <CanvasView
            people={people}
            relationships={relationships}
            selectedPersonId={selectedPersonId}
            selectedRelId={selectedRelId}
            onSelectPerson={handleSelectPerson}
            onSelectRelationship={handleSelectRelationship}
            onMovePerson={handleMovePerson}
            onMovePersonEnd={handleMovePersonEnd}
            onBackgroundClick={handleBackgroundClick}
            searchQuery={search}
            focusRequest={focusRequest}
          />
        ) : (
          <HierarchyView
            people={people}
            relationships={relationships}
            selectedPersonId={selectedPersonId}
            onSelectPerson={handleSelectPerson}
            searchQuery={search}
            focusRequest={focusRequest}
          />
        )}

        {selectedPerson && (
          <PersonPanel
            person={selectedPerson}
            people={people}
            relationships={relationships}
            onClose={() => setSelectedPersonId(null)}
            onSave={handleSavePerson}
            onDelete={handleDeletePerson}
            onAddRelative={handleAddRelative}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {selectedRel && (
          <RelationshipPanel
            relationship={selectedRel}
            people={people}
            onClose={() => setSelectedRelId(null)}
            onSave={handleSaveRelationship}
            onDelete={handleDeleteRelationship}
            onAddChildOfCouple={handleAddChildOfCouple}
          />
        )}

        <AddMemberModal
          open={addModal.open}
          onClose={closeAdd}
          onAdd={handleAddMember}
          people={people}
          contextPerson={addModal.contextPerson}
          contextRole={addModal.contextRole}
          secondParent={addModal.secondParent}
        />

        <ConnectMembersModal
          open={connectModal}
          onClose={() => setConnectModal(false)}
          onConnect={handleConnect}
          people={people}
        />
      </div>
    </div>
  );
}