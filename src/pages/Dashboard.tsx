"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { supabase, type Bounty, type Application, type Milestone } from "../lib/supabase"
import { Link, useSearchParams } from "react-router-dom"
import {
  Plus,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Star,
  Target,
  AlertCircle,
  FileText,
  Search,
  Wand2,
  Eye,
} from "lucide-react"
import TourGuide from "../components/TourGuide"
import LawyerSidebar from "../components/LawyerSidebar"

export default function Dashboard() {
  const { profile } = useAuth()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "overview"

  useEffect(() => {
    if (profile) {
      loadDashboardData()
      const hasSeenTour = localStorage.getItem(`tour-seen-${profile.id}`)
      if (!hasSeenTour && profile.user_type === "lawyer") {
        setShowTour(true)
      }
    }
  }, [profile])

  async function loadDashboardData() {
    try {
      if (profile?.user_type === "ngo") {
        const { data, error } = await supabase
          .from("bounties")
          .select("*")
          .eq("ngo_id", profile.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setBounties(data || [])
      } else if (profile?.user_type === "lawyer") {
        const [appsResult, milestonesResult, bountiesResult] = await Promise.all([
          supabase
            .from("applications")
            .select("*, bounties(*)")
            .eq("lawyer_id", profile.id)
            .order("applied_at", { ascending: false }),
          supabase
            .from("milestones")
            .select("*, bounties!inner(*)")
            .eq("bounties.ngo_id", profile.id)
            .order("created_at", { ascending: false }),
          supabase.from("bounties").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(5),
        ])

        if (appsResult.error) throw appsResult.error
        if (milestonesResult.error) throw milestonesResult.error
        if (bountiesResult.error) throw bountiesResult.error

        setApplications(appsResult.data || [])
        setMilestones(milestonesResult.data || [])
        setBounties(bountiesResult.data || [])
      }
    } catch (error) {
      console.error("Error loading dashboard:", error)
    } finally {
      setLoading(false)
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
    )
  }

  if (profile?.user_type === "ngo") {
    return <NGODashboard bounties={bounties} onRefresh={loadDashboardData} />
  }

  if (profile?.user_type === "lawyer") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {showTour && (
          <TourGuide
            onComplete={() => {
              localStorage.setItem(`tour-seen-${profile.id}`, "true")
              setShowTour(false)
            }}
          />
        )}
        <LawyerSidebar onTourStart={() => setShowTour(true)} />
        <div className="flex-1 ml-[280px]">
          <LawyerDashboard
            applications={applications}
            milestones={milestones}
            recommendedCases={bounties}
            profile={profile}
            activeTab={activeTab}
          />
        </div>
      </div>
    )
  }

  if (profile?.user_type === "donor") {
    return <DonorDashboard />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-600">Please complete your profile to access the dashboard</p>
    </div>
  )
}

function NGODashboard({ bounties, onRefresh }: { bounties: Bounty[]; onRefresh: () => void }) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const stats = {
    total: bounties.length,
    open: bounties.filter((b) => b.status === "open").length,
    inProgress: bounties.filter((b) => b.status === "in_progress").length,
    completed: bounties.filter((b) => b.status === "completed").length,
    totalFunding: bounties.reduce((sum, b) => sum + b.funding_goal, 0),
  }

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
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="In Progress"
            value={stats.inProgress}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle2 className="w-6 h-6" />}
            label="Completed"
            value={stats.completed}
            color="green"
          />
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

      {showCreateModal && <CreateBountyModal onClose={() => setShowCreateModal(false)} onSuccess={onRefresh} />}
    </div>
  )
}

function LawyerDashboard({
  applications,
  milestones,
  recommendedCases,
  profile,
  activeTab,
}: {
  applications: Application[]
  milestones: Milestone[]
  recommendedCases: Bounty[]
  profile: any
  activeTab: string
}) {
  const stats = {
    applications: applications.length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    pending: applications.filter((a) => a.status === "pending").length,
    activeCases: applications.filter((a) => a.status === "accepted").length,
    rating: 4.8,
    successRate: 85,
    earnings: 25000,
  }

  const recentActivity = [
    {
      type: "milestone",
      title: "Milestone completed: Initial Documentation",
      case: "Land Rights Case",
      time: "2 days ago",
    },
    { type: "case", title: "New case assigned: Environmental Justice", case: "", time: "3 days ago" },
    { type: "rating", title: "Received 5-star rating", case: "Domestic Violence Case", time: "1 week ago" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 md:pl-0">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Welcome back, {profile.full_name}</h1>
              <p className="text-gray-600">Here's an overview of your cases and performance</p>
            </div>
            <Link
              to="/bounties"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Browse Bounties
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Active Cases"
              value={stats.activeCases}
              icon={<Briefcase className="w-6 h-6" />}
              color="bg-teal-50"
              iconColor="text-teal-600"
            />
            <StatCard
              label="Success Rate"
              value={`${stats.successRate}%`}
              change="+5% from average"
              icon={<Target className="w-6 h-6" />}
              color="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Rating"
              value="4.8/5.0"
              change="Top 10% of lawyers"
              icon={<Star className="w-6 h-6" />}
              color="bg-yellow-50"
              iconColor="text-yellow-600"
            />
            <StatCard
              label="Total Earnings"
              value={`$${stats.earnings.toLocaleString()}`}
              change="+12.5% from last month"
              icon={<DollarSign className="w-6 h-6" />}
              color="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Due Today"
              value={0}
              icon={<Clock className="w-6 h-6" />}
              color="bg-red-50"
              iconColor="text-red-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Automated Reminder System */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Automated Reminder System</h2>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Due Today</div>
                    <div className="text-3xl font-bold text-gray-900">0</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Upcoming (7 days)</div>
                    <div className="text-3xl font-bold text-gray-900">0</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Settings</div>
                    <a href="?tab=settings" className="text-teal-600 hover:text-teal-700 font-medium">
                      Configure →
                    </a>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-600">▲ Due Today</div>
                  <div className="text-gray-500">No reminders due today</div>
                  <div className="text-gray-600 mt-3">Upcoming</div>
                  <div className="text-gray-500">No upcoming reminders</div>
                </div>
              </div>

              {/* Active Cases Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Active Cases</h2>
                {applications.filter((a) => a.status === "accepted").length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No active cases yet</p>
                    <p className="text-sm text-gray-500 mb-4">Start by browsing available bounties</p>
                    <Link
                      to="/bounties"
                      className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition"
                    >
                      Browse Bounties
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications
                      .filter((a) => a.status === "accepted")
                      .map((app: any) => (
                        <div
                          key={app.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition"
                        >
                          <h4 className="font-medium text-gray-900">{app.bounties?.title || "Case Title"}</h4>
                          <p className="text-sm text-gray-600 mt-1">{app.bounties?.category || "Category"}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <a href="#" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                    View All →
                  </a>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        {activity.type === "milestone" && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                        {activity.type === "case" && <Briefcase className="w-4 h-4 text-teal-600" />}
                        {activity.type === "rating" && <Star className="w-4 h-4 text-teal-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        {activity.case && <p className="text-xs text-gray-500">{activity.case}</p>}
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Recommended Cases</h2>
                  <Link to="/bounties" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recommendedCases.length === 0 ? (
                    <p className="text-gray-500 text-sm">No available cases at the moment</p>
                  ) : (
                    recommendedCases.map((case_) => (
                      <Link
                        key={case_.id}
                        to={`/bounties/${case_.id}`}
                        className="block border border-gray-200 rounded-lg p-3 hover:border-teal-300 transition"
                      >
                        <h4 className="font-medium text-sm text-gray-900">{case_.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{case_.category}</p>
                        <p className="text-sm font-medium text-teal-600 mt-2">${case_.funding_goal.toLocaleString()}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Application Status */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Application Status</h2>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">Active Applications</p>
                    <p className="text-2xl font-bold text-teal-600 mt-2">
                      {applications.filter((a) => a.status === "pending").length}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">Accepted</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {applications.filter((a) => a.status === "accepted").length}
                    </p>
                  </div>
                </div>
                <a href="#" className="inline-block mt-4 text-teal-600 hover:text-teal-700 text-sm font-medium">
                  View Details →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === "haki-lens" && (
          <ToolSection
            icon={<Search className="w-12 h-12" />}
            title="HakiLens - Legal Research"
            description="AI-powered legal research hub for case law and precedents"
          />
        )}
        {activeTab === "haki-draft" && (
          <ToolSection
            icon={<Wand2 className="w-12 h-12" />}
            title="HakiDraft - AI Document Generator"
            description="Generate professional legal documents with AI assistance"
          />
        )}
        {activeTab === "haki-review" && (
          <ToolSection
            icon={<Eye className="w-12 h-12" />}
            title="HakiReview - Document Analysis"
            description="AI-powered document analysis and legal review"
          />
        )}
        {activeTab === "haki-reminders" && (
          <ToolSection
            icon={<Clock className="w-12 h-12" />}
            title="HakiReminders - Task Management"
            description="Calendar-based task and deadline manager"
          />
        )}
        {activeTab === "documents" && (
          <ToolSection
            icon={<FileText className="w-12 h-12" />}
            title="HakiDocs - Document Repository"
            description="Secure repository for uploading and managing legal files"
          />
        )}
        {activeTab === "cases" && (
          <ToolSection
            icon={<Briefcase className="w-12 h-12" />}
            title="Cases Management"
            description="Manage all your legal cases and track progress"
          />
        )}
      </div>
    </div>
  )
}

function ToolSection({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <div className="text-teal-600 flex justify-center mb-4">{icon}</div>
      <h2 className="text-3xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      <p className="text-gray-500">Coming soon...</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  icon,
  color = "bg-gray-50",
  iconColor = "text-gray-600",
}: {
  label: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color?: string
  iconColor?: string
}) {
  return (
    <div className={`${color} rounded-lg p-4 border border-gray-200`}>
      <div className={`${iconColor} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
      {change && <div className="text-xs text-gray-500 mt-1">{change}</div>}
    </div>
  )
}

function BountyListItem({ bounty }: { bounty: Bounty }) {
  const statusColors = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  }

  return (
    <Link
      to={`/bounties/${bounty.id}`}
      className="block border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold">{bounty.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[bounty.status]}`}>
          {bounty.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bounty.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{bounty.jurisdiction}</span>
        <span className="font-bold text-teal-600">${bounty.funding_goal.toLocaleString()}</span>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  )
}

function CreateBountyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jurisdiction: "",
    category: "",
    fundingGoal: "",
    deadline: "",
    tags: "",
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("bounties").insert({
        ngo_id: profile?.id,
        title: formData.title,
        description: formData.description,
        jurisdiction: formData.jurisdiction,
        category: formData.category,
        funding_goal: Number.parseInt(formData.fundingGoal),
        deadline: formData.deadline || null,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating bounty:", error)
      alert("Failed to create bounty")
    } finally {
      setLoading(false)
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
              {loading ? "Creating..." : "Create Bounty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
  )
}
