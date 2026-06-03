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

type ContractStatus = 'Draft' | 'Sent' | 'Signed' | 'Void';

type Contract = {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  jobId: string;          // '' means not linked to a specific job
  status: ContractStatus;
  startDate: string;
  endDate: string;
  value: number;
  scope: string;
  terms: string;
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

const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  Draft:  'bg-gray-100 text-gray-700',
  Sent:   'bg-blue-100 text-blue-800',
  Signed: 'bg-green-100 text-green-800',
  Void:   'bg-red-100 text-red-700',
};

const CONTRACT_STATUSES: ContractStatus[] = ['Draft', 'Sent', 'Signed', 'Void'];

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_CLIENTS: Client[] = [
  { id: 'c1', name: 'Mike Torres',  company: 'Torres Realty',  phone: '(512) 555-0101', email: 'mike@torresrealty.com' },
  { id: 'c2', name: 'Sandra Lee',   company: 'Lee Properties', phone: '(512) 555-0202', email: 'sandra@leeprops.com'   },
  { id: 'c3', name: 'Dave Kim',     company: 'Kim & Sons Dev', phone: '(737) 555-0303', email: 'dave@kimsons.com'      },
];

const SEED_JOBS: Job[] = [
  { id: 'j1', title: 'Kitchen Remodel',  clientId: 'c1', status: 'Active',    value: 42000,  address: '204 Oak St, Austin TX',       notes: 'Cabinets arrive Thursday.',    createdAt: '2026-04-10' },
  { id: 'j2', title: 'Office Build-Out', clientId: 'c2', status: 'Quoted',    value: 118000, address: '900 Congress Ave, Austin TX',  notes: 'Waiting on permit approval.',  createdAt: '2026-05-01' },
  { id: 'j3', title: 'Deck Addition',    clientId: 'c3', status: 'Lead',      value: 18500,  address: '77 Riverside Dr, Austin TX',   notes: '',                             createdAt: '2026-05-20' },
  { id: 'j4', title: 'Roof Replacement', clientId: 'c1', status: 'Completed', value: 31000,  address: '204 Oak St, Austin TX',       notes: 'Paid in full.',                createdAt: '2026-02-15' },
];

const SEED_CONTRACTS: Contract[] = [
  {
    id: 'ct1',
    contractNumber: 'CTR-2026-001',
    title: 'Kitchen Remodel Agreement',
    clientId: 'c1',
    jobId: 'j1',
    status: 'Signed',
    startDate: '2026-04-10',
    endDate: '2026-07-10',
    value: 42000,
    scope: 'Full kitchen remodel including cabinet installation, countertop replacement, and new flooring.',
    terms: 'Net 30. 50% deposit required before work begins. Final payment due upon completion.',
    createdAt: '2026-04-08',
  },
  {
    id: 'ct2',
    contractNumber: 'CTR-2026-002',
    title: 'Office Build-Out Proposal Contract',
    clientId: 'c2',
    jobId: 'j2',
    status: 'Sent',
    startDate: '2026-06-01',
    endDate: '2026-09-30',
    value: 118000,
    scope: 'Commercial office build-out including framing, electrical, plumbing rough-in, drywall, and painting.',
    terms: 'Net 30. Three milestone payments: 33% at start, 33% at framing completion, 34% at final inspection.',
    createdAt: '2026-05-01',
  },
  {
    id: 'ct3',
    contractNumber: 'CTR-2026-003',
    title: 'Roof Replacement Contract',
    clientId: 'c1',
    jobId: 'j4',
    status: 'Signed',
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    value: 31000,
    scope: 'Complete tear-off and replacement of existing roof with architectural shingles. Includes new gutters.',
    terms: 'Paid in full upon completion. Warranty: 10-year workmanship, 30-year manufacturer.',
    createdAt: '2026-02-10',
  },
];

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
        <label className="block text-sm font-medium mb-1">Address</label>
        <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.address} onChange={set('address')} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea className="w-full border rounded px-3 py-1.5 text-sm" rows={2} value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">Save</button>
        <button type="button" onClick={onClose} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ── Contract form ─────────────────────────────────────────────────────────────

function ContractForm({ initial, clients, jobs, onSave, onClose }: {
  initial?: Contract;
  clients: Client[];
  jobs: Job[];
  onSave: (c: Contract) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<Contract>(
    initial ?? {
      id: uid(),
      contractNumber: `CTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      title: '',
      clientId: clients[0]?.id ?? '',
      jobId: '',
      status: 'Draft',
      startDate: today,
      endDate: '',
      value: 0,
      scope: '',
      terms: '',
      createdAt: today,
    }
  );

  const set = (k: keyof Contract) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: k === 'value' ? Number(e.target.value) : e.target.value }));

  // Jobs filtered to the selected client
  const clientJobs = jobs.filter(j => j.clientId === form.clientId);

  // When client changes, clear the linked job if it doesn't belong to the new client
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClientId = e.target.value;
    setForm(f => ({
      ...f,
      clientId: newClientId,
      jobId: jobs.find(j => j.id === f.jobId && j.clientId === newClientId) ? f.jobId : '',
    }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      {/* Row 1: Contract number + title */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Contract #</label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.contractNumber} onChange={set('contractNumber')} required />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Contract Title</label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" value={form.title} onChange={set('title')} required placeholder="e.g. Kitchen Remodel Agreement" />
        </div>
      </div>

      {/* Row 2: Client + linked job */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Client</label>
          <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.clientId} onChange={handleClientChange}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Linked Job <span className="text-gray-400 font-normal">(optional)</span></label>
          <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.jobId} onChange={set('jobId')}>
            <option value="">— None —</option>
            {clientJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3: Status + value */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="w-full border rounded px-3 py-1.5 text-sm" value={form.status} onChange={set('status')}>
            {CONTRACT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contract Value ($)</label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" type="number" min={0} value={form.value} onChange={set('value')} />
        </div>
      </div>

      {/* Row 4: Start + end dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" type="date" value={form.startDate} onChange={set('startDate')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date <span className="text-gray-400 font-normal">(optional)</span></label>
          <input className="w-full border rounded px-3 py-1.5 text-sm" type="date" value={form.endDate} onChange={set('endDate')} />
        </div>
      </div>

      {/* Scope of work */}
      <div>
        <label className="block text-sm font-medium mb-1">Scope of Work</label>
        <textarea
          className="w-full border rounded px-3 py-1.5 text-sm"
          rows={3}
          value={form.scope}
          onChange={set('scope')}
          placeholder="Describe the work to be performed…"
        />
      </div>

      {/* Terms */}
      <div>
        <label className="block text-sm font-medium mb-1">Payment Terms</label>
        <textarea
          className="w-full border rounded px-3 py-1.5 text-sm"
          rows={2}
          value={form.terms}
          onChange={set('terms')}
          placeholder="e.g. Net 30. 50% deposit required before work begins…"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Save Contract</button>
        <button type="button" onClick={onClose} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}

// ── Contract detail panel ─────────────────────────────────────────────────────

function ContractDetail({ contract, client, job, onClose, onEdit, onDelete }: {
  contract: Contract;
  client: Client | undefined;
  job: Job | undefined;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{contract.contractNumber}</p>
            <h2 className="text-xl font-bold text-gray-900">{contract.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-semibold ${CONTRACT_STATUS_COLORS[contract.status]}`}>
              {contract.status}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none ml-2">×</button>
          </div>
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <InfoBlock label="Client" value={client ? `${client.name} — ${client.company}` : '—'} />
          <InfoBlock label="Linked Job" value={job ? job.title : '—'} />
          <InfoBlock label="Contract Value" value={fmt$(contract.value)} />
          <InfoBlock label="Date Created" value={contract.createdAt} />
          <InfoBlock label="Start Date" value={contract.startDate || '—'} />
          <InfoBlock label="End Date" value={contract.endDate || '—'} />
        </div>

        {/* Scope */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Scope of Work</p>
          <p className="text-sm text-gray-700 whitespace-pre-line border rounded-lg p-3 bg-gray-50">
            {contract.scope || <span className="text-gray-400 italic">No scope defined.</span>}
          </p>
        </div>

        {/* Terms */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Payment Terms</p>
          <p className="text-sm text-gray-700 whitespace-pre-line border rounded-lg p-3 bg-gray-50">
            {contract.terms || <span className="text-gray-400 italic">No payment terms defined.</span>}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-4">
          <button onClick={onEdit} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700">Edit</button>
          <button onClick={onDelete} className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded text-sm hover:bg-red-100">Delete</button>
          <button onClick={onClose} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50 ml-auto">Close</button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function Dashboard({ clients, jobs, contracts }: { clients: Client[]; jobs: Job[]; contracts: Contract[] }) {
  const active = jobs.filter(j => j.status === 'Active');
  const pipeline = jobs.filter(j => j.status === 'Lead' || j.status === 'Quoted');
  const completed = jobs.filter(j => j.status === 'Completed');
  const totalRevenue = completed.reduce((s, j) => s + j.value, 0);
  const pipelineValue = pipeline.reduce((s, j) => s + j.value, 0);
  const signedContracts = contracts.filter(c => c.status === 'Signed');

  const cards = [
    { label: 'Total Clients',      value: clients.length },
    { label: 'Active Jobs',        value: active.length },
    { label: 'In Pipeline',        value: `${pipeline.length} jobs · ${fmt$(pipelineValue)}` },
    { label: 'Revenue Completed',  value: fmt$(totalRevenue) },
    { label: 'Signed Contracts',   value: signedContracts.length },
  ];

  const recent = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

// ── Contracts tab ─────────────────────────────────────────────────────────────

function ContractsTab({ contracts, clients, jobs, onAdd, onView, onEdit, onDelete }: {
  contracts: Contract[];
  clients: Client[];
  jobs: Job[];
  onAdd: () => void;
  onView: (c: Contract) => void;
  onEdit: (c: Contract) => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<ContractStatus | 'All'>('All');
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));
  const jobMap    = Object.fromEntries(jobs.map(j => [j.id, j]));
  const visible   = filter === 'All' ? contracts : contracts.filter(c => c.status === filter);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 flex-wrap">
          {(['All', ...CONTRACT_STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium border ${
                filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >{s}</button>
          ))}
        </div>
        <button onClick={onAdd} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">+ New Contract</button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {CONTRACT_STATUSES.map(s => {
          const count = contracts.filter(c => c.status === s).length;
          const total = contracts.filter(c => c.status === s).reduce((acc, c) => acc + c.value, 0);
          return (
            <div key={s} className={`border rounded-lg p-3 bg-white`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{s}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CONTRACT_STATUS_COLORS[s]}`}>{count}</span>
              </div>
              <div className="text-sm font-semibold text-gray-800">{fmt$(total)}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <table className="w-full text-sm border rounded-lg overflow-hidden bg-white">
        <thead className="bg-gray-50 text-left">
          <tr>
            {['Contract #', 'Title', 'Client', 'Linked Job', 'Status', 'Value', 'Start', 'End', ''].map(h => (
              <th key={h} className="px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(ct => (
            <tr key={ct.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2 text-xs text-gray-500 font-mono whitespace-nowrap">{ct.contractNumber}</td>
              <td className="px-3 py-2 font-medium">
                <button
                  onClick={() => onView(ct)}
                  className="text-blue-700 hover:underline text-left"
                >{ct.title}</button>
              </td>
              <td className="px-3 py-2 text-gray-600">{clientMap[ct.clientId]?.name ?? '—'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">{ct.jobId ? (jobMap[ct.jobId]?.title ?? '—') : '—'}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONTRACT_STATUS_COLORS[ct.status]}`}>
                  {ct.status}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{fmt$(ct.value)}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{ct.startDate || '—'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{ct.endDate || '—'}</td>
              <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                <button onClick={() => onEdit(ct)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => onDelete(ct.id)} className="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          ))}
          {visible.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-gray-400">No contracts found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'clients' | 'jobs' | 'contracts';

type ModalState =
  | { type: 'addClient' }
  | { type: 'editClient'; client: Client }
  | { type: 'addJob' }
  | { type: 'editJob'; job: Job }
  | { type: 'addContract' }
  | { type: 'editContract'; contract: Contract }
  | { type: 'viewContract'; contract: Contract }
  | null;

export default function App() {
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [clients, setClients]     = useState<Client[]>([]);
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [modal, setModal]         = useState<ModalState>(null);
  const [seeded, setSeeded]       = useState(false);

  // Load from localStorage (seed on first visit)
  useEffect(() => {
    const savedClients   = localStorage.getItem('crm_clients');
    const savedJobs      = localStorage.getItem('crm_jobs');
    const savedContracts = localStorage.getItem('crm_contracts');

    if (savedClients) {
      setClients(JSON.parse(savedClients));
      setJobs(savedJobs ? JSON.parse(savedJobs) : []);
      setContracts(savedContracts ? JSON.parse(savedContracts) : []);
    } else {
      setClients(SEED_CLIENTS);
      setJobs(SEED_JOBS);
      setContracts(SEED_CONTRACTS);
    }
    setSeeded(true);
  }, []);

  useEffect(() => { if (seeded) localStorage.setItem('crm_clients',   JSON.stringify(clients));   }, [clients,   seeded]);
  useEffect(() => { if (seeded) localStorage.setItem('crm_jobs',      JSON.stringify(jobs));      }, [jobs,      seeded]);
  useEffect(() => { if (seeded) localStorage.setItem('crm_contracts', JSON.stringify(contracts)); }, [contracts, seeded]);

  // Client CRUD
  const saveClient = (c: Client) => {
    setClients(prev => prev.find(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [...prev, c]);
    setModal(null);
  };
  const deleteClient = (id: string) => {
    if (!confirm('Delete this client? Their jobs and contracts will remain.')) return;
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

  // Contract CRUD
  const saveContract = (ct: Contract) => {
    setContracts(prev => prev.find(x => x.id === ct.id) ? prev.map(x => x.id === ct.id ? ct : x) : [...prev, ct]);
    setModal(null);
  };
  const deleteContract = (id: string) => {
    if (!confirm('Delete this contract?')) return;
    setContracts(prev => prev.filter(ct => ct.id !== id));
    setModal(null);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clients',   label: 'Clients'   },
    { id: 'jobs',      label: 'Jobs'      },
    { id: 'contracts', label: 'Contracts' },
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
      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'dashboard' && <Dashboard clients={clients} jobs={jobs} contracts={contracts} />}

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

        {tab === 'contracts' && (
          <ContractsTab
            contracts={contracts} clients={clients} jobs={jobs}
            onAdd={() => setModal({ type: 'addContract' })}
            onView={ct => setModal({ type: 'viewContract', contract: ct })}
            onEdit={ct => setModal({ type: 'editContract', contract: ct })}
            onDelete={deleteContract}
          />
        )}
      </main>

      {/* ── Modals ── */}

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
      {modal?.type === 'addContract' && (
        <Modal title="New Contract" onClose={() => setModal(null)}>
          <ContractForm clients={clients} jobs={jobs} onSave={saveContract} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'editContract' && (
        <Modal title="Edit Contract" onClose={() => setModal(null)}>
          <ContractForm
            initial={modal.contract}
            clients={clients}
            jobs={jobs}
            onSave={saveContract}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'viewContract' && (
        <ContractDetail
          contract={modal.contract}
          client={clients.find(c => c.id === modal.contract.clientId)}
          job={jobs.find(j => j.id === modal.contract.jobId)}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: 'editContract', contract: modal.contract })}
          onDelete={() => deleteContract(modal.contract.id)}
        />
      )}
    </div>
  );
}
