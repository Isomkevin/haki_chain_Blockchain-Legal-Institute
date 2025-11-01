import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Bounty } from '../lib/supabase';
import { Search, MapPin, Clock, DollarSign, Tag } from 'lucide-react';

export default function Bounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  useEffect(() => {
    loadBounties();
  }, []);

  async function loadBounties() {
    try {
      const { data, error } = await supabase
        .from('bounties')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBounties(data || []);
    } catch (error) {
      console.error('Error loading bounties:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBounties = bounties.filter((bounty) => {
    const matchesSearch =
      bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Categories' || bounty.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All Categories', ...new Set(bounties.map((b) => b.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-teal-700 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Explore Legal Bounties</h1>
          <p className="text-xl text-teal-100">
            Browse through legal cases that need your expertise or support
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bounties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading bounties...</p>
          </div>
        ) : filteredBounties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No bounties found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BountyCard({ bounty }: { bounty: Bounty }) {
  const fundingPercentage = (bounty.current_funding / bounty.funding_goal) * 100;
  const daysRemaining = bounty.deadline
    ? Math.ceil((new Date(bounty.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link to={`/bounties/${bounty.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full mb-2">
              ${bounty.funding_goal.toLocaleString()}
            </div>
            <h3 className="font-bold text-lg mb-2 line-clamp-2">{bounty.title}</h3>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{bounty.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{bounty.jurisdiction}</span>
          </div>

          {daysRemaining !== null && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Deadline passed'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Tag className="w-4 h-4" />
            <span>{bounty.category}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Funding Progress</span>
            <span className="font-medium text-teal-600">
              ${bounty.current_funding.toLocaleString()} / ${bounty.funding_goal.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {bounty.tags && bounty.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {bounty.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
