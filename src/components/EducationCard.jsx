import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EducationCard = ({ school, location, degrees, cumulativeGPA, cumulativeRank, totalCredits, duration, description, achievement }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow border-l-4 border-blue-500"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{school}</h3>
        <p className="text-gray-600 dark:text-gray-300 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {location}
        </p>
      </div>
      <div className="text-4xl">🎓</div>
    </div>

    {degrees ? (
      <div>
        {degrees.map((degree, index) => {
          const [isOpen, setIsOpen] = useState(false);  // 각 degree별 토글 상태

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-400">{degree.title}</h4>
                <motion.svg
                  className="w-5 h-5 text-blue-600"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span className="font-medium">GPA:</span> <span className="text-green-600 font-bold">{degree.gpa}</span>
                </div>
                <div>
                  <span className="font-medium">Pct:</span> <span className="text-purple-600 font-bold">{degree.rank}</span>
                </div>
                <div>
                  <span className="font-medium">Credits:</span> {degree.credits}
                </div>
                <div>
                  <span className="font-medium">Duration:</span> {degree.duration}
                </div>
              </div>

              {/* 토글 내용: 들은 수업과 학점 */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 border-t border-gray-300 pt-2"
                  >
                    <h5 className="font-medium text-sm mb-2">Courses Taken:</h5>
                    <ul className="space-y-1 text-sm">
                      {degree.courses.map((course, courseIndex) => (
                        <li key={courseIndex} className="flex justify-between">
                          <span>{course.name}</span>
                          <span className="font-bold text-green-600">{course.grade}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-dashed border-blue-300">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-xl text-green-600">{cumulativeGPA}</div>
              <div className="text-gray-600 dark:text-gray-300">Cumulative GPA</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-purple-600">{cumulativeRank}</div>
              <div className="text-gray-600 dark:text-gray-300">Overall Percentile</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-blue-600">{totalCredits}</div>
              <div className="text-gray-600 dark:text-gray-300">Total Credits</div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{duration}</p>
        <p className="mb-3">{description}</p>
        {achievement && (
          <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            🌟 {achievement}
          </span>
        )}
      </div>
    )}
  </motion.div>
);

export default EducationCard;