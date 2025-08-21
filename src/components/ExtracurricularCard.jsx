import React from 'react';
import { motion } from 'framer-motion';

const ExtracurricularCard = ({ organization, role, duration, description, achievements }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-purple-200 dark:border-gray-600">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{role}</h3>
        <p className="text-lg text-purple-600 dark:text-purple-400 font-semibold">{organization}</p>
      </div>
      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">{duration}</span>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
    <div>
      <h4 className="font-semibold mb-2">Achievements:</h4>
      <ul className="space-y-1">
        {achievements.map((achievement, index) => (
          <li
            key={index}
            className="grid grid-cols-[1.25rem,1fr] gap-x-2 items-start"
          >
            <span className="text-purple-500">★</span>
            <span className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {achievement}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default ExtracurricularCard;