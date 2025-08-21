import React from 'react';
import { motion } from 'framer-motion';

const TeachingCard = ({ course, institution, duration, level, description, responsibilities }) => (
  <motion.div 
    initial={{ opacity: 0, x: -50 }} 
    whileInView={{ opacity: 1, x: 0 }} 
    transition={{ duration: 0.6 }} 
    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{course}</h3>
        <p className="text-lg text-purple-600 dark:text-purple-400 font-semibold">{institution}</p>
        <p className="text-gray-600 dark:text-gray-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" clipRule="evenodd" />
          </svg>
          {level}
        </p>
      </div>
      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">{duration}</span>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
    <div>
      <h4 className="font-semibold mb-2">Responsibilities:</h4>
      <ul className="list-disc pl-6 space-y-1 marker:text-purple-500">
        {responsibilities.map((r, i) => (
          <li key={i} className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {r}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default TeachingCard;