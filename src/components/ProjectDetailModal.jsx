import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetailModal = ({ project, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold">{project.title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              <div className="mb-6">
                <div className="relative">
                  <img src={project.images[currentImageIndex]} alt={`${project.title} screenshot ${currentImageIndex + 1}`} className="w-full h-64 object-cover rounded-lg" />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {project.images.map((_, index) => (
                      <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-3 h-3 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </div>
              </div>
            <div className="grid md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{project.description}</p>
                <h3 className="text-xl font-semibold mb-3">Key Features</h3>
                <ul className="space-y-2">
                {project.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>{feature}
                    </li>
                ))}
                </ul>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-3">Technologies Used</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                {project.tech.map((tech, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {tech}
                    </span>
                ))}
                </div>

                {/* 여기부터 조건부 렌더링 */}
                {(project.link || project.demo) && (
                <div className="flex flex-wrap gap-4">
                    {project.link && (
                    <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Code
                    </a>
                    )}
                    {project.demo && (
                    <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        Live Demo
                    </a>
                    )}
                </div>
                )}
            </div>
            </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectDetailModal;