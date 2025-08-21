import React from 'react';
import { motion } from 'framer-motion';

const ProjectCard = ({ project, onClick }) => (
  <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden cursor-pointer group" whileHover={{ y: -10, scale: 1.02 }} transition={{ duration: 0.3 }} onClick={() => onClick(project)}>
    <div className="relative overflow-hidden">
      <img src={project.thumbnail} alt={project.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-sm">Click to view details</p>
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{project.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{project.shortDescription}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.tech.slice(0, 3).map((tech, index) => <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{tech}</span>)}
        {project.tech.length > 3 && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">+{project.tech.length - 3} more</span>}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-blue-600 font-medium">View Details →</span>
        <div className="flex gap-2">
          <a href={project.link} className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </motion.div>
);

export default ProjectCard;