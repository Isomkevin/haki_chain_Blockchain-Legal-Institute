import { Link } from 'react-router-dom';
import { Scale, Github, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">HakiChain</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Blockchain-powered legal justice platform connecting NGOs, donors, and lawyers for positive social impact.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-teal-400 transition">Home</Link></li>
              <li><Link to="/bounties" className="hover:text-teal-400 transition">Explore Bounties</Link></li>
              <li><Link to="/documentation" className="hover:text-teal-400 transition">Case Studies</Link></li>
              <li><Link to="/documentation" className="hover:text-teal-400 transition">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/documentation" className="hover:text-teal-400 transition">Documentation</Link></li>
              <li><Link to="/documentation" className="hover:text-teal-400 transition">FAQs</Link></li>
              <li><Link to="/documentation" className="hover:text-teal-400 transition">Case Studies</Link></li>
              <li><Link to="/documentation" className="hover:text-teal-400 transition">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Email: <a href="mailto:info@hakichain.com" className="hover:text-teal-400 transition">info@hakichain.com</a></li>
              <li>Support: <a href="mailto:support@hakichain.com" className="hover:text-teal-400 transition">support@hakichain.com</a></li>
              <li>Phone: <a href="tel:+254011015464" className="hover:text-teal-400 transition">+254(0)11015464</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} HakiChain. All rights reserved. Blockchain-powered legal justice platform.</p>
        </div>
      </div>
    </footer>
  );
}
