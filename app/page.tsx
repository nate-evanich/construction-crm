'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Client = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
};

type JobStatus = 'Lead' | 'Quoted' | 'Active' | 'Completed' | 'Lost';

type Job = {
  id: string;
  title: string;
  clientId: string;
  status: JobStatus;
  value: number;
  address: string;
  notes: string;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);
const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const STATUS_COLORS: Record<JobStatus, string> = {
  Lead: 'bg-yellow-100 text-yellow-800',
  Quoted: 'bg-blue-100 text-blue-800',
  Active: 'bg-green-100 text-green-800',
  Completed: 'bg-gray-200 text-gray-700',
  Lost: 'bg-red-100 text-red-700',
};

const STATUSES: JobStatus[] = ['Lead', 'Quoted', 'Active', 'Completed', 'Lost'];

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_CLIENTS: Client[] = [
  { id: 'c1', name: 'Mike Torres', company: 'Torres Realty', phone: '(512) 555-0101', email: 'mike@torresrealty.com' },
  { id: 'c2', name: 'Sandra Lee', company: 'Lee Properties', phone: '(512) 555-0202', email: 'sandra@leeprops.com' },
  { id: 'c3', name: 'Dave Kim', company: 'Kim & Sons Dev', phone: '(737) 555-0303', email: 'dave@kimsons.com' },
];

const SEED_JOBS: Job[] = [
  { id: 'j1', title: 'Kitchen Remodel', clientId: 'c1', status: 'Active', value: 42000, address: '204 Oak St, Austin TX', notes: 'Cabinets arrive Thursday.', createdAt: '2026-04-10' },
  { id: 'j2', title: 'Office Build-Out', clientId: 'c2', status: 'Quoted', value: 118000, address: '900 Congress Ave, Austin TX', notes: 'Waiting on permit approval.', createdAt: '2026-05-01' },
  { id: 'j3', title: 'Deck Addition', clientId: 'c3', status: 'Lead', value: 18500, address: '77 Riverside Dr, Austin TX', notes: '', createdAt: '2026-05-20' },
  { id: 'j4', title: 'Roof Replacement', clientId: 'c1', status: 'Completed', value: 31000, address: '204 Oak St, Austin TX', notes: 'Paid in full.', createdAt: '2026-02-15' },
];

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Client form ───────────────────────────────────────────────────────────────

function ClientForm({ initial, onSave, onClose }: { initial?: Client; onSave: (c: Client) => void; onClose: () => void }) {
  const [form, setForm] = useState<Client>(
    initial ?? { id: uid(), name: '', company: '', phone: '', email: '' }
  );
  const set = (k: keyof Client) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      {(['name', 'company', 'phone', 'email'] as const).map(k => (
        <div key={k}>
          <label className="block text-sm font-medium capitalize mb-1">{k}</label>
          <input
            className="w-full border rounded px-3 py-1.5 text-sm"
            value={form[k]}
            onChange={set(k)}
            required={k === 'name'}
            type={k === 'email' ? 'email' : 'text'}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Save</button>
        <button type="button" onClick={onClose} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ── Job form ──────────────────────────────────────────────────────────────────

function JobForm({ initial, clients, onSave, onClose }: {
  initial?: Job; clients: Client[]; onSave: (j: Job) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<Job>(
    initial ?? { id: uid(), title: '', clientId: clients[0]?.id ?? '', status: 'Lead', value: 0, address: '', notes: '', createdAt: new Date().toISOString().slice(0, 10) }
  );
  const set = (k: keyof Job) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: k === 'value' ? Number(e.target.value) : e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Job Title</label>
        <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.title} onChange={set('title')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Client</label>
          <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.clientId} onChange={set('clientId')}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Value ($)</label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" type="number" value={form.value} onChange={set('value')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date Added</label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" type="date" value={form.createdAt} onChange={set('createdAt')} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Job Address</label>
        <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.address} onChange={set('address')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea className="w-full border rounded px-3 py-1.5 text-sm" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Save</button>
        <button type="button" onClick={onClose} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function Dashboard({ clients, jobs }: { clients: Client[]; jobs: Job[] }) {
  const active = jobs.filter(j => j.status === 'Active');
  const pipeline = jobs.filter(j => j.status === 'Lead' || j.status === 'Quoted');
  const completed = jobs.filter(j => j.status === 'Completed');
  const totalRevenue = completed.reduce((s, j) => s + j.value, 0);
  const pipelineValue = pipeline.reduce((s, j) => s + j.value, 0);

  const cards = [
    { label: 'Total Clients', value: clients.length },
    { label: 'Active Jobs', value: active.length },
    { label: 'In Pipeline', value: `${pipeline.length} jobs · ${fmt$(pipelineValue)}` },
    { label: 'Revenue Completed', value: fmt$(totalRevenue) },
  ];

  const recent = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</div>
            <div className="mt-1 text-xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Recent Jobs</h2>
        <table className="w-full text-sm border rounded-lg overflow-hidden bg-white">
          <thead className="bg-gray-50 text-left">
            <tr>
              {['Job', 'Client', 'Status', 'Value', 'Date'].map(h => (
                <th key={h} className="px-3 py-2 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map(j => (
              <tr key={j.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{j.title}</td>
                <td className="px-3 py-2 text-gray-600">{clientMap[j.clientId]?.name ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[j.status]}`}>{j.status}</span>
                </td>
                <td className="px-3 py-2">{fmt$(j.value)}</td>
                <td className="px-3 py-2 text-gray-500">{j.createdAt}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No jobs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Clients tab ───────────────────────────────────────────────────────────────

function ClientsTab({ clients, jobs, onAdd, onEdit, onDelete }: {
  clients: Client[]; jobs: Job[];
  onAdd: () => void; onEdit: (c: Client) => void; onDelete: (id: string) => void;
}) {
  const jobCount = (id: string) => jobs.filter(j => j.clientId === id).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">{clients.length} clients</span>
        <button onClick={onAdd} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">+ Add Client</button>
      </div>
      <table className="w-full text-sm border rounded-lg overflow-hidden bg-white">
        <thead className="bg-gray-50 text-left">
          <tr>
            {['Name', 'Company', 'Phone', 'Email', 'Jobs', ''].map(h => (
              <th key={h} className="px-3 py-2 font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{c.name}</td>
              <td className="px-3 py-2 text-gray-600">{c.company}</td>
              <td className="px-3 py-2">{c.phone}</td>
              <td className="px-3 py-2">{c.email}</td>
              <td className="px-3 py-2 text-center">{jobCount(c.id)}</td>
              <td className="px-3 py-2 text-right space-x-2">
                <button onClick={() => onEdit(c)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => onDelete(c.id)} className="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No clients yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Jobs tab ──────────────────────────────────────────────────────────────────

function JobsTab({ jobs, clients, onAdd, onEdit, onDelete }: {
  jobs: Job[]; clients: Client[];
  onAdd: () => void; onEdit: (j: Job) => void; onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<JobStatus | 'All'>('All');
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const visible = filter === 'All' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 flex-wrap">
          {(['All', ...STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium border ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >{s}</button>
          ))}
        </div>
        <button onClick={onAdd} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">+ Add Job</button>
      </div>
      <table className="w-full text-sm border rounded-lg overflow-hidden bg-white">
        <thead className="bg-gray-50 text-left">
          <tr>
            {['Title', 'Client', 'Address', 'Status', 'Value', 'Notes', ''].map(h => (
              <th key={h} className="px-3 py-2 font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(j => (
            <tr key={j.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{j.title}</td>
              <td className="px-3 py-2 text-gray-600">{clientMap[j.clientId]?.name ?? '—'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">{j.address}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[j.status]}`}>{j.status}</span>
              </td>
              <td className="px-3 py-2">{fmt$(j.value)}</td>
              <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">{j.notes}</td>
              <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button onClick={() => onEdit(j)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => onDelete(j.id)} className="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No jobs found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'clients' | 'jobs';
type ModalState =
  | { type: 'addClient' }
  | { type: 'editClient'; client: Client }
  | { type: 'addJob' }
  | { type: 'editJob'; job: Job }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [seeded, setSeeded] = useState(false);

  // Load from localStorage (seed on first visit)
  useEffect(() => {
    const savedClients = localStorage.getItem('crm_clients');
    const savedJobs = localStorage.getItem('crm_jobs');
    if (savedClients) {
      setClients(JSON.parse(savedClients));
      setJobs(savedJobs ? JSON.parse(savedJobs) : []);
    } else {
      setClients(SEED_CLIENTS);
      setJobs(SEED_JOBS);
    }
    setSeeded(true);
  }, []);

  useEffect(() => { if (seeded) localStorage.setItem('crm_clients', JSON.stringify(clients)); }, [clients, seeded]);
  useEffect(() => { if (seeded) localStorage.setItem('crm_jobs', JSON.stringify(jobs)); }, [jobs, seeded]);

  // Client CRUD
  const saveClient = (c: Client) => {
    setClients(prev => prev.find(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [...prev, c]);
    setModal(null);
  };
  const deleteClient = (id: string) => {
    if (!confirm('Delete this client? Their jobs will remain.')) return;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Job CRUD
  const saveJob = (j: Job) => {
    setJobs(prev => prev.find(x => x.id === j.id) ? prev.map(x => x.id === j.id ? j : x) : [...prev, j]);
    setModal(null);
  };
  const deleteJob = (id: string) => {
    if (!confirm('Delete this job?')) return;
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clients', label: 'Clients' },
    { id: 'jobs', label: 'Jobs' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-gray-800 text-lg">🏗️ Construction CRM</span>
        <nav className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >{t.label}</button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'dashboard' && <Dashboard clients={clients} jobs={jobs} />}
        {tab === 'clients' && (
          <ClientsTab
            clients={clients} jobs={jobs}
            onAdd={() => setModal({ type: 'addClient' })}
            onEdit={c => setModal({ type: 'editClient', client: c })}
            onDelete={deleteClient}
          />
        )}
        {tab === 'jobs' && (
          <JobsTab
            jobs={jobs} clients={clients}
            onAdd={() => setModal({ type: 'addJob' })}
            onEdit={j => setModal({ type: 'editJob', job: j })}
            onDelete={deleteJob}
          />
        )}
      </main>

      {/* Modals */}
      {modal?.type === 'addClient' && (
        <Modal title="Add Client" onClose={() => setModal(null)}>
          <ClientForm onSave={saveClient} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'editClient' && (
        <Modal title="Edit Client" onClose={() => setModal(null)}>
          <ClientForm initial={modal.client} onSave={saveClient} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'addJob' && (
        <Modal title="Add Job" onClose={() => setModal(null)}>
          <JobForm clients={clients} onSave={saveJob} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'editJob' && (
        <Modal title="Edit Job" onClose={() => setModal(null)}>
          <JobForm initial={modal.job} clients={clients} onSave={saveJob} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
