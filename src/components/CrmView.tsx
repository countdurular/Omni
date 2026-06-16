import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  SlidersHorizontal,
  ChevronDown,
  UserPlus,
  Mail,
  Phone,
  Tag,
  AlertTriangle,
  X,
  Target
} from "lucide-react";
import { Lead } from "../types";

interface CrmViewProps {
  leads: Lead[];
  onAddLead: (lead: Partial<Lead>) => Promise<any>;
  onUpdateLead: (id: string, data: Partial<Lead>) => Promise<any>;
  onDeleteLead: (id: string) => Promise<any>;
}

export default function CrmView({ leads, onAddLead, onUpdateLead, onDeleteLead }: CrmViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"score" | "lastMessage" | "name">("lastMessage");

  // Add Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newScore, setNewScore] = useState(70);
  const [newStage, setNewStage] = useState<Lead["stage"]>("Lead");
  const [newStatus, setNewStatus] = useState<Lead["aiStatus"]>("AI Active");
  const [newTagsString, setNewTagsString] = useState("Organic, High Intent");

  // Edit Lead Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(50);
  const [editStage, setEditStage] = useState<Lead["stage"]>("Lead");

  // Filtering Logic
  const filteredLeads = leads
    .filter((lead) => {
      const matchSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStage = stageFilter === "All" || lead.stage === stageFilter;
      const matchStatus = statusFilter === "All" || lead.aiStatus === statusFilter;

      return matchSearch && matchStage && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const parsedTags = newTagsString.split(",").map(t => t.trim()).filter(Boolean);
    
    await onAddLead({
      name: newName,
      phone: newPhone,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, "")}@domain.com`,
      score: Number(newScore),
      stage: newStage,
      aiStatus: newStatus,
      tags: parsedTags.length ? parsedTags : ["Manual Lead"]
    });

    // Reset Form
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewScore(70);
    setNewStage("Lead");
    setNewStatus("AI Active");
    setNewTagsString("Organic, High Intent");
    setShowAddModal(false);
  };

  const handleQuickUpdate = async (id: string, score: number, stage: Lead["stage"]) => {
    await onUpdateLead(id, { score, stage });
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Dashboard Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* Search Inputs */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              id="crm-search-input"
              type="text"
              placeholder="Search by name, phone, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          {/* Sales Stage Filter */}
          <select 
            id="crm-stage-filter"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-black cursor-pointer"
          >
            <option value="All">All Stages</option>
            <option value="Lead">Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>

          {/* AI Automated Routing Status Filter */}
          <select 
            id="crm-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-black cursor-pointer"
          >
            <option value="All">All UI Routing</option>
            <option value="AI Active">AI Active</option>
            <option value="Human Takeover">Human Takeover</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Sorting Controller */}
          <select 
            id="crm-sort-selector"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-100/80 border border-slate-200/60 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-black cursor-pointer"
          >
            <option value="lastMessage">Sort: Last message</option>
            <option value="score">Sort: Lead score</option>
            <option value="name">Sort: Contact name</option>
          </select>
        </div>

        {/* Create Lead Button */}
        <button 
          id="crm-btn-add-lead"
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-black hover:bg-slate-800 text-white flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer hover:shadow"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Custom Lead</span>
        </button>
      </div>

      {/* Table grid element */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-wider font-semibold font-mono text-slate-400 select-none">
                <th className="py-4 px-6">Company Contact</th>
                <th className="py-4 px-4 text-center">Score</th>
                <th className="py-4 px-4">Automation</th>
                <th className="py-4 px-4">Sales Phase</th>
                <th className="py-4 px-4">Assigned Tags</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400 font-sans">
                    No matching leads found. Refine your filters or create a custom contact above.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isEditing = editingId === lead.id;
                  
                  return (
                    <tr key={lead.id} id={`crm-lead-row-${lead.id}`} className="hover:bg-slate-50/40 transition-colors">
                      {/* Name / Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-mono font-bold text-slate-800 border border-slate-200">
                            {lead.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1.5">{lead.name}</p>
                            <div className="flex items-center gap-3.5 text-[11px] text-slate-500 font-sans leading-none">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400 shrink-0" /> {lead.phone}</span>
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400 shrink-0" /> {lead.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lead Score */}
                      <td className="py-4 px-4 text-center">
                        {isEditing ? (
                          <input 
                            type="number" 
                            min="0" 
                            max="100"
                            value={editScore}
                            onChange={(e) => setEditScore(Number(e.target.value))}
                            className="w-16 text-center border border-slate-200 rounded px-1.5 py-1 text-sm outline-none"
                          />
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                              lead.score >= 80 
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-100" 
                                : lead.score >= 50 
                                ? "text-slate-700 bg-slate-50 border border-slate-100" 
                                : "text-amber-700 bg-amber-50 border border-amber-100"
                            }`}>
                              {lead.score}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* AI Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                          lead.aiStatus === "AI Active" 
                            ? "bg-emerald-50 text-emerald-700 font-mono" 
                            : lead.aiStatus === "Human Takeover" 
                            ? "bg-amber-50 text-amber-700 font-mono"
                            : "bg-slate-100 text-slate-500 font-mono"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            lead.aiStatus === "AI Active" ? "bg-emerald-500" : lead.aiStatus === "Human Takeover" ? "bg-amber-500" : "bg-slate-400"
                          }`} />
                          {lead.aiStatus}
                        </span>
                      </td>

                      {/* Sales Stage */}
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <select 
                            value={editStage}
                            onChange={(e) => setEditStage(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded px-1 py-1 text-xs outline-none"
                          >
                            <option value="Lead">Lead</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Closed Won">Closed Won</option>
                            <option value="Closed Lost">Closed Lost</option>
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                            {lead.stage}
                          </span>
                        )}
                      </td>

                      {/* Tags Cloud */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {lead.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] uppercase font-bold tracking-tight text-slate-500 bg-slate-55 shadow-sm border border-slate-200 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Active Row Actions */}
                      <td className="py-4 px-6 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleQuickUpdate(lead.id, editScore, editStage)}
                              className="bg-black text-white text-xs px-2.5 py-1.5 rounded font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 hover:text-slate-800 text-xs px-2 py-1 relative"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3.5">
                            <button 
                              onClick={() => {
                                setEditingId(lead.id);
                                setEditScore(lead.score);
                                setEditStage(lead.stage);
                              }}
                              className="text-slate-400 hover:text-black hover:underline text-xs font-semibold relative cursor-pointer"
                            >
                              Edit Score/Stage
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete CRM Contact ${lead.name}?`)) {
                                  onDeleteLead(lead.id);
                                }
                              }}
                              className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Pop-up Add Lead Modal */}
      {showAddModal && (
        <div id="add-lead-modal-container" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden border border-slate-200 shadow-2xl animate-scale-up">
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-sm">Add New CRM Marketing Lead</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 px-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Contact name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. +1 (555) 123-4567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. john@business.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Lead Score (0-100)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Sales Stage</label>
                  <select 
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as any)}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2.5 text-xs font-semibold outline-none focus:border-black cursor-pointer"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Closed Won">Closed Won</option>
                    <option value="Closed Lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Automation</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2.5 text-xs font-semibold outline-none focus:border-black cursor-pointer"
                  >
                    <option value="AI Active">AI Active</option>
                    <option value="Human Takeover">Human Takeover</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Assigned Tags (Comma Separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Enterprise, High Intent, Demo Request"
                  value={newTagsString}
                  onChange={(e) => setNewTagsString(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-black text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-black hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
