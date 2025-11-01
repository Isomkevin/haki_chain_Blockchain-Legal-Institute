"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"
import { CheckCircle2, Clock, BarChart3, Users, Shield, LogOut } from "lucide-react"

interface LawyerApplication {
  id: string
  lawyer_id: string
  lawyer_email?: string
  bounty_id: string
  bounty_title?: string
  proposal: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<LawyerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 })
  const { signOut } = useAuth()

  useEffect(() => {
    if (!isAdmin) {
      navigate("/login")
      return
    }
    loadApplications()
  }, [isAdmin, navigate])

  async function loadApplications() {
    try {
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setApplications(data || [])

      // Calculate stats
      const pending = data?.filter((app) => app.status === "pending").length || 0
      const approved = data?.filter((app) => app.status === "approved").length || 0

      setStats({
        total: data?.length || 0,
        pending,
        approved,
      })
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setLoading(false)
    }
  }

  async function approveApplication(appId: string) {
    try {
      const { error } = await supabase.from("applications").update({ status: "approved" }).eq("id", appId)

      if (error) throw error
      loadApplications()
    } catch (error) {
      console.error("Error approving application:", error)
    }
  }

  async function rejectApplication(appId: string) {
    try {
      const { error } = await supabase.from("applications").update({ status: "rejected" }).eq("id", appId)

      if (error) throw error
      loadApplications()
    } catch (error) {
      console.error("Error rejecting application:", error)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 text-sm">Manage lawyer applications and approvals</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={<Users className="w-8 h-8 text-blue-600" />}
            title="Total Applications"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-8 h-8 text-yellow-600" />}
            title="Pending Review"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle2 className="w-8 h-8 text-green-600" />}
            title="Approved"
            value={stats.approved}
            color="green"
          />
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-600" />
              Lawyer Applications
            </h2>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lawyer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Case</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Proposal</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Applied</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{app.lawyer_email || "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{app.bounty_title || "N/A"}</td>
                      <td className="px-6 py-4 text-sm">
                        <p className="text-gray-600 line-clamp-2">{app.proposal}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {app.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveApplication(app.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectApplication(app.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-xs font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  color,
}: { icon: React.ReactNode; title: string; value: number; color: string }) {
  const bgColors = {
    blue: "bg-blue-50",
    yellow: "bg-yellow-50",
    green: "bg-green-50",
  }

  return (
    <div className={`${bgColors[color as keyof typeof bgColors]} rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }

  const statusLabels = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
      {statusLabels[status as keyof typeof statusLabels]}
    </span>
  )
}
