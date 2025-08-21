const educationData = [
  {
    school: 'Sungkyunkwan University',
    location: 'Seoul, South Korea',
    degrees: [
      {
        title: 'Bachelor of Science in Computer Science and Engineering',
        gpa: '4.42/4.5',
        rank: '99.2',
        credits: '46 credits (92 ECTS)',
        duration: 'Mar 2020 - Feb 2026 (expected)',
        courses: [  // 새로 추가: 들은 수업과 학점 (더미 데이터, 실제로 채워주세요)
            {
                "name": "Open Source Software Practice",
                "grade": "A+"
            },
            {
                "name": "System Programming Lab",
                "grade": "A+"
            },
            {
                "name": "Mobile App Programming Lab",
                "grade": "A+"
            },
            {
                "name": "Web Programming Lab",
                "grade": "A+"
            },
            {
                "name": "System Program",
                "grade": "A+"
            },
            {
                "name": "Data Structures",
                "grade": "A+"
            },
            {
                "name": "알고리즘개론",
                "grade": "Enrolled"
            },
            {
                "name": "소프트웨어공학개론",
                "grade": "Enrolled"
            },
            {
                "name": "Introduction to Database",
                "grade": "A"
            },
            {
                "name": "운영체제",
                "grade": "Enrolled"
            },
            {
                "name": "Introduction to Computer Architectures",
                "grade": "A+"
            },
            {
                "name": "Programming Languages",
                "grade": "A"
            },
            {
                "name": "Computer Networks",
                "grade": "A+"
            },
            {
                "name": "Machine Learning and Deep Learning",
                "grade": "A+"
            },
            {
                "name": "Logic Circuits",
                "grade": "A+"
            },
            {
                "name": "Algorithm and Problem Solving",
                "grade": "Pass"
            },
            {
                "name": "Introduction to Machine Learning",
                "grade": "Pass"
            },
            {
                "name": "Introduction to Big Data Analysis",
                "grade": "Pass"
            },
            {
                "name": "Capstone Design Project",
                "grade": "A+"
            },
            {
                "name": "Software Independent Study",
                "grade": "A+"
            }
        ]
      },
      {
        title: 'Bachelor of Economics in Statistics', 
        gpa: '4.50/4.5',
        rank: 'Rank 1st',
        credits: '30 credits (60 ECTS)',
        duration: 'Mar 2020 - Feb 2026 (expected)',
        courses: [  // 새로 추가: 더미 데이터
        
            {
                "name": "Analysis 1",
                "grade": "A+"
            },
            {
                "name": "Analysis 2",
                "grade": "A+"
            },
            {
                "name": "Introduction to Regression Analysis",
                "grade": "A+"
            },
            {
                "name": "Statistics",
                "grade": "A+"
            },
            {
                "name": "Introduction to Mathematical Statistics",
                "grade": "A+"
            },
            {
                "name": "Introduction to Machine Learning",
                "grade": "Pass"
            },
            {
                "name": "Introduction to Big Data Analysis",
                "grade": "Pass"
            },
            {
                "name": "Introduction to Statistical Inferences",
                "grade": "A+"
            },
            {
                "name": "Introduction to Biostatistics",
                "grade": "Enrolled"
            },
            {
                "name": "Statistical Data Mining",
                "grade": "A+"
            },
            {
                "name": "Introduction to Probability and Stochastic Processes",
                "grade": "Enrolled"
            },
            {
                "name": "Introduction to Deep Learning",
                "grade": "A+"
            }

        ]
      },
      {
        title: 'Bachelor of Arts in Computer Education',
        gpa: '4.19/4.5', 
        rank: '96.9',
        credits: '50 credits (100 ECTS)',
        duration: 'Mar 2020 - Feb 2026 (expected)',
        courses: [
            {
                "name": "Computer Textbook Study",
                "grade": "A+"
            },
            {
                "name": "Basic Programming",
                "grade": "A+"
            },
            {
                "name": "Computer Education",
                "grade": "B+"
            },
            {
                "name": "Data Structures",
                "grade": "A+"
            },
            {
                "name": "Database System",
                "grade": "A+"
            },
            {
                "name": "Computer Architecture",
                "grade": "A+"
            },
            {
                "name": "Operating System",
                "grade": "A+"
            },
            {
                "name": "Computer Networks",
                "grade": "A"
            },
            {
                "name": "Business Information and Logic",
                "grade": "A+"
            },
            {
                "name": "Social Learning and Internet",
                "grade": "B+"
            },
            {
                "name": "Linux System",
                "grade": "A+"
            },
            {
                "name": "Data Communication Techniques",
                "grade": "A"
            },
            {
                "name": "Software Engineering",
                "grade": "B"
            },
            {
                "name": "Computer Education Theory",
                "grade": "A+"
            },
            {
                "name": "Algorithms",
                "grade": "A+"
            },
            {
                "name": "Algorithm and Problem Solving",
                "grade": "Pass"
            },
            {
                "name": "Introduction to Machine Learning",
                "grade": "Pass"
            }
        ]

      }
    ],
    cumulativeGPA: '4.24/4.5',
    cumulativeRank: 'Top 3.1%',
    totalCredits: '207 credits (414 ECTS)'
  },
  {
    school: 'Haeryong High School',
    location: 'Yeonggwang, South Korea',
    duration: '2017 - 2020',
    description: 'Completed a science-focused academic curriculum; participated in the Science Gifted Class.',
    achievement: 'Science Gifted Class'
  }
];

export default educationData;