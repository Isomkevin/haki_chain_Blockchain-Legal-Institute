"use client"

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase, type Bounty, type Milestone, type Donation } from "../lib/supabase"
import { useAuth } from "../contexts/AuthContext"
import { ArrowLeft, MapPin, Calendar, DollarSign, Tag, Wallet, CreditCard, CheckCircle2 } from "lucide-react"

export default function BountyDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadBountyDetails()
    }
  }, [id])

  async function loadBountyDetails() {
    try {
      const [bountyResult, milestonesResult, donationsResult] = await Promise.all([
        supabase.from("bounties").select("*").eq("id", id).maybeSingle(),
        supabase.from("milestones").select("*").eq("bounty_id", id).order("order_index"),
        supabase.from("donations").select("*").eq("bounty_id", id).order("created_at", { ascending: false }),
      ])

      if (bountyResult.error) throw bountyResult.error
      if (milestonesResult.error) throw milestonesResult.error
      if (donationsResult.error) throw donationsResult.error

      setBounty(bountyResult.data)
      setMilestones(milestonesResult.data || [])
      setDonations(donationsResult.data || [])
    } catch (error) {
      console.error("Error loading bounty details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading bounty details...</p>
        </div>
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Bounty not found</p>
          <Link to="/bounties" className="text-teal-600 hover:text-teal-700 mt-4 inline-block">
            Back to bounties
          </Link>
        </div>
      </div>
    )
  }

  const fundingPercentage = (bounty.current_funding / bounty.funding_goal) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link to="/bounties" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Bounties
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full mb-3">
                    ${bounty.funding_goal.toLocaleString()}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{bounty.title}</h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{bounty.jurisdiction}</span>
                </div>
                {bounty.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(bounty.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>{bounty.category}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-bold mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{bounty.description}</p>
              </div>

              {bounty.tags && bounty.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {bounty.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6">Milestones</h2>
              <div className="space-y-4">
                {milestones.length === 0 ? (
                  <p className="text-gray-500">No milestones defined yet.</p>
                ) : (
                  milestones.map((milestone, index) => (
                    <MilestoneCard key={milestone.id} milestone={milestone} index={index} />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold mb-4">Funding Progress</h3>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Raised</span>
                  <span className="font-bold text-teal-600">${bounty.current_funding.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">Goal</span>
                  <span className="font-medium">${bounty.funding_goal.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {profile?.user_type === "donor" && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowDonateModal(true)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect Wallet to Donate
                  </button>
                  <button
                    onClick={() => setShowDonateModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pay with M-Pesa
                  </button>
                </div>
              )}

              {profile?.user_type === "lawyer" && bounty.status === "open" && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition"
                >
                  Apply for this Case
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold mb-4">Donors</h3>
              {donations.length === 0 ? (
                <p className="text-gray-500 text-sm">No donations yet</p>
              ) : (
                <div className="space-y-3">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{donation.is_anonymous ? "Anonymous Donor" : "Supporter"}</span>
                      <span className="font-medium text-teal-600">${donation.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDonateModal && (
        <DonateModal bounty={bounty} onClose={() => setShowDonateModal(false)} onSuccess={loadBountyDetails} />
      )}

      {showApplyModal && <ApplyModal bountyId={bounty.id} onClose={() => setShowApplyModal(false)} />}
    </div>
  )
}

function MilestoneCard({ milestone, index }: { milestone: Milestone; index: number }) {
  const statusColors = {
    pending: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
              {index + 1}
            </div>
            <h4 className="font-bold">{milestone.title}</h4>
          </div>
          <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-bold text-teal-600">${milestone.amount.toLocaleString()}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[milestone.status]}`}>
            {milestone.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {milestone.due_date && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Due: {new Date(milestone.due_date).toLocaleDateString()}
        </div>
      )}

      {milestone.status === "verified" && milestone.verified_at && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          Verified on {new Date(milestone.verified_at).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

function DonateModal({ bounty, onClose, onSuccess }: { bounty: Bounty; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  async function handleDonate() {
    if (!amount || Number.parseFloat(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      const donationAmount = Number.parseFloat(amount)

      const { error: donationError } = await supabase.from("donations").insert({
        bounty_id: bounty.id,
        donor_id: isAnonymous ? null : profile?.id,
        amount: donationAmount,
        is_anonymous: isAnonymous,
        payment_method: "mpesa",
      })

      if (donationError) throw donationError

      const newTotal = bounty.current_funding + donationAmount
      const { error: updateError } = await supabase
        .from("bounties")
        .update({ current_funding: newTotal })
        .eq("id", bounty.id)

      if (updateError) throw updateError

      alert("Donation successful! Thank you for supporting this case.")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error donating:", error)
      alert("Failed to process donation. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold mb-4">Donate to this Case</h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Donation Amount (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Make this donation anonymous</span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDonate}
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Donate"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApplyModal({ bountyId, onClose }: { bountyId: string; onClose: () => void }) {
  const [proposal, setProposal] = useState("")
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  async function handleApply() {
    if (!proposal.trim()) {
      alert("Please enter your proposal")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("applications").insert({
        bounty_id: bountyId,
        lawyer_id: profile?.id,
        proposal,
      })

      if (error) throw error

      alert("Application submitted successfully!")
      onClose()
    } catch (error) {
      console.error("Error applying:", error)
      alert("Failed to submit application")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <h3 className="text-2xl font-bold mb-4">Apply for this Case</h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Proposal</label>
          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            rows={8}
            placeholder="Explain your approach to this case, relevant experience, and timeline..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  )
}
