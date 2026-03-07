import { X, Check, Sparkles, Zap, Crown, Star } from "lucide-react";

interface UpgradePlanPageProps {
  onClose: () => void;
}

export function UpgradePlanPage({ onClose }: UpgradePlanPageProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#F5F2F1] via-white to-[#F5F2F1] text-gray-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-[#462D28]">Upgrade to Pengu AI Pro</h1>
              <p className="text-gray-600">Unlock unlimited learning potential</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Free Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#462D28]/30 transition-all shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Free</h3>
              </div>
              <div className="mb-6">
                <div className="text-3xl font-bold mb-2 text-gray-900">$0</div>
                <div className="text-gray-500 text-sm">Forever free</div>
              </div>
              <button className="w-full py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold mb-6 text-gray-700">
                Current Plan
              </button>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">10 messages per day</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Basic AI model</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Text chat only</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Limited chat history</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative bg-gradient-to-br from-[#462D28] to-[#5a3a34] border-2 border-[#462D28] rounded-2xl p-6 transform scale-105 shadow-2xl text-white">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Pro</h3>
              </div>
              <div className="mb-6">
                <div className="text-3xl font-bold mb-2">$19.99</div>
                <div className="text-white/80 text-sm">per month</div>
              </div>
              <button className="w-full py-3 bg-white text-[#462D28] rounded-xl hover:bg-gray-100 transition-colors font-bold mb-6 shadow-xl">
                Upgrade Now
              </button>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Unlimited messages</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Advanced AI models</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Deep Think mode</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">File uploads (PDF, images)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">YouTube URL processing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Flashcards & mind maps</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Voice input</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Unlimited chat history</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Priority support</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#462D28]/30 transition-all shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Enterprise</h3>
              </div>
              <div className="mb-6">
                <div className="text-3xl font-bold mb-2 text-gray-900">Custom</div>
                <div className="text-gray-500 text-sm">Contact us</div>
              </div>
              <button className="w-full py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold mb-6 text-gray-700">
                Contact Sales
              </button>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Custom AI training</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Team collaboration</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">SSO & advanced security</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Dedicated support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Custom integrations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Features Grid */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 mb-12 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-[#462D28]">Why upgrade to Pro?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Lightning Fast</h3>
                  <p className="text-sm text-gray-600">Get instant responses with our most powerful AI models</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Advanced Features</h3>
                  <p className="text-sm text-gray-600">Access flashcards, mind maps, and voice input</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Premium Support</h3>
                  <p className="text-sm text-gray-600">Get priority assistance whenever you need it</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6 text-[#462D28]">Frequently Asked Questions</h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#462D28]/30 transition-all shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900">Can I cancel anytime?</h3>
              <p className="text-sm text-gray-600">Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#462D28]/30 transition-all shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900">What payment methods do you accept?</h3>
              <p className="text-sm text-gray-600">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#462D28]/30 transition-all shadow-sm">
              <h3 className="font-semibold mb-2 text-gray-900">Is there a free trial?</h3>
              <p className="text-sm text-gray-600">Yes! New users get a 7-day free trial of Pro features. No credit card required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}