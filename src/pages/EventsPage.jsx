import React from 'react';
import { motion } from 'framer-motion';

const EventsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">Events</h1>
      <div className="glass-card p-8">
        <p className="text-surface-600">Events page content coming soon...</p>
      </div>
    </motion.div>
  );
};

export default EventsPage; 