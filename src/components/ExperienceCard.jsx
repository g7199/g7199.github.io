import React from 'react';
import { motion } from 'framer-motion';

const ExperienceCard = ({ company, position, duration, location, description, achievements }) => (
  <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{position}</h3>
        <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">{company}</p>
        <p className="text-gray-600 dark:text-gray-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {location}
        </p>
      </div>
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{duration}</span>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
    <div>
      <h4 className="font-semibold mb-2">Key Achievements:</h4>
      <ul className="list-disc pl-6 space-y-1 marker:text-green-500">
        {achievements.map((a, i) => (
          <li key={i} className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {a}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default ExperienceCard;