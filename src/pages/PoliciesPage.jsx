import React from 'react';
import { motion } from 'framer-motion';

const PoliciesPage = () => {
  return (
    <div className="min-h-screen bg-mesh-gradient py-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold gradient-text text-center mb-12">
            Policies
          </h1>

          {/* Privacy Policy Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Privacy Policy</h2>
            <div className="space-y-6 text-surface-600">
              <p>
                At SocialSync, we take your privacy seriously. This privacy policy describes how we collect, use, and protect your personal information.
              </p>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Email address (for authentication)</li>
                  <li>Instagram Business Account data (with your permission)</li>
                  <li>Post scheduling and analytics data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">How We Use Your Information</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Provide and improve our services</li>
                  <li>Process and schedule your Instagram posts</li>
                  <li>Generate analytics and insights for your posts</li>
                  <li>Send important service updates and notifications</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">Data Protection</h3>
                <p>
                  We implement industry-standard security measures to protect your data. We never sell your personal information to third parties and only share it when necessary to provide our services or when required by law.
                </p>
              </div>
            </div>
          </section>

          {/* Terms of Service Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Terms of Service</h2>
            <div className="space-y-6 text-surface-600">
              <p>
                By using SocialSync, you agree to these terms of service. Please read them carefully before using our platform.
              </p>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">User Responsibilities</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Provide accurate and truthful information</li>
                  <li>Maintain the security of your account</li>
                  <li>Respect other users and their content</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Follow Instagram's terms of service and community guidelines</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">Content Guidelines</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>No harmful, offensive, or inappropriate content</li>
                  <li>No spam or unauthorized promotional material</li>
                  <li>No infringement of intellectual property rights</li>
                  <li>No fake events or misleading information</li>
                  <li>No automation of personal Instagram accounts</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">Service Limitations</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>SocialSync is designed for use with Instagram Business accounts only</li>
                  <li>We may modify or discontinue services at any time</li>
                  <li>We are not responsible for third-party service interruptions</li>
                  <li>Post scheduling is subject to Instagram's API limitations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-surface-700 mb-3">Account Termination</h3>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or abuse our services. Users may also delete their accounts at any time.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <div className="mt-12 pt-6 border-t border-surface-200">
            <p className="text-surface-600 text-center">
              For questions about our policies, please contact us at{' '}
              <a href="mailto:support@socialsync.example" className="text-gradient-start hover:underline">
                support@socialsync.example
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PoliciesPage; 