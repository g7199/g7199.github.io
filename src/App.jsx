import React, { useState } from 'react';
import { motion } from 'framer-motion';
import HeroSection from './components/HeroSection';
import Navbar from './components/Navbar';
import EducationCard from './components/EducationCard';
import ProjectCard from './components/ProjectCard';
import ProjectDetailModal from './components/ProjectDetailModal';
import ExperienceCard from './components/ExperienceCard';
import TeachingCard from './components/TeachingCard';
import PublicationItem from './components/PublicationItem';
import ExtracurricularCard from './components/ExtracurricularCard';
import AwardCard from './components/AwardCard';
import CertificationCard from './components/CertificationCard';

import educationData from './data/educationData';
import projectsData from './data/projectsData';
import experienceData from './data/experienceData';
import teachingData from './data/teachingData';
import publicationsData from './data/publicationsData';
import extracurricularData from './data/extracurricularData';
import awardsData from './data/awardsData';
import certificationsData from './data/certificationsData';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <HeroSection />

        <main className="container mx-auto px-6 py-20">
          {/* Education Section */}
          <section id="education" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Education</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">My academic journey and achievements</p>
            </motion.div>
            <div className="space-y-8">
              {educationData.map((edu, index) => <EducationCard key={index} {...edu} />)}
            </div>
          </section>

          {/* Experience Section */}
          <section id="experience" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Experience</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Professional and research experience</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {experienceData.map((exp, index) => <ExperienceCard key={index} {...exp} />)}
            </div>
          </section>

          {/* Teaching Experience Section */}
          <section id="teaching" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r leading-tight from-purple-600 to-indigo-600 bg-clip-text text-transparent">Teaching Experience</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Educational contributions and mentoring</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {teachingData.map((teaching, index) => <TeachingCard key={index} {...teaching} />)}
            </div>
          </section>

          {/* Publications Section */}
          <section id="publications" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Publications</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Research contributions and academic publications</p>
            </motion.div>
            <div className="w-full mx-auto">
              {publicationsData.map((publication, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <PublicationItem {...publication} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Extracurricular Section */}
          <section id="extracurricular" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Extracurricular Activities</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Leadership and community involvement</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {extracurricularData.map((activity, index) => <ExtracurricularCard key={index} {...activity} />)}
            </div>
          </section>

          {/* Projects Section */}
          <section id="projects" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Projects</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Showcasing my technical skills and creativity</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsData.map((project) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <ProjectCard project={project} onClick={handleProjectClick} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Awards Section */}
          <section id="awards" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Awards & Recognition</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Achievements and honors received</p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-8">
              {awardsData.map((award, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.8, rotateY: -180 }} whileInView={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: 0.8, delay: index * 0.2, type: "spring", stiffness: 100 }}>
                  <AwardCard {...award} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Certifications Section */}
          <section id="certifications" className="py-20">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">Certifications</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">Professional certifications and credentials</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificationsData.map((cert, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                  <CertificationCard {...cert} />
                </motion.div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 dark:bg-gray-950 text-white py-12">
          <div className="container mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h3 className="text-2xl font-bold mb-4">Let's Connect</h3>
              <p className="text-gray-400 mb-6">Feel free to reach out for collaborations or just a friendly chat!</p>
              <div className="flex justify-center space-x-6 mb-8">
                {[
                  { name: 'GitHub', icon: '🐙', url: '#' },
                  { name: 'LinkedIn', icon: '💼', url: '#' },
                  { name: 'Email', icon: '📧', url: 'mailto:your.email@example.com' },
                  { name: 'Twitter', icon: '🐦', url: '#' }
                ].map((social, index) => (
                  <motion.a key={social.name} href={social.url} className="text-3xl hover:scale-110 transition-transform" whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                    {social.icon}
                  </motion.a>
                ))}
              </div>
              <div className="border-t border-gray-700 pt-6">
                <p className="text-gray-400">© 2024 Your Name. Made with ❤️ and lots of ☕</p>
              </div>
            </motion.div>
          </div>
        </footer>

        <ProjectDetailModal project={selectedProject} isOpen={isProjectModalOpen} onClose={closeProjectModal} />

        <motion.button className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default App;