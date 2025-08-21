import React from 'react';
import { motion } from 'framer-motion';

const CertificationCard = ({ name, issuer, date }) => (
  <motion.div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 border-4 border-yellow-300 p-6 rounded-2xl shadow-lg relative overflow-hidden" whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 215, 0, 0.3)', borderColor: 'rgb(251, 191, 36)' }} transition={{ duration: 0.3 }} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}>
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-transparent to-yellow-400 transform rotate-45"></div>
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="text-3xl">📜</div>
        <motion.div animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-2xl">✨</motion.div>
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{name}</h3>
      <div className="space-y-1 text-sm">
        <p><span className="font-medium">Issuer:</span> {issuer}</p>
        <p><span className="font-medium">Date:</span> {date}</p>
      </div>
      <div className="absolute bottom-4 right-4">
        <motion.div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xs border-4 border-yellow-500" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>CERT</motion.div>
      </div>
    </div>
  </motion.div>
);

export default CertificationCard;