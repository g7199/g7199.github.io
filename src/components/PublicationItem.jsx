import React from 'react';
import { motion } from 'framer-motion';

const PublicationItem = ({ title, authors, journal, year, doi, type }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    whileInView={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.5 }} 
    className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow mb-4"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium mr-3 ${
            type === 'journal' ? 'bg-blue-100 text-blue-800' :
            type === 'conference' ? 'bg-green-100 text-green-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {type.toUpperCase()}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{year}</span>
        </div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 leading-tight">
          {title}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
          <span className="font-medium">Authors:</span> {authors}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          <span className="font-medium">Published in:</span> {journal}
        </p>
      </div>
      {doi && (
        <div className="ml-4">
          <a 
            href={`https://doi.org/${doi}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline"
          >
            DOI
          </a>
        </div>
      )}
    </div>
  </motion.div>
);

export default PublicationItem;