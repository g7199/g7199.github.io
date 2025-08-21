import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  // 고정된 내 이미지 URL
  const profileImage = '/images/profile.png'; 
  // 👉 public 폴더에 "images/my-photo.jpg" 넣어두면 /images/my-photo.jpg 로 접근 가능

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden"
    >
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 text-center text-white relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col md:flex-row items-center justify-center gap-12"
        >
          <div className="relative">
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <img
                src={profileImage}
                alt="Profile"
                className="w-80 h-80 rounded-full object-cover border-8 border-white shadow-2xl"
              />
            </motion.div>
          </div>

          <div className="text-left">
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-6xl font-bold mb-4"
            >
              Hello, I'm <span className="text-yellow-300">Geonwoo Bang</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-2xl mb-6 text-gray-200"
            >
              AI Enthusiast & Future Researcher
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg mb-8 text-gray-300 max-w-2xl"
            >
              Passionate about creating innovative solutions that make a difference.
              Currently pursuing multiple degrees at Sungkyunkwan University with a
              focus on computer science, statistics, and education.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex gap-4"
            >
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                View My Work
              </button>
              <a 
                href="mailto:g7199@g.skku.edu" 
                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Contact Me
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
