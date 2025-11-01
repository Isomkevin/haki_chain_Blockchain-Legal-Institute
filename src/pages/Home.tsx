import { Link } from "react-router-dom"
import { Scale, Users, DollarSign, Shield, BarChart3, MessageSquare } from "lucide-react"
import { useInView } from "../hooks/useInView"

export default function Home() {
  const [featuresRef, featuresInView] = useInView()
  const [benefitsRef, benefitsInView] = useInView()
  const [statsRef, statsInView] = useInView()

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-teal-800 via-teal-700 to-blue-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Professional <span className="text-teal-300">Legal Tools</span> for Modern Lawyers
            </h1>
            <p className="text-xl mb-8 text-teal-100 animate-slide-down" style={{ animationDelay: "0.2s" }}>
              TRUSTED BY LEGAL PROFESSIONALS
            </p>
            <div className="flex gap-4 justify-center flex-wrap animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Link
                to="/login"
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full font-medium transition"
              >
                Access Lawyer Dashboard
              </Link>
              <Link
                to="/bounties"
                className="bg-white hover:bg-gray-100 text-teal-800 px-8 py-3 rounded-full font-medium transition"
              >
                Explore Bounties
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" ref={featuresRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 ${featuresInView ? "animate-fade-in-up" : "opacity-0"}`}>
            <h2 className="text-4xl font-bold mb-4">Complete Legal Practice Management</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a modern legal practice, from case management to client acquisition and payment
              processing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${featuresInView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <FeatureCard index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white" ref={benefitsRef}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className={`text-4xl font-bold text-center mb-16 ${benefitsInView ? "animate-fade-in-up" : "opacity-0"}`}>
            Why Legal Professionals Choose HakiChain
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={benefitsInView ? "animate-fade-in-left" : "opacity-0"}>
              <img
                src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Legal professionals collaborating"
                className="rounded-lg shadow-xl"
              />
            </div>

            <div className="space-y-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${benefitsInView ? "animate-fade-in-right" : "opacity-0"}`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <BenefitItemAnimated index={index} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/signup"
              className={`inline-block bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-full font-medium text-lg transition ${
                benefitsInView ? "animate-fade-in-up" : "opacity-0"
              }`}
            >
              Start Using Tools
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50" ref={statsRef}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className={`text-4xl font-bold mb-12 ${statsInView ? "animate-fade-in-up" : "opacity-0"}`}>
            Trusted by Legal Professionals
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${statsInView ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <StatCardAnimated index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-teal-700 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center animate-fade-in-up">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Legal Practice?</h2>
          <p className="text-xl mb-8 text-teal-100">
            Join HakiChain today and access the tools you need to manage cases efficiently, connect with quality
            clients, and grow your practice.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/dashboard"
              className="bg-white hover:bg-gray-100 text-teal-800 px-8 py-3 rounded-full font-medium transition"
            >
              Access Lawyer Dashboard
            </Link>
            <Link
              to="/signup"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full font-medium transition border-2 border-white"
            >
              Register as Lawyer
            </Link>
          </div>
          <p className="mt-6 text-teal-200">
            Already have an account?{" "}
            <Link to="/login" className="underline hover:text-white">
              Sign in here
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ index }: { index: number }) {
  const features = [
    {
      icon: <BarChart3 className="w-8 h-8 text-teal-600" />,
      title: "Case Management Dashboard",
      description: "Track cases, deadlines, and milestones with comprehensive analytics and automated reminders.",
      items: ["Case timeline tracking", "Deadline management", "Progress analytics"],
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Client Matching System",
      description: "AI-powered system connects you with verified clients who need your specific expertise.",
      items: ["Specialty-based matching", "Verified client profiles", "Smart recommendations"],
    },
    {
      icon: <DollarSign className="w-8 h-8 text-yellow-600" />,
      title: "Bounty Marketplace",
      description: "Access funded legal cases with transparent payment terms and milestone-based compensation.",
      items: ["Guaranteed payments", "Milestone tracking", "Transparent funding"],
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "Document Verification",
      description: "Blockchain-secured document verification and smart contract automation for legal processes.",
      items: ["Blockchain verification", "Digital signatures", "Tamper-proof records"],
    },
    {
      icon: <Scale className="w-8 h-8 text-purple-600" />,
      title: "Payment & Escrow",
      description: "Secure blockchain-based payment processing with automated escrow for client protection.",
      items: ["Automated escrow", "Smart contracts", "Client protection"],
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-red-600" />,
      title: "Analytics & Reporting",
      description: "Comprehensive performance analytics and automated reporting for better practice management.",
      items: ["Performance metrics", "Financial reports", "Practice insights"],
    },
  ]

  const feature = features[index]

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="mb-4">{feature.icon}</div>
      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
      <p className="text-gray-600 mb-4">{feature.description}</p>
      <ul className="space-y-2">
        {feature.items.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BenefitItemAnimated({ index }: { index: number }) {
  const benefits = [
    {
      title: "Save 40% of Administrative Time",
      description:
        "Automated case tracking, deadline management, and client communication reduce administrative overhead significantly.",
    },
    {
      title: "Guaranteed Payment Security",
      description:
        "Blockchain-based escrow system ensures you get paid for completed work with transparent milestone-based payments.",
    },
    {
      title: "Access to Quality Clients",
      description: "Connect with verified NGOs and clients who have pre-funded legal cases that match your expertise.",
    },
    {
      title: "Build Professional Reputation",
      description:
        "Transparent performance tracking and client reviews help you build a verified reputation in the legal community.",
    },
  ]

  const benefit = benefits[index]

  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
        <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
      </div>
      <div>
        <h4 className="font-bold text-lg mb-2">{benefit.title}</h4>
        <p className="text-gray-600">{benefit.description}</p>
      </div>
    </div>
  )
}

function StatCardAnimated({ index }: { index: number }) {
  const stats = [
    { number: "150+", label: "Verified Lawyers" },
    { number: "500+", label: "Cases Managed" },
    { number: "98%", label: "Payment Success" },
    { number: "40%", label: "Time Saved" },
  ]

  const stat = stats[index]

  return (
    <div>
      <div className="text-4xl font-bold text-teal-600 mb-2">{stat.number}</div>
      <div className="text-gray-600">{stat.label}</div>
    </div>
  )
}
