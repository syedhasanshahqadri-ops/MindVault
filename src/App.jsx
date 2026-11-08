import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowUpRight, BrainCircuit, Check, ChevronDown, CircleHelp, Command,
  Compass, FileText, FolderOpen, Gem, Globe2, LayoutDashboard, LogOut, Menu,
  Mic, MoreHorizontal, Network, Plus, Search, Send, Settings, ShieldCheck,
  Sparkles, Star, Sun, Tag, Trash2, WandSparkles, X, Zap, Clock3
} from 'lucide-react';
import {
  auth, db, configured, googleProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged
} from './firebase';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc
} from 'firebase/firestore';

const starterMemories = [
  { id: 'demo1', title: 'Learn React deeply', body: 'Build a small project every week and understand components, hooks and state.', category: 'Learning', createdAt: new Date(Date.now()-3600000) },
  { id: 'demo2', title: 'Mindvault product vision', body: 'A calm, private second brain that connects ideas and makes personal knowledge useful.', category: 'Ideas', createdAt: new Date(Date.now()-86400000) },
  { id: 'demo3', title: 'Portfolio refresh', body: 'Create a portfolio with selected projects, a short introduction and contact details.', category: 'Projects', createdAt: new Date(Date.now()-172800000) }
];

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'memories', label: 'My memories', icon: BrainCircuit },
  { id: 'assistant', label: 'AI assistant', icon: Sparkles },
  { id: 'graph', label: 'Knowledge graph', icon: Network },
  { id: 'timeline', label: 'Timeline', icon: Clock3 }
];

function initials(user) {
  return (user?.displayName || user?.email || 'M').slice(0,1).toUpperCase();
}

function AuthScreen({ onDemo }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(!configured);

  async function emailAuth(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (!configured) throw new Error('Firebase is not configured yet. Use demo mode or add your Firebase settings.');
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError('');
    try {
      if (!configured) throw new Error('Add Firebase settings to enable Google sign-in.');
      await signInWithPopup(auth, googleProvider);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-page">
    <div className="auth-glow glow-a" /><div className="auth-glow glow-b" />
    <div className="auth-top"><Brand /><span className="secure-note"><ShieldCheck size={14}/> Private by design</span></div>
    <div className="auth-layout">
      <section className="auth-story">
        <div className="eyebrow"><span className="pulse-dot"/> YOUR SECOND BRAIN, REIMAGINED</div>
        <h1>Make space for<br/><span>brighter thinking.</span></h1>
        <p className="story-copy">A personal intelligence space for the ideas, plans and little details you don't want to lose.</p>
        <div className="orbit-card">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="orbit-core"><BrainCircuit size={34}/></div>
          <span className="orbit-node node-one"><Sparkles size={15}/></span>
          <span className="orbit-node node-two"><FileText size={15}/></span>
          <span className="orbit-node node-three"><Network size={15}/></span>
          <div className="orbit-caption">Your ideas, connected.</div>
        </div>
        <div className="auth-proof"><span><ShieldCheck size={15}/> Your data stays yours</span><span><Zap size={15}/> AI-powered clarity</span></div>
      </section>
      <section className="auth-card">
        <div className="auth-card-head"><div className="mini-mark"><BrainCircuit size={19}/></div><div><h2>Welcome to Mindvault</h2><p>Sign in to open your space.</p></div></div>
        <button className="google-btn" onClick={google} disabled={busy}><span className="google-g">G</span> Continue with Google</button>
        <div className="auth-divider"><span/>or continue with email<span/></div>
        <form onSubmit={emailAuth} className="auth-form">
          <label>Email address<input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" placeholder="At least 6 characters" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required /></label>
          {error && <div className="error-msg">{error}</div>}
          <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16}/></button>
        </form>
        <p className="switch-auth">{mode === 'login' ? "New to Mindvault?" : "Already have an account?"} <button onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Create account':'Sign in'}</button></p>
        <div className="auth-foot"><ShieldCheck size={13}/> Secure authentication powered by Firebase</div>
        <button className="demo-link" onClick={onDemo}>Explore the demo first <ArrowUpRight size={13}/></button>
      </section>
    </div>
    <div className="auth-bottom">MINDVAULT <span>·</span> A quieter place for a louder mind.</div>
  </div>;
}

function Brand() {
  return <div className="brand"><div className="brand-icon"><BrainCircuit size={20}/></div><span>mindvault<span className="brand-period">.</span></span></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!configured);
  const [demo, setDemo] = useState(!configured);
  const [active, setActive] = useState('overview');
  const [memories, setMemories] = useState(starterMemories);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [chat, setChat] = useState([{ role:'assistant', content:'Hey! I’m your Mindvault assistant. Ask me anything, explore an idea, draft something, or search your saved memories.' }]);
  const [prompt, setPrompt] = useState('');
  const [thinking, setThinking] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!configured) return;
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setDemo(false); setAuthReady(true); });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'users', user.uid, 'memories'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      setMemories(snap.docs.map(d => ({ id:d.id, ...d.data(), createdAt:d.data().createdAt?.toDate?.() || new Date() })));
    }, err => setToast('Could not load memories: ' + err.message));
    return unsub;
  }, [user]);

  const filtered = useMemo(() => memories.filter(m => `${m.title} ${m.body} ${m.category}`.toLowerCase().includes(search.toLowerCase())), [memories, search]);
  const count = memories.length;
  const firstName = user?.displayName?.split(' ')[0] || 'there';

  async function addMemory(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    const item = { title:newTitle.trim(), body:newBody.trim(), category:newCategory, createdAt: new Date() };
    if (user && db) await addDoc(collection(db,'users',user.uid,'memories'), { ...item, createdAt:serverTimestamp() });
    else setMemories(prev => [{...item,id:crypto.randomUUID()},...prev]);
    setNewTitle(''); setNewBody(''); setNewCategory('Personal'); setShowAdd(false); notify('Memory saved to your vault.');
  }
  async function removeMemory(id) {
    if (user && db) await deleteDoc(doc(db,'users',user.uid,'memories',id));
    else setMemories(prev=>prev.filter(m=>m.id!==id));
    notify('Memory deleted.');
  }
  async function sendChat(e) {
    e.preventDefault();
    if (!prompt.trim() || thinking) return;
    const question = prompt.trim(); setPrompt('');
    const next = [...chat, {role:'user',content:question}]; setChat(next); setThinking(true);
    try {
      const response = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ messages:next.slice(-12), memories:memories.slice(0,30).map(({title,body,category})=>({title,body,category})) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI service is not configured yet.');
      setChat(prev=>[...prev,{role:'assistant',content:data.reply}]);
    } catch(err) {
      setChat(prev=>[...prev,{role:'assistant',content:`I couldn't reach the AI service yet. ${err.message}\n\nAdd your AI API key to the backend .env file, then restart the server. Your saved memories are still available here.`}]);
    } finally { setThinking(false); }
  }
  function notify(msg) { setToast(msg); setTimeout(()=>setToast(''),2600); }
  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return notify('Voice input is not supported in this browser. Try Chrome.');
    const rec = new SpeechRecognition(); rec.lang='en-US'; rec.interimResults=false;
    rec.onresult = e => setPrompt(p => (p ? p+' ' : '') + e.results[0][0].transcript);
    rec.onerror = () => notify('Voice capture could not start.');
    rec.start(); notify('Listening… speak now.');
  }
  async function logout() {
    if (user) await signOut(auth);
    setDemo(true); setUser(null); setActive('overview'); setMemories(starterMemories);
  }

  if (!authReady) return <div className="loading-screen"><div className="loading-orb"><BrainCircuit/></div><span>Opening your vault…</span></div>;
  if (!user && !demo) return <AuthScreen onDemo={()=>setDemo(true)}/>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'mobile-open':''}`}>
      <div className="side-brand"><Brand/><button className="icon-btn mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={12}/></div>
      <div className="workspace-switch"><div className="workspace-avatar"><Gem size={16}/></div><div><b>Personal vault</b><small>{demo?'Demo workspace':'Private workspace'}</small></div><MoreHorizontal size={17}/></div>
      <div className="nav-label">YOUR SPACE</div>
      <nav>{navItems.map(item=><button key={item.id} className={`nav-item ${active===item.id?'active':''}`} onClick={()=>{setActive(item.id);setMobileNav(false)}}><item.icon size={17}/><span>{item.label}</span>{item.id==='assistant'&&<span className="nav-new">AI</span>}</button>)}</nav>
      <div className="side-divider"/>
      <div className="nav-label">COLLECTIONS</div>
      <button className="nav-item" onClick={()=>{setActive('memories');setSearch('Learning')}}><span className="collection-dot purple"/>Learning</button>
      <button className="nav-item" onClick={()=>{setActive('memories');setSearch('Ideas')}}><span className="collection-dot blue"/>Ideas</button>
      <button className="nav-item" onClick={()=>{setActive('memories');setSearch('Projects')}}><span className="collection-dot orange"/>Projects</button>
      <div className="sidebar-spacer"/>
      <div className="plan-card"><div className="plan-spark"><Sparkles size={15}/></div><b>Your mind, expanded.</b><p>Connect your ideas and make every thought count.</p><button onClick={()=>setActive('assistant')}>Explore AI assistant <ArrowUpRight size={13}/></button></div>
      <div className="profile-row"><div className="avatar">{user?initials(user):'M'}</div><div className="profile-info"><b>{user?.displayName || (demo?'Guest explorer':'Your account')}</b><small>{user?.email || (demo?'Demo mode':'')}</small></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={16}/></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="top-left"><button className="icon-btn menu-toggle" onClick={()=>setMobileNav(true)}><Menu size={19}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{navItems.find(n=>n.id===active)?.label || 'Overview'}</b></div></div>
        <div className="top-actions"><div className="search-box"><Search size={15}/><input placeholder="Search your vault..." value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value)setActive('memories')}}/><kbd>⌘ K</kbd></div><button className="icon-btn" title="Help"><CircleHelp size={17}/></button><div className="top-avatar">{user?initials(user):'M'}</div></div>
      </header>
      {demo && <div className="demo-banner"><Sparkles size={14}/> You’re exploring demo mode. Connect Firebase to enable secure accounts and cloud-synced memories. <button onClick={()=>notify('Add your Firebase credentials in .env to enable sign-in.')}>Setup guide</button></div>}
      <div className="page-content">
        {active==='overview' && <Overview firstName={firstName} count={count} memories={memories} setActive={setActive} onAdd={()=>setShowAdd(true)} />}
        {active==='memories' && <Memories memories={filtered} onAdd={()=>setShowAdd(true)} onDelete={removeMemory} search={search} setSearch={setSearch}/>}
        {active==='assistant' && <Assistant chat={chat} prompt={prompt} setPrompt={setPrompt} onSend={sendChat} thinking={thinking} onVoice={startVoice}/>}
        {active==='graph' && <Graph memories={memories}/>}
        {active==='timeline' && <Timeline memories={memories}/>}
      </div>
    </main>
    {showAdd && <div className="modal-backdrop" onClick={()=>setShowAdd(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">CAPTURE A THOUGHT</span><h2>New memory</h2></div><button className="icon-btn" onClick={()=>setShowAdd(false)}><X size={18}/></button></div><form onSubmit={addMemory}><label>Title<input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Give this memory a name…" required/></label><label>Details<textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Write down the thought, idea or detail…" rows="5" required/></label><label>Collection<select value={newCategory} onChange={e=>setNewCategory(e.target.value)}><option>Personal</option><option>Learning</option><option>Ideas</option><option>Projects</option><option>Work</option></select></label><button className="primary-btn full">Save memory <Check size={16}/></button></form></div></div>}
    {toast && <div className="toast"><Check size={15}/>{toast}</div>}
  </div>;
}

function PageHeading({eyebrow,title,desc,action}) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>{action}</div>;
}
function Overview({firstName,count,memories,setActive,onAdd}) {
  return <div className="fade-in">
    <PageHeading eyebrow="SUNDAY, NOVEMBER 08" title={<>Good evening, {firstName}<span className="heading-period">.</span></>} desc="Your mind is a universe. Let’s make sense of it." action={<button className="primary-btn" onClick={onAdd}><Plus size={16}/> Capture memory</button>}/>
    <section className="hero-panel"><div className="hero-grid"/><div className="hero-copy"><div className="hero-kicker"><Sparkles size={14}/> YOUR PERSONAL INTELLIGENCE SPACE</div><h2>Every thought has<br/>a place to <span>belong.</span></h2><p>Capture what matters. Connect the dots. Let your ideas grow into something bigger.</p><button className="hero-button" onClick={()=>setActive('assistant')}>Talk to your AI <ArrowUpRight size={15}/></button></div><div className="hero-visual"><div className="hero-ring ring-a"/><div className="hero-ring ring-b"/><div className="hero-brain"><BrainCircuit size={54}/></div><div className="float-chip chip-a"><Sparkles size={13}/> Ideas connected</div><div className="float-chip chip-b"><Activity size={13}/> Mind in motion</div><div className="float-chip chip-c"><ShieldCheck size={13}/> Private space</div></div></section>
    <div className="stats-grid"><Stat icon={BrainCircuit} label="Memories saved" value={count.toString().padStart(2,'0')} trend="Your knowledge, growing" tone="violet"/><Stat icon={Network} label="Ideas connected" value={Math.max(0,count-1).toString().padStart(2,'0')} trend="Build your knowledge graph" tone="blue"/><Stat icon={Activity} label="Vault activity" value="Today" trend="Keep your momentum" tone="green"/></div>
    <div className="section-row"><div><h3>Recently captured</h3><p>Your latest thoughts and ideas</p></div><button className="text-button" onClick={()=>setActive('memories')}>View all <ArrowUpRight size={14}/></button></div>
    <div className="memory-grid">{memories.slice(0,3).map(m=><MemoryCard key={m.id} memory={m}/>)}</div>
    <div className="bottom-prompt"><div className="prompt-icon"><WandSparkles size={19}/></div><div><b>Have a thought? Give it a home.</b><p>One small note today can become a big idea tomorrow.</p></div><button className="outline-btn" onClick={onAdd}>Add a memory <Plus size={14}/></button></div>
  </div>;
}
function Stat({icon:Icon,label,value,trend,tone}) {return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={17}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-trend">{trend}</div></div>;}
function MemoryCard({memory,onDelete}) {return <article className="memory-card"><div className="memory-card-top"><span className="category-pill">{memory.category||'Personal'}</span><button className="icon-btn"><MoreHorizontal size={16}/></button></div><h4>{memory.title}</h4><p>{memory.body}</p><div className="memory-card-foot"><span><Clock3 size={12}/>{memory.createdAt?.toLocaleDateString?.() || 'Recently'}</span><ArrowUpRight size={14}/></div></article>;}
function Memories({memories,onAdd,onDelete,search,setSearch}) {
  return <div className="fade-in"><PageHeading eyebrow="YOUR PERSONAL ARCHIVE" title="My memories." desc="A home for everything worth remembering." action={<button className="primary-btn" onClick={onAdd}><Plus size={16}/> New memory</button>}/><div className="filter-row"><div className="inline-search"><Search size={16}/><input placeholder="Find a memory..." value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="result-count">{memories.length} memories</span></div>{memories.length?<div className="memory-grid">{memories.map(m=><div className="memory-wrap" key={m.id}><MemoryCard memory={m}/><button className="delete-memory" onClick={()=>onDelete(m.id)} title="Delete memory"><Trash2 size={14}/></button></div>)}</div>:<div className="empty-state"><div className="empty-icon"><FolderOpen size={26}/></div><h3>No memories found</h3><p>Try another search or capture a new thought.</p><button className="outline-btn" onClick={onAdd}><Plus size={14}/> Capture your first memory</button></div>}</div>;
}
function Assistant({chat,prompt,setPrompt,onSend,thinking,onVoice}) {
  const suggestions=['Help me plan my week','Explain a complex topic simply','Brainstorm a new project','Find connections in my memories'];
  return <div className="fade-in assistant-page"><PageHeading eyebrow="MINDVAULT INTELLIGENCE" title="Your AI companion." desc="Think out loud. Ask anything. Make something meaningful."/><div className="assistant-shell"><div className="assistant-top"><div className="assistant-avatar"><Sparkles size={19}/></div><div><b>Mindvault AI</b><span><i className="online-dot"/> Ready to think with you</span></div><div className="model-tag">GENERAL AI <ChevronDown size={12}/></div></div><div className="chat-scroll">{chat.map((m,i)=><div className={`chat-row ${m.role}`} key={i}><div className="chat-avatar">{m.role==='assistant'?<BrainCircuit size={16}/>:<span>Y</span>}</div><div className="chat-bubble"><div className="chat-role">{m.role==='assistant'?'MINDVAULT AI':'YOU'}</div><p>{m.content}</p></div></div>)}{thinking&&<div className="chat-row assistant"><div className="chat-avatar"><BrainCircuit size={16}/></div><div className="typing"><i/><i/><i/></div></div>}</div><div className="suggestion-row">{suggestions.map(s=><button key={s} onClick={()=>setPrompt(s)}>{s}<ArrowUpRight size={12}/></button>)}</div><form className="chat-composer" onSubmit={onSend}><button type="button" className="composer-tool" onClick={onVoice} title="Voice input"><Mic size={18}/></button><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask anything, or tell me what's on your mind…" rows="1" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onSend(e)}}}/><button className="send-btn" disabled={!prompt.trim()||thinking}><Send size={17}/></button></form><div className="composer-note"><ShieldCheck size={12}/> Your saved memories are included as private context for this conversation.</div></div></div>;
}
function Graph({memories}) {
  const nodes = memories.slice(0,8);
  return <div className="fade-in"><PageHeading eyebrow="CONNECTED THINKING" title="Knowledge graph." desc="See how your ideas and memories relate to one another."/><div className="graph-panel"><div className="graph-toolbar"><span><span className="pulse-dot"/> LIVE KNOWLEDGE MAP</span><span>{nodes.length} NODES · PREVIEW</span></div><div className="graph-canvas"><svg className="graph-lines" viewBox="0 0 800 420" preserveAspectRatio="none">{nodes.slice(1).map((n,i)=><line key={n.id} x1="400" y1="210" x2={120+(i%3)*280} y2={75+Math.floor(i/3)*250}/>)}</svg><div className="graph-center"><BrainCircuit size={27}/><span>YOUR VAULT</span></div>{nodes.map((n,i)=><div className={`graph-node node-${i%7}`} key={n.id} style={{left:`${[15,50,84,22,76,39,63,89][i]}%`,top:`${[18,12,24,72,70,88,52,85][i]}%`}}><span className="node-dot"/><b>{n.title}</b><small>{n.category}</small></div>)}</div><div className="graph-legend"><span><i className="legend-violet"/> Memory</span><span><i className="legend-blue"/> Connected idea</span><span>Connections are a visual preview; semantic linking can be added in the next build.</span></div></div></div>;
}
function Timeline({memories}) {
  const sorted=[...memories].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return <div className="fade-in"><PageHeading eyebrow="YOUR STORY, IN MOMENTS" title="Memory timeline." desc="A chronological view of the things you've captured."/><div className="timeline-panel"><div className="timeline-head"><div><h3>Your journey</h3><p>{sorted.length} moments captured so far</p></div><span className="timeline-filter"><Clock3 size={14}/> Newest first</span></div>{sorted.length?<div className="timeline-list">{sorted.map((m,i)=><div className="timeline-item" key={m.id}><div className="timeline-rail"><span className="timeline-dot"/>{i!==sorted.length-1&&<i/>}</div><div className="timeline-content"><span>{m.createdAt?.toLocaleString?.()||'Recently'}</span><h4>{m.title}</h4><p>{m.body}</p><small>{m.category}</small></div></div>)}</div>:<div className="empty-state"><h3>Your story starts here</h3><p>Capture a memory to see it on your timeline.</p></div>}</div></div>;
}

export default App;
