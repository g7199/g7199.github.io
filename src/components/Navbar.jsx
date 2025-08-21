import React from 'react';
import { motion } from 'framer-motion';

const Navbar = ({ darkMode, setDarkMode }) => {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg' : 'bg-transparent'}`} initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <motion.h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" whileHover={{ scale: 1.05 }}>Geonwoo Bang</motion.h1>
          <ul className="hidden md:flex space-x-8">
            {['Home', 'Education', 'Experience', 'Projects', 'Awards', 'Certifications'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">{item}</a>
              </li>
            ))}
          </ul>
          <motion.button onClick={() => setDarkMode(!darkMode)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;