import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlowButton from '../components/GlowButton';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Animation */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center z-10"
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-bold gradient-text mb-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            SocialSync
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-surface-600 mb-8 max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Streamline your event promotion with automated Instagram posts and analytics
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Link to="/login">
              <GlowButton className="px-8 py-3 text-lg">
                Get Started
              </GlowButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Animated background elements */}
        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end opacity-20" />
          <div className="absolute inset-0 bg-mesh-gradient" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
            What SocialSync Can Do For You
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="glass-card p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4">Event Discovery</h3>
              <p className="text-surface-600">
                Find and curate the perfect events for your audience with our intelligent event discovery system.
              </p>
            </motion.div>

            <motion.div
              className="glass-card p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4">Automated Posting</h3>
              <p className="text-surface-600">
                Schedule and automate your Instagram posts with our intuitive content management system.
              </p>
            </motion.div>

            <motion.div
              className="glass-card p-6"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4">Analytics Dashboard</h3>
              <p className="text-surface-600">
                Track your performance with detailed analytics and insights to grow your audience.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
            How It Works
          </h2>

          <div className="space-y-12">
            <motion.div 
              className="flex flex-col md:flex-row items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-4">1. Connect Your Account</h3>
                <p className="text-surface-600">
                  Link your Instagram Business account to SocialSync and let us handle the technical details.
                </p>
              </div>
              <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
                {/* Placeholder for illustration */}
                <div className="aspect-video bg-gradient-to-r from-gradient-start to-gradient-end opacity-20 rounded-lg" />
              </div>
            </motion.div>

            <motion.div 
              className="flex flex-col md:flex-row-reverse items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-4">2. Discover Events</h3>
                <p className="text-surface-600">
                  Browse through our curated list of events or search for specific ones that match your audience's interests.
                </p>
              </div>
              <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
                {/* Placeholder for illustration */}
                <div className="aspect-video bg-gradient-to-r from-gradient-start to-gradient-end opacity-20 rounded-lg" />
              </div>
            </motion.div>

            <motion.div 
              className="flex flex-col md:flex-row items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-4">3. Schedule & Automate</h3>
                <p className="text-surface-600">
                  Create and schedule your posts with our easy-to-use interface. We'll handle the posting automatically.
                </p>
              </div>
              <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
                {/* Placeholder for illustration */}
                <div className="aspect-video bg-gradient-to-r from-gradient-start to-gradient-end opacity-20 rounded-lg" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Streamline Your Event Promotion?
          </h2>
          <p className="text-white text-opacity-90 text-xl mb-8">
            Join SocialSync today and take your social media presence to the next level.
          </p>
          <Link to="/login">
            <button className="bg-white text-gradient-start px-8 py-3 rounded-lg font-semibold text-lg hover:shadow-lg transition-shadow">
              Get Started Now
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 