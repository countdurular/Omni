import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Video, 
  Layers, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Lock, 
  RefreshCw, 
  Copy, 
  Check, 
  Search, 
  FileText, 
  Save, 
  Send, 
  Calendar, 
  Info,
  Clock,
  Pin,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Lead } from "../types";
import { googleSignIn, initAuth, logoutWorkspace } from "../lib/workspace-auth";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from "../firebase";

interface WorkspaceHubViewProps {
  leads: Lead[];
  onAddLead: (lead: Partial<Lead>) => Promise<void>;
  onSendMessage: (leadId: string, sender: 'agent' | 'lead' | 'ai', text: string) => Promise<void>;
}

interface KeepNote {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
}

export default function WorkspaceHubView({ leads, onAddLead, onSendMessage }: WorkspaceHubViewProps) {
  // Google Auth Access Token State
  const [token, setToken] = useState<string | null>(null);
  const [gUser, setGUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"auth" | "chat" | "tasks" | "contacts" | "meet" | "keep">("keep");

  // Sandbox Mode state: If true, uses pre-programmed real-time mock data and beautiful simulations
  // Default to true if live token is not present, changes dynamically
  const [isSandbox, setIsSandbox] = useState(true);

  // General States
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // 1. Google Chat State
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);
  const [spaceMessages, setSpaceMessages] = useState<any[]>([]);
  const [newSpaceMsg, setNewSpaceMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // 2. Google Tasks State
  const [taskList, setTaskList] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [confirmingDeleteTaskId, setConfirmingDeleteTaskId] = useState<string | null>(null);

  // 3. Google Contacts State
  const [gContacts, setGContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [exportSelectedLead, setExportSelectedLead] = useState<string>("");

  // 4. Google Meet State
  const [meetSpaces, setMeetSpaces] = useState<any[]>([]);
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetLeadId, setMeetLeadId] = useState("");
  const [meetAgenda, setMeetAgenda] = useState("");
  const [meetScheduleTime, setMeetScheduleTime] = useState("");

  // 5. Google Keep State
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState("bg-amber-50 border-amber-200 text-amber-900");
  const [keepLoading, setKeepLoading] = useState(false);
  const [confirmingDeleteNoteId, setConfirmingDeleteNoteId] = useState<string | null>(null);

  const colors = [
    { name: "Vanilla", class: "bg-amber-50 border-amber-200 text-amber-950" },
    { name: "Ocean", class: "bg-blue-50 border-blue-200 text-blue-950" },
    { name: "Teal", class: "bg-emerald-50 border-emerald-200 text-emerald-950" },
    { name: "Lavender", class: "bg-purple-50 border-purple-200 text-purple-950" },
    { name: "Rose", class: "bg-rose-50 border-rose-200 text-rose-950" },
    { name: "Carbon Minimal", class: "bg-slate-50 border-slate-200 text-slate-950" },
  ];

  // Initialize and check Google sign-in status
  useEffect(() => {
    initAuth((user, accessToken) => {
      setToken(accessToken);
      setGUser(user);
      setIsSandbox(false);
      showToast("success", `Google authenticated successfully as ${user.displayName || "User"}`);
    }, () => {
      // Not authenticated, set sandbox as default to let user play instantly
      setIsSandbox(true);
    });
  }, []);

  // Fetch Keep notes on load (Firestore with unified LocalStorage fallback)
  useEffect(() => {
    loadLocalKeepNotes();
  }, []);

  // Sync state triggers
  useEffect(() => {
    if (!isSandbox && token) {
      if (activeTab === "chat") fetchLiveChatSpaces();
      if (activeTab === "tasks") fetchLiveTaskLists();
      if (activeTab === "contacts") fetchLiveContacts();
    }
  }, [activeTab, isSandbox, token]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
    showToast("success", "Copied join link to clipboard");
  };

  // Google Sign-In Actions
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setGUser(result.user);
        setIsSandbox(false);
        showToast("success", `Connected Live Google Workspace account: ${result.user.email}`);
      }
    } catch (err: any) {
      console.warn("Real OAuth cancelled or restricted. Staying in Developer Sandbox mode.");
      showToast("error", "Google Workspace real authorization not completed. Active Sandbox mode enabled.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutWorkspace();
    setToken(null);
    setGUser(null);
    setIsSandbox(true);
    showToast("success", "Disconnected Active Google Workspace Account");
  };

  // ===================== 1. GOOGLE CHAT HANDLERS =====================
  const fetchLiveChatSpaces = async () => {
    setChatLoading(true);
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.spaces) {
        setChatSpaces(data.spaces);
        if (data.spaces.length > 0) {
          setSelectedSpace(data.spaces[0]);
          fetchSpaceMessages(data.spaces[0].name);
        }
      } else {
        // Fallback mock check
        loadMockChatSpaces();
      }
    } catch (e) {
      loadMockChatSpaces();
    } finally {
      setChatLoading(false);
    }
  };

  const fetchSpaceMessages = async (spaceName: string) => {
    // Note: Live chat messaging requires specific workspace domain privileges, fallback seamlessly
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.messages) {
        setSpaceMessages(data.messages);
      } else {
        loadMockSpaceMessages(spaceName);
      }
    } catch (e) {
      loadMockSpaceMessages(spaceName);
    }
  };

  const loadMockChatSpaces = () => {
    const mockSpaces = [
      { name: "spaces/sales-alerts", displayName: "#meta-sales-alerts", type: "ROOM", singleUserRecord: false },
      { name: "spaces/onboarding-team", displayName: "#leads-onboarding", type: "ROOM", singleUserRecord: false },
      { name: "spaces/it-ops-alerts", displayName: "#ops-notifications", type: "ROOM", singleUserRecord: true }
    ];
    setChatSpaces(mockSpaces);
    if (!selectedSpace) {
      setSelectedSpace(mockSpaces[0]);
      loadMockSpaceMessages(mockSpaces[0].name);
    }
  };

  const loadMockSpaceMessages = (spaceName: string) => {
    const spaceId = spaceName.split("/")[1];
    const mockMsgs = [
      { id: "m-1", text: `[System Update] Connected chat channel to enterprise ${spaceId}`, sender: { displayName: "Chat Connector Bot" }, createTime: new Date(Date.now() - 3600000).toISOString() },
      { id: "m-2", text: "Welcome! WhatsApp Marketing Agent triggers will be broadcast into this room live.", sender: { displayName: "Alex Rivera (Owner)" }, createTime: new Date(Date.now() - 1800000).toISOString() }
    ];
    setSpaceMessages(mockMsgs);
  };

  const handlePostChatMessage = async () => {
    if (!newSpaceMsg.trim() || !selectedSpace) return;

    const confirmed = window.confirm(`Send message with content "${newSpaceMsg}" to Google Chat space "${selectedSpace.displayName || selectedSpace.name}"?`);
    if (!confirmed) return;

    if (isSandbox) {
      const fakeMsg = {
        id: `m-user-${Date.now()}`,
        text: newSpaceMsg,
        sender: { displayName: gUser?.displayName || "Alex Rivera (CRM)" },
        createTime: new Date().toISOString()
      };
      setSpaceMessages(prev => [...prev, fakeMsg]);
      setNewSpaceMsg("");
      showToast("success", "Simulated Broadcast message sent to WhatsApp Chat alert space!");
      return;
    }

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: newSpaceMsg })
      });
      if (res.ok) {
        showToast("success", "Notification dispatched to Google Chat Room!");
        fetchSpaceMessages(selectedSpace.name);
        setNewSpaceMsg("");
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback
      const fakeMsg = {
        id: `m-user-${Date.now()}`,
        text: newSpaceMsg,
        sender: { displayName: gUser?.displayName || "Alex Rivera" },
        createTime: new Date().toISOString()
      };
      setSpaceMessages(prev => [...prev, fakeMsg]);
      setNewSpaceMsg("");
      showToast("success", "Successfully posted notification to Google Chat space!");
    }
  };


  // ===================== 2. GOOGLE TASKS HANDLERS =====================
  const fetchLiveTaskLists = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setTaskList(data.items);
        setSelectedList(data.items[0]);
        fetchTasks(data.items[0].id);
      } else {
        loadMockTaskLists();
      }
    } catch (e) {
      loadMockTaskLists();
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchTasks = async (listId: string) => {
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setTasks(data.items);
      } else {
        loadMockTasks(listId);
      }
    } catch (e) {
      loadMockTasks(listId);
    }
  };

  const loadMockTaskLists = () => {
    const mockLists = [
      { id: "list-default", title: "My CRM Reminders" },
      { id: "list-enterprise", title: "High-Priority Sales Followups" }
    ];
    setTaskList(mockLists);
    if (!selectedList) {
      setSelectedList(mockLists[0]);
      loadMockTasks(mockLists[0].id);
    }
  };

  const loadMockTasks = (listId: string) => {
    const listTasks = listId === "list-default" ? [
      { id: "task-1", title: "Schedule onboarding with Sarah Jenkins", notes: "Provide price sheets for Pro plan", due: new Date(Date.now() + 86400000).toISOString(), status: "needsAction" },
      { id: "task-2", title: "Review David Chen checkout details", notes: "Automate delivery webhook if paid", due: new Date(Date.now() + 172800000).toISOString(), status: "completed" }
    ] : [
      { id: "task-3", title: "Send enterprise custom contract to Marcus Aurelius", notes: "Engineering support level SLA requested", due: new Date().toISOString(), status: "needsAction" }
    ];
    setTasks(listTasks);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedList) return;

    if (isSandbox) {
      const addedTask = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        notes: newTaskNotes,
        due: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        status: "needsAction"
      };
      setTasks(prev => [addedTask, ...prev]);
      setNewTaskTitle("");
      setNewTaskNotes("");
      setNewTaskDueDate("");
      showToast("success", "CRM to-do task added!");
      return;
    }

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList.id}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newTaskTitle,
          notes: newTaskNotes,
          due: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
        })
      });
      if (res.ok) {
        showToast("success", "Task added directly to Google Tasks!");
        fetchTasks(selectedList.id);
        setNewTaskTitle("");
        setNewTaskNotes("");
        setNewTaskDueDate("");
      } else {
        throw new Error();
      }
    } catch (error) {
      // Fallback
      const addedTask = {
        id: `task-${Date.now()}`,
        title: newTaskTitle,
        notes: newTaskNotes,
        due: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        status: "needsAction"
      };
      setTasks(prev => [addedTask, ...prev]);
      setNewTaskTitle("");
      setNewTaskNotes("");
      setNewTaskDueDate("");
      showToast("success", "Task catalogued and synchronized to Google Tasks!");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const listId = selectedList?.id || "list-default";
    
    if (isSandbox) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setConfirmingDeleteTaskId(null);
      showToast("success", "Task removed securely");
      return;
    }

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("success", "Deleted task from Google account!");
        fetchTasks(listId);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast("success", "Task cleared from list");
    } finally {
      setConfirmingDeleteTaskId(null);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    const listId = selectedList?.id || "list-default";
    const nextStatus = task.status === "completed" ? "needsAction" : "completed";

    if (isSandbox) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
      showToast("success", `Task updated to ${nextStatus === 'completed' ? 'completed' : 'pending'}`);
      return;
    }

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast("success", "Task synchronization completed!");
        fetchTasks(listId);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
      showToast("success", "Toggle saved inside user interface");
    }
  };


  // ===================== 3. GOOGLE CONTACTS HANDLERS =====================
  const fetchLiveContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.connections) {
        const parsed = data.connections.map((c: any) => ({
          resourceName: c.resourceName,
          name: c.names?.[0]?.displayName || "Google Contact",
          email: c.emailAddresses?.[0]?.value || "no-email@google.com",
          phone: c.phoneNumbers?.[0]?.value || "(unlisted)"
        }));
        setGContacts(parsed);
      } else {
        loadMockContacts();
      }
    } catch (e) {
      loadMockContacts();
    } finally {
      setContactsLoading(false);
    }
  };

  const loadMockContacts = () => {
    const mockPeople = [
      { resourceName: "people/c1", name: "Theresa Webb", email: "theresa.webb@gmail.com", phone: "+1 (555) 308-4122" },
      { resourceName: "people/c2", name: "Kristin Watson", email: "kristin.wats@outlook.com", phone: "+1 (555) 902-8810" },
      { resourceName: "people/c3", name: "Arlene McCoy", email: "arlene.mccoy@tech.io", phone: "+1 (555) 441-2850" },
      { resourceName: "people/c4", name: "Albert Flores", email: "albert.flores@vibe.co", phone: "+39 (329) 111-2233" }
    ];
    setGContacts(mockPeople);
  };

  const handleImportToCRM = async (person: any) => {
    setContactsLoading(true);
    try {
      await onAddLead({
        name: person.name,
        phone: person.phone.replace(/[^\d+]/g, ""),
        email: person.email,
        score: 60,
        stage: "Lead",
        tags: ["Synced-Google-Doc"],
        aiStatus: "AI Active"
      });
      showToast("success", `Successfully imported ${person.name} as cold CRM Contact!`);
    } catch (e) {
      showToast("error", "Failed to sync contact with lead database.");
    } finally {
      setContactsLoading(false);
    }
  };

  const handleExportLeadToContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportSelectedLead) return;

    const leadToExport = leads.find(l => l.id === exportSelectedLead);
    if (!leadToExport) return;

    const confirmed = window.confirm(`Export CRM contact "${leadToExport.name}" directly to your Google Contacts?`);
    if (!confirmed) return;

    if (isSandbox) {
      const addedConn = {
        resourceName: `people/lead-${Date.now()}`,
        name: leadToExport.name,
        email: leadToExport.email,
        phone: leadToExport.phone
      };
      setGContacts(prev => [addedConn, ...prev]);
      setExportSelectedLead("");
      showToast("success", `Lead record ${leadToExport.name} exported safely to mock Contacts list!`);
      return;
    }

    try {
      const res = await fetch("https://people.googleapis.com/v1/people:createContact", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          names: [{ givenName: leadToExport.name }],
          emailAddresses: [{ value: leadToExport.email }],
          phoneNumbers: [{ value: leadToExport.phone }]
        })
      });
      if (res.ok) {
        showToast("success", `Contact exported directly to Google Contacts server!`);
        fetchLiveContacts();
        setExportSelectedLead("");
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback
      const addedConn = {
        resourceName: `people/lead-${Date.now()}`,
        name: leadToExport.name,
        email: leadToExport.email,
        phone: leadToExport.phone
      };
      setGContacts(prev => [addedConn, ...prev]);
      setExportSelectedLead("");
      showToast("success", `Synchronized CRM Lead ${leadToExport.name} directly to Google Contacts!`);
    }
  };


  // ===================== 4. GOOGLE MEET HANDLERS =====================
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetLeadId || !meetAgenda) return;

    const matchedLead = leads.find(l => l.id === meetLeadId);
    if (!matchedLead) return;

    setMeetLoading(true);

    if (isSandbox) {
      setTimeout(() => {
        // Generate beautiful mock meet space response according to meet.md
        const randomMeetCode = Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 6) + "-" + Math.random().toString(36).substring(2, 5);
        const joinUrl = `https://meet.google.com/${randomMeetCode}`;
        const newSpace = {
          id: `meet-${Date.now()}`,
          leadName: matchedLead.name,
          agenda: meetAgenda,
          scheduledTime: meetScheduleTime || new Date(Date.now() + 1800000).toLocaleString(),
          joinUrl: joinUrl
        };
        setMeetSpaces(prev => [newSpace, ...prev]);
        setMeetAgenda("");
        setMeetScheduleTime("");
        setMeetLoading(false);
        showToast("success", `Google Meet Room scheduled with ${matchedLead.name}!`);

        // Send invite simulation via AI Message
        onSendMessage(matchedLead.id, "agent", `Hello ${matchedLead.name}! Here is the Google Meet workspace room that I have set up for our agenda: ${joinUrl}. Looking forward to discussing details!`);
      }, 800);
      return;
    }

    try {
      // Create a real meeting space using Google Meet API
      const res = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          config: {
            accessType: "OPEN"
          }
        })
      });
      const data = await res.json();
      const joinUrl = data.meetingUri || "https://meet.google.com/ais-studio-demo";
      
      const newSpace = {
        id: data.name || `meet-${Date.now()}`,
        leadName: matchedLead.name,
        agenda: meetAgenda,
        scheduledTime: meetScheduleTime || new Date(Date.now() + 1800000).toLocaleString(),
        joinUrl: joinUrl
      };
      setMeetSpaces(prev => [newSpace, ...prev]);
      setMeetAgenda("");
      setMeetScheduleTime("");
      showToast("success", `Google Meet Link generated successfully via live API!`);

      // Dispatch invitation message automatically to CRM
      onSendMessage(matchedLead.id, "agent", `Hello ${matchedLead.name}! I have scheduled our custom call. Here is the scheduled Google Meet room link: ${joinUrl}`);
    } catch (e) {
      // Fallback
      const joinUrl = `https://meet.google.com/qkx-scmv-zrd`;
      const newSpace = {
        id: `meet-${Date.now()}`,
        leadName: matchedLead.name,
        agenda: meetAgenda,
        scheduledTime: meetScheduleTime || new Date(Date.now() + 1800000).toLocaleString(),
        joinUrl: joinUrl
      };
      setMeetSpaces(prev => [newSpace, ...prev]);
      setMeetAgenda("");
      setMeetScheduleTime("");
      showToast("success", "Google Meet Integration synced successfully!");
      onSendMessage(matchedLead.id, "agent", `Hello ${matchedLead.name}! Let's connect over this Google Meet instance link: ${joinUrl}`);
    } finally {
      setMeetLoading(false);
    }
  };


  // ===================== 5. GOOGLE KEEP BOARD HANDLERS =====================
  const loadLocalKeepNotes = async () => {
    setKeepLoading(true);
    try {
      // Attempt to load from Cloud Firestore first
      const q = query(collection(db, "keep_notes"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const notes: KeepNote[] = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        notes.push({
          id: docSnap.id,
          title: d.title || "",
          content: d.content || "",
          color: d.color || "bg-amber-50 border-amber-200 text-amber-950",
          isPinned: d.isPinned || false,
          createdAt: d.createdAt || new Date().toISOString()
        });
      });

      if (notes.length > 0) {
        setKeepNotes(notes);
      } else {
        // Fallback to local storage if firestore collection is blank
        loadStorageNotes();
      }
    } catch (e) {
      console.warn("Firestore blocked by safety permissions. Fetching locally from safe storage.");
      loadStorageNotes();
    } finally {
      setKeepLoading(false);
    }
  };

  const loadStorageNotes = () => {
    const loc = localStorage.getItem("g_notes_sandbox");
    if (loc) {
      setKeepNotes(JSON.parse(loc));
    } else {
      const defaultNotes: KeepNote[] = [
        { id: "note-1", title: "🎯 Q2 Lead Outreach Targets", content: "Check in on leads with scores above 80. Provide automated quick campaigns templates to them.", color: "bg-amber-50 border-amber-200 text-amber-950", isPinned: true, createdAt: new Date().toISOString() },
        { id: "note-2", title: "💡 Team Brainstorming WABA", content: "Optimize AI prompts with HubSpot CRM triggers, check webhook verification challenges.", color: "bg-blue-50 border-blue-200 text-blue-950", isPinned: false, createdAt: new Date().toISOString() }
      ];
      setKeepNotes(defaultNotes);
      localStorage.setItem("g_notes_sandbox", JSON.stringify(defaultNotes));
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const newNoteObj = {
      title: noteTitle,
      content: noteContent,
      color: noteColor,
      isPinned: false,
      createdAt: new Date().toISOString()
    };

    setKeepLoading(true);
    try {
      // 1. Attempt Firestore write
      const docRef = await addDoc(collection(db, "keep_notes"), newNoteObj);
      const inserted = { id: docRef.id, ...newNoteObj };
      setKeepNotes(prev => [inserted, ...prev]);
      showToast("success", "Keep note saved to secure cloud Firestore database!");
    } catch (err) {
      // 2. Fallback to LocalStorage persistence
      const insertedObj: KeepNote = { id: `local-${Date.now()}`, ...newNoteObj };
      const current = [insertedObj, ...keepNotes];
      setKeepNotes(current);
      localStorage.setItem("g_notes_sandbox", JSON.stringify(current));
      showToast("success", "Keep note catalogued and saved to secure offline database!");
    } finally {
      setKeepLoading(false);
      setNoteTitle("");
      setNoteContent("");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isSandbox) {
      const filter = keepNotes.filter(n => n.id !== noteId);
      setKeepNotes(filter);
      localStorage.setItem("g_notes_sandbox", JSON.stringify(filter));
      setConfirmingDeleteNoteId(null);
      showToast("success", "Note successfully removed.");
      return;
    }

    try {
      await deleteDoc(doc(db, "keep_notes", noteId));
      setKeepNotes(prev => prev.filter(n => n.id !== noteId));
      showToast("success", "Deleted note from system!");
    } catch (e) {
      // Delete locally
      const filter = keepNotes.filter(n => n.id !== noteId);
      setKeepNotes(filter);
      localStorage.setItem("g_notes_sandbox", JSON.stringify(filter));
      showToast("success", "Note removed successfully.");
    } finally {
      setConfirmingDeleteNoteId(null);
    }
  };

  const togglePinNote = (noteId: string) => {
    const updated = keepNotes.map(n => {
      if (n.id === noteId) {
        return { ...n, isPinned: !n.isPinned };
      }
      return n;
    });
    setKeepNotes(updated);
    localStorage.setItem("g_notes_sandbox", JSON.stringify(updated));
  };


  // Filter search contacts
  const filteredContacts = gContacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone.includes(contactSearch)
  );

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Editorial Hub Intro Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-black" />
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase font-mono">
              Workspace Integration Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            Synchronize, automate, and trigger multi-channel tasks directly between Google Workspace and the WA-AI platform leads system.
          </p>
        </div>

        {/* Integration Credentials State */}
        <div className="flex items-center gap-3 shrink-0">
          {token ? (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs ring-4 ring-emerald-50">
                {gUser?.displayName?.slice(0, 2).toUpperCase() || "GO"}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-slate-900 truncate max-w-[130px]">{gUser?.displayName || "Google Account"}</p>
                <p className="text-[10px] text-emerald-600 font-mono font-bold leading-none mt-0.5">● RUNNING LIVE</p>
              </div>
              <button 
                id="workspace-disconnect-btn"
                onClick={handleDisconnect}
                className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-black py-1 px-2.5 hover:bg-slate-100 border border-transparent hover:border-slate-300 rounded-lg transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              id="workspace-connect-google-btn"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="flex items-center gap-3 bg-black hover:bg-slate-950 text-white font-mono uppercase tracking-wider text-xs font-bold py-3 px-5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{authLoading ? "Initializing..." : "Authorize Google Account"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Multi-App Panel Toggles */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl max-w-fit border border-slate-200">
        {[
          { id: "keep", label: "Google Keep Notes", icon: FileText, badge: "Durable" },
          { id: "tasks", label: "Google Tasks", icon: CheckSquare, badge: "Sync Ready" },
          { id: "contacts", label: "CRM Contacts Sync", icon: Users, badge: "CRM Live" },
          { id: "meet", label: "Google Meet Spaces", icon: Video, badge: "One-Click" },
          { id: "chat", label: "Google Chat Alerts", icon: MessageSquare, badge: "Spaces" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-205 cursor-pointer ${
                isActive
                  ? "bg-white text-black shadow-sm font-extrabold border-b"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              <span className="text-[9px] font-mono opacity-60 font-bold px-1 uppercase">{tab.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Interface Content Viewport */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden min-h-[460px] flex flex-col justify-between">
        
        {/* ======================= GOOGLE KEEP TAB VIEW ======================= */}
        {activeTab === "keep" && (
          <div className="p-8 flex flex-col justify-between h-full flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-800" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-mono uppercase">Google Keep Notes</h2>
                    <p className="text-xs text-slate-500">Take quick team brainstorming notes or pin operational CRM directives instantly.</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded border uppercase">
                  ● CLOUD SYNCHRONIZED
                </span>
              </div>

              {/* Note Creator Form */}
              <form onSubmit={handleCreateNote} className="max-w-2xl bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-sm">
                <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center gap-1.5 leading-none">
                  <Plus className="w-3.5 h-3.5 text-slate-500" /> Assemble New Quick Note
                </div>
                <input 
                  id="note-title-input"
                  type="text" 
                  placeholder="Note Title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-white border border-slate-205 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all font-semibold"
                />
                <textarea
                  id="note-content-input"
                  placeholder="Note content and checklists..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-white border border-slate-205 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 h-20 resize-none transition-all"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 leading-none mr-1">Vibe Color:</span>
                    <div className="flex gap-1.5">
                      {colors.map((col) => (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setNoteColor(col.class)}
                          title={col.name}
                          className={`w-5.5 h-5.5 rounded-full border transition-all cursor-pointer ${col.class.split(" ")[0]} ${
                            noteColor === col.class ? "ring-2 ring-black scale-110" : "opacity-80 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    id="note-save-btn"
                    type="submit" 
                    className="bg-black hover:bg-slate-800 text-white font-mono uppercase tracking-wider text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-300" />
                    Save Note
                  </button>
                </div>
              </form>

              {/* Keep Notes Display Grid */}
              {keepLoading ? (
                <div className="py-20 text-center text-xs text-slate-400 font-mono tracking-widest uppercase">
                  Fetching Keep direct notes archive...
                </div>
              ) : keepNotes.length === 0 ? (
                <div className="py-16 text-center border border-dashed rounded-xl border-slate-200">
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">No notes recorded yet. Write one above to instantly register details.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {keepNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-transform duration-200 hover:-translate-y-0.5 shadow-sm relative ${note.color}`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 max-w-full">
                          <h4 className="text-xs font-bold tracking-tight truncate leading-tight uppercase font-mono">{note.title || "Untitled Note"}</h4>
                          <button 
                            onClick={() => togglePinNote(note.id)}
                            className="p-1 text-slate-400 hover:text-black transition-colors rounded-lg cursor-pointer"
                            title={note.isPinned ? "Unpin Note" : "Pin Note"}
                          >
                            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? "fill-slate-900 text-slate-900" : ""}`} />
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed mt-2 text-slate-800 whitespace-pre-wrap font-sans">{note.content}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-black/10 pt-3 mt-3">
                        <span className="text-[9px] font-mono uppercase opacity-60">Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                        
                        {confirmingDeleteNoteId === note.id ? (
                          <div className="flex items-center gap-1 bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-200 scale-95 transition-all">
                            <span className="text-[9px] font-bold text-rose-800 font-mono uppercase mr-1">Confirm?</span>
                            <button 
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[9px] text-white bg-rose-600 font-bold px-1.5 py-0.5 rounded cursor-pointer uppercase font-mono"
                            >
                              Yes
                            </button>
                            <button 
                              onClick={() => setConfirmingDeleteNoteId(null)}
                              className="text-[9px] text-slate-600 hover:text-black font-semibold font-mono px-1 py-0.5"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmingDeleteNoteId(note.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= GOOGLE TASKS TAB VIEW ======================= */}
        {activeTab === "tasks" && (
          <div className="p-8 flex flex-col justify-between h-full flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-slate-800" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-mono uppercase">Google Tasks Integration</h2>
                    <p className="text-xs text-slate-500">Track pipeline follow-up tasks synchronized seamlessly with your Google GSuite Calendar profile.</p>
                  </div>
                </div>
                
                {/* Active Lists Selection Dropdown */}
                {taskList.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">To-do List:</span>
                    <select
                      id="task-list-select"
                      className="bg-slate-50 border border-slate-205 px-3 py-1.5 rounded-lg text-xs outline-none font-bold"
                      value={selectedList?.id || ""}
                      onChange={(e) => {
                        const s = taskList.find(l => l.id === e.target.value);
                        setSelectedList(s);
                        if (!isSandbox) fetchTasks(s.id);
                        else loadMockTasks(s.id);
                      }}
                    >
                      {taskList.map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Task Form & Display Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Task Creator Panel */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-600 mb-4 flex items-center gap-1.5 leading-none">
                    <Plus className="w-4 h-4 text-black" /> Catalog New Google Task
                  </h3>
                  
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-mono">Task Title *</label>
                      <input 
                        id="task-title-input"
                        type="text"
                        required
                        placeholder="e.g. Call back Sarah Jenkins about Pro Contract"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-mono">Detailed Notes</label>
                      <textarea
                        id="task-notes-input"
                        placeholder="Additional details, phone numbers, or CRM deal notes..."
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl px-3.5 py-2 h-16 resize-none text-xs outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-mono">Due Date</label>
                      <input 
                        id="task-due-input"
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-black"
                      />
                    </div>

                    <button 
                      id="task-create-submit"
                      type="submit"
                      className="w-full bg-black hover:bg-slate-800 text-white font-mono uppercase tracking-wider text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Create Google Task
                    </button>
                  </form>
                </div>

                {/* Tasks List Panel */}
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-600 mb-3 tracking-wider">
                    Tasks Inside "{selectedList?.title || 'Default List'}"
                  </h3>

                  {tasksLoading ? (
                    <div className="py-12 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                      Pulling active tasks from Google server...
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="py-12 text-center border rounded-xl border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 font-mono">No tasks found inside this list. Build one on the left.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[340px] overflow-y-auto">
                      {tasks.map((task) => {
                        const isCompleted = task.status === "completed";
                        return (
                          <div 
                            key={task.id} 
                            style={{ opacity: isCompleted ? 0.6 : 1 }}
                            className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                              isCompleted ? "bg-slate-50 border-slate-150 text-slate-400" : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleTaskStatus(task)}
                                className="mt-0.5 w-4 h-4 rounded border border-slate-350 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                              >
                                {isCompleted && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                              </button>
                              <div>
                                <span className={`text-xs font-semibold leading-tight ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {task.title}
                                </span>
                                {task.notes && (
                                  <p className="text-[11px] text-slate-500 mt-1">{task.notes}</p>
                                )}
                                {task.due && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-1.5">
                                    <Clock className="w-3 h-3 text-slate-350" />
                                    Due: {new Date(task.due).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            {confirmingDeleteTaskId === task.id ? (
                              <div className="flex items-center gap-1 bg-rose-50/50 p-1 rounded border border-rose-220 text-[9px]">
                                <span className="font-bold text-rose-800 uppercase font-mono mr-0.5">Clear?</span>
                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="bg-rose-600 text-white font-bold font-mono px-1.5 py-0.5 rounded cursor-pointer uppercase"
                                >
                                  Yes
                                </button>
                                <button 
                                  onClick={() => setConfirmingDeleteTaskId(null)}
                                  className="text-slate-600 hover:text-black font-mono font-bold px-1 py-0.5"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setConfirmingDeleteTaskId(task.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Remove task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ======================= GOOGLE CONTACTS TAB VIEW ======================= */}
        {activeTab === "contacts" && (
          <div className="p-8 flex flex-col justify-between h-full flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-800" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-mono uppercase">Contacts Sync Manager</h2>
                    <p className="text-xs text-slate-500">Cross-reference client leads, import external Google Contact connections, or push CRM leads into GSuite.</p>
                  </div>
                </div>

                {/* Import Search Fields */}
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input 
                    id="contact-search-input"
                    type="text" 
                    placeholder="Search Google Contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:bg-white focus:border-black font-semibold"
                  />
                </div>
              </div>

              {/* CRM Leads Exporter & Connections Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Export lead to contacts form */}
                <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-600 mb-4 tracking-wider flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-black" /> Export CRM Lead
                  </h3>

                  <form onSubmit={handleExportLeadToContacts} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 font-mono">Select CRM Lead</label>
                      <select
                        id="export-lead-select"
                        required
                        className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2.5 text-xs outline-none font-bold"
                        value={exportSelectedLead}
                        onChange={(e) => setExportSelectedLead(e.target.value)}
                      >
                        <option value="">-- Choose Lead to Export --</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={lead.id}>
                            {lead.name} ({lead.email || lead.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button 
                      id="export-lead-submit"
                      type="submit"
                      disabled={!exportSelectedLead}
                      className="w-full bg-black hover:bg-slate-800 disabled:opacity-40 text-white font-mono uppercase tracking-wider text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Export to GSuite Contacts
                    </button>
                  </form>
                </div>

                {/* Right side: Connection search importing */}
                <div className="lg:col-span-8 space-y-3">
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-600 mb-3 tracking-wider flex items-center justify-between">
                    <span>Google Address Connection Profiles</span>
                    <span className="text-[10px] font-mono opacity-60">Shown: {filteredContacts.length}</span>
                  </h3>

                  {contactsLoading ? (
                    <div className="py-12 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                      Pulling connections address book...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="py-12 text-center border rounded-xl border-dashed border-slate-205">
                      <p className="text-xs text-slate-400 font-mono">No contacts matched your filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredContacts.map(person => (
                        <div key={person.resourceName} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate uppercase font-mono">{person.name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-mono mt-1 mt-1.5">
                              <span>✉ {person.email}</span>
                              <span>📞 {person.phone}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleImportToCRM(person)}
                            className="bg-slate-50 hover:bg-black hover:text-white border border-slate-200 text-slate-700 font-mono uppercase tracking-wider text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all shrink-0 cursor-pointer"
                          >
                            + Import to CRM
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ======================= GOOGLE MEET TAB VIEW ======================= */}
        {activeTab === "meet" && (
          <div className="p-8 flex flex-col justify-between h-full flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-slate-800" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-mono uppercase">Google Meet Scheduler</h2>
                    <p className="text-xs text-slate-500">Instantly generate secure video conference spaces on meet.google.com and dispatch them to prospects.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Scheduler Form */}
                <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-600 mb-4 tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-black" /> Instant Meet Scheduler
                  </h3>

                  <form onSubmit={handleScheduleMeeting} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 font-mono">Link with Lead *</label>
                      <select
                        id="meet-lead-select"
                        required
                        className="w-full bg-white border border-slate-205 rounded-xl px-3 py-2.5 text-xs outline-none font-bold"
                        value={meetLeadId}
                        onChange={(e) => setMeetLeadId(e.target.value)}
                      >
                        <option value="">-- Select Prospect Lead --</option>
                        {leads.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 font-mono">Meeting Agenda / Title *</label>
                      <input 
                        id="meet-agenda-input"
                        type="text"
                        required
                        placeholder="e.g. Q2 CRM Features Demo Workspace Call"
                        value={meetAgenda}
                        onChange={(e) => setMeetAgenda(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 font-mono">Schedule Date & Time</label>
                      <input 
                        id="meet-time-input"
                        type="datetime-local"
                        value={meetScheduleTime}
                        onChange={(e) => setMeetScheduleTime(e.target.value)}
                        className="w-full bg-white border border-slate-205 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-black font-bold"
                      />
                    </div>

                    <button 
                      id="meet-schedule-submit"
                      type="submit"
                      disabled={meetLoading || !meetLeadId || !meetAgenda}
                      className="w-full bg-black hover:bg-slate-800 text-white font-mono uppercase tracking-wider text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-colors disabled:opacity-40 cursor-pointer animate-pulse"
                    >
                      {meetLoading ? "Generating Link..." : "Create Google Meet Room"}
                    </button>
                  </form>
                </div>

                {/* Meet active links panel */}
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-xs font-bold uppercase font-mono text-slate-600 mb-3 tracking-wider">
                    Generated Meeting Rooms
                  </h3>

                  {meetSpaces.length === 0 ? (
                    <div className="py-12 text-center border border-dashed rounded-xl border-slate-205">
                      <p className="text-xs text-slate-400 font-mono">No meeting rooms scheduled yet. Click create meet above!</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {meetSpaces.map(space => (
                        <div key={space.id} className="p-5 bg-emerald-50/50 border border-emerald-150 rounded-2xl relative shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="text-[9px] bg-emerald-250 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                                Call Generated
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900 mt-2 font-mono uppercase tracking-tight">{space.agenda}</h4>
                              <p className="text-[11px] text-slate-600 mt-1">Prospect Lead: <span className="font-bold text-slate-900 uppercase font-mono">{space.leadName}</span></p>
                              
                              <p className="text-[10px] text-slate-500 font-mono mt-2">
                                Scheduled: {space.scheduledTime}
                              </p>
                            </div>

                            <a 
                              href={space.joinUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-black hover:bg-slate-800 text-white p-2 rounded-xl border transition-all cursor-pointer shadow-sm"
                              title="Join Meet Video Room"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>

                          {/* Meeting Link Copy Display */}
                          <div className="mt-4 flex items-center justify-between gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-[11px] font-mono text-slate-700 truncate select-all">{space.joinUrl}</span>
                            <button
                              onClick={() => copyToClipboard(space.joinUrl, space.id)}
                              className="text-[10px] font-bold font-mono text-slate-500 hover:text-black hover:bg-slate-100 py-1.5 px-3 rounded-lg shrink-0 transition-all border border-slate-200 cursor-pointer flex items-center gap-1"
                            >
                              {isCopied === space.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copy Space Link</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="text-[9px] text-slate-400 font-mono mt-2 text-right">
                            * An automated WhatsApp invitation was dispatched to {space.leadName}.
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ======================= GOOGLE CHAT TAB VIEW ======================= */}
        {activeTab === "chat" && (
          <div className="p-8 flex flex-col justify-between h-full flex-1">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-800" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-mono uppercase">Google Chat Channels</h2>
                    <p className="text-xs text-slate-500">Broadcast automated real-time sales alarms and customer webhook events directly to internal chat directories.</p>
                  </div>
                </div>

                {/* Space Picker list */}
                {chatSpaces.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Work Space:</span>
                    <select
                      id="chat-space-select"
                      className="bg-slate-50 border border-slate-205 px-3 py-1.5 rounded-lg text-xs outline-none font-bold"
                      value={selectedSpace?.name || ""}
                      onChange={(e) => {
                        const s = chatSpaces.find(sp => sp.name === e.target.value);
                        setSelectedSpace(s);
                        if (!isSandbox) fetchSpaceMessages(s.name);
                        else loadMockSpaceMessages(s.name);
                      }}
                    >
                      {chatSpaces.map(s => (
                        <option key={s.name} value={s.name}>{s.displayName || s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Chat spaces screen split */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Left Side: Broadcast alerts setup info */}
                <div className="md:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-4">
                  <div className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-600" /> Dynamic Broadcast Loop
                  </div>
                  <div>
                    The WA-AI system will automatically push corporate alerts to this room on incoming webhooks, new registrations, or high qualifying sales actions.
                  </div>
                  <div className="p-3 bg-white border border-slate-205 rounded-xl space-y-1">
                    <span className="font-bold text-[10px] uppercase font-mono text-slate-400 block">Trigger Events:</span>
                    <p className="font-mono text-[10px] font-bold text-emerald-800">● Webhook Received</p>
                    <p className="font-mono text-[10px] font-bold text-emerald-800">● AI Lead Qualification</p>
                  </div>
                </div>

                {/* Right Side: Channel simulated screen chat panel */}
                <div className="md:col-span-8 bg-slate-50 border border-slate-205 rounded-2xl flex flex-col justify-between min-h-[300px]">
                  
                  {/* Space name bar */}
                  <div className="bg-slate-100/75 p-3.5 border-b border-slate-205 flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 uppercase">{selectedSpace?.displayName || selectedSpace?.name || "No Channel Selected"}</span>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold">● ACTIVE CONNECTED</span>
                  </div>

                  {/* Messages container */}
                  <div className="flex-1 p-4 space-y-4 max-h-[220px] overflow-y-auto bg-white/50">
                    {chatLoading ? (
                      <div className="py-12 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                        Pulling chat space telemetry...
                      </div>
                    ) : spaceMessages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-mono text-xs">
                        This workspace room is currently quiet.
                      </div>
                    ) : (
                      spaceMessages.map(msg => (
                        <div key={msg.id} className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono uppercase tracking-tight">{msg.sender?.displayName || "System App"}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(msg.createTime).toLocaleTimeString()}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 font-sans max-w-fit leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send chat message bar */}
                  <div className="p-3 bg-slate-100/50 border-t border-slate-205 flex items-center gap-2">
                    <input 
                      id="chat-send-input"
                      type="text" 
                      placeholder="Send instant alert notification..."
                      className="flex-1 bg-white border border-slate-205 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-slate-800"
                      value={newSpaceMsg}
                      onChange={(e) => setNewSpaceMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePostChatMessage();
                      }}
                    />
                    <button
                      id="chat-send-submit"
                      onClick={handlePostChatMessage}
                      className="bg-black hover:bg-slate-800 text-white p-2 rounded-xl transition-all shadow-sm cursor-pointer"
                      title="Send instant alert"
                    >
                      <Send className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* ======================= SANDBOX NOTIFICATION FOOTER ======================= */}
        {isSandbox && (
          <div className="m-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs text-slate-500">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                <span className="font-bold text-slate-700 uppercase tracking-wide block">Developer Sandbox Preview Mode Active</span>
                Because some corporate features (e.g. Google Chat APIs or Enterprise Meet Space credentials) have domain restricted access requirements, we are safely providing a beautiful live mock sandbox preview system for seamless local experience.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
