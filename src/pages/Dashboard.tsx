import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Bounty, Application, Milestone } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, CheckCircle2, Clock, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  async function loadDashboardData() {
    try {
      if (profile?.user_type === 'ngo') {
        const { data, error } = await supabase
          .from('bounties')
          .select('*')
          .eq('ngo_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBounties(data || []);
      } else if (profile?.user_type === 'lawyer') {
        const [appsResult, milestonesResult] = await Promise.all([
          supabase
            .from('applications')
            .select('*, bounties(*)')
            .eq('lawyer_id', profile.id)
            .order('applied_at', { ascending: false }),
          supabase
            .from('milestones')
            .select('*, bounties!inner(*)')
            .eq('bounties.ngo_id', profile.id)
            .order('created_at', { ascending: false }),
        ]);

        if (appsResult.error) throw appsResult.error;
        if (milestonesResult.error) throw milestonesResult.error;

        setApplications(appsResult.data || []);
        setMilestones(milestonesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (profile?.user_type === 'ngo') {
    return <NGODashboard bounties={bounties} onRefresh={loadDashboardData} />;
  }

  if (profile?.user_type === 'lawyer') {
    return <LawyerDashboard applications={applications} milestones={milestones} />;
  }

  if (profile?.user_type === 'donor') {
    return <DonorDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">Please complete your profile to access the dashboard</p>
    </div>
  );
}

function NGODashboard({ bounties, onRefresh }: { bounties: Bounty[]; onRefresh: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const stats = {
    total: bounties.length,
    open: bounties.filter((b) => b.status === 'open').length,
    inProgress: bounties.filter((b) => b.status === 'in_progress').length,
    completed: bounties.filter((b) => b.status === 'completed').length,
    totalFunding: bounties.reduce((sum, b) => sum + b.funding_goal, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">NGO Dashboard</h1>
            <p className="text-gray-600">Manage your legal bounties and track progress</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Bounty
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Briefcase className="w-6 h-6" />} label="Total Cases" value={stats.total} />
          <StatCard icon={<Clock className="w-6 h-6" />} label="Open Cases" value={stats.open} color="blue" />
          <StatCard icon={<TrendingUp className="w-6 h-6" />} label="In Progress" value={stats.inProgress} color="yellow" />
          <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Completed" value={stats.completed} color="green" />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Your Bounties</h2>
          {bounties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">You haven't created any bounties yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Create your first bounty
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bounties.map((bounty) => (
                <BountyListItem key={bounty.id} bounty={bounty} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateBountyModal onClose={() => setShowCreateModal(false)} onSuccess={onRefresh} />
      )}
    </div>
  );
}

function LawyerDashboard({ applications, milestones }: { applications: Application[]; milestones: Milestone[] }) {
  const stats = {
    applications: applications.length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
    pending: applications.filter((a) => a.status === 'pending').length,
    activeMilestones: milestones.filter((m) => m.status === 'in_progress').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lawyer Dashboard</h1>
          <p className="text-gray-600">Track your applications and active cases</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Briefcase className="w-6 h-6" />} label="Applications" value={stats.applications} />
          <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Accepted" value={stats.accepted} color="green" />
          <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={stats.pending} color="yellow" />
          <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Active Milestones" value={stats.activeMilestones} color="blue" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Your Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No applications yet</p>
                <Link to="/bounties" className="text-teal-600 hover:text-teal-700 font-medium">
                  Browse available bounties
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{app.bounties?.title || 'Untitled Case'}</h4>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{app.proposal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Active Milestones</h2>
            {milestones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No active milestones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.slice(0, 5).map((milestone: any) => (
                  <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{milestone.title}</h4>
                      <span className="text-teal-600 font-bold">${milestone.amount}</span>
                    </div>
                    <p className="text-sm text-gray-600">{milestone.bounties?.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DonorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Donor Dashboard</h1>
          <p className="text-gray-600">Support legal cases and track your impact</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-teal-600" />
          <h2 className="text-2xl font-bold mb-3">Start Making an Impact</h2>
          <p className="text-gray-600 mb-6">Browse available legal cases and support those in need</p>
          <Link
            to="/bounties"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Browse Cases
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = 'teal' }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  const colors = {
    teal: 'bg-teal-100 text-teal-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`w-12 h-12 rounded-lg ${colors[color as keyof typeof colors]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-600 text-sm">{label}</div>
    </div>
  );
}

function BountyListItem({ bounty }: { bounty: Bounty }) {
  const statusColors = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  return (
    <Link to={`/bounties/${bounty.id}`} className="block border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold">{bounty.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[bounty.status]}`}>
          {bounty.status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bounty.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{bounty.jurisdiction}</span>
        <span className="font-bold text-teal-600">${bounty.funding_goal.toLocaleString()}</span>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}

function CreateBountyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jurisdiction: '',
    category: '',
    fundingGoal: '',
    deadline: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('bounties').insert({
        ngo_id: profile?.id,
        title: formData.title,
        description: formData.description,
        jurisdiction: formData.jurisdiction,
        category: formData.category,
        funding_goal: parseInt(formData.fundingGoal),
        deadline: formData.deadline || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating bounty:', error);
      alert('Failed to create bounty');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
        <h3 className="text-2xl font-bold mb-6">Create New Bounty</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Case Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Land Rights Dispute"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Detailed description of the legal case..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
              <input
                type="text"
                value={formData.jurisdiction}
                onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Eastern Province, Kenya"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                <option value="Land Rights">Land Rights</option>
                <option value="Domestic Violence">Domestic Violence</option>
                <option value="Environmental Justice">Environmental Justice</option>
                <option value="Labor Rights">Labor Rights</option>
                <option value="Child Protection">Child Protection</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funding Goal (USD)</label>
              <input
                type="number"
                value={formData.fundingGoal}
                onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="2500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deadline (Optional)</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="land rights, indigenous communities, corporate accountability"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Bounty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
