"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Mail, Lock, Shield } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<"user" | "admin">("user")
  const navigate = useNavigate()
  const { signIn } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (loginType === "admin") {
      const adminEmail = "admin@hakichain.com"
      const adminPassword = "Admin@123!HakiChain"

      if (email === adminEmail && password === adminPassword) {
        try {
          await signIn(email, password)
          navigate("/admin-dashboard")
        } catch (err) {
          setError("Admin account not set up. Please contact support.")
          console.error(err)
        } finally {
          setLoading(false)
        }
        return
      } else {
        setError("Invalid admin credentials")
        setLoading(false)
        return
      }
    }

    try {
      await signIn(email, password)
      navigate("/dashboard")
    } catch (err) {
      setError("Failed to sign in. Please check your credentials.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your HakiChain dashboard</p>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setLoginType("user")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginType === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setLoginType("admin")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                loginType === "admin" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder={loginType === "admin" ? "admin@hakichain.com" : "you@example.com"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {loginType === "user" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700">
                  Forgot your password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                loginType === "admin" ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {loginType === "user" && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            {loginType === "admin" ? (
              <div>
              {/* //   <p className="mb-2 font-semibold text-gray-700">Admin Credentials:</p>
              //   <div className="text-xs space-y-1">
              //     <div>Email: admin@hakichain.com</div>
              //     <div>Password: Admin@123!HakiChain</div>
              //   </div> */}
              </div>
            ) : (
              <div>
                {/* <p className="mb-2">Demo credentials:</p>
                <div className="text-xs space-y-1">
                  <div>lawyer@example.com (Lawyer)</div>
                  <div>ngo@example.com (NGO)</div>
                  <div>donor@example.com (Donor)</div>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
