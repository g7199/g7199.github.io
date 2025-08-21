const projectsData = [
    {
    id: 1,
    title: 'UniScore – Interpretable LLM-based Evaluation Framework',
    thumbnail: '/images/uniscore-thumb.png',
    shortDescription: 'Multi-criteria LLM evaluation with AHP-JSD weighting for robust, explainable scoring.',
    description:
        'Developed UniScore, a novel framework that integrates multi-criteria LLM-based evaluation with Analytic Hierarchy Process and Jensen–Shannon Divergence weighting. The system mitigates central tendency bias in LLM outputs and provides interpretable, distribution-based scores for both continuous and discrete datasets. Demonstrated strong performance on Amazon review helpfulness prediction and essay scoring tasks.',
    tech: ['Python', 'PyTorch', 'NumPy', 'LLMs'],
    features: [
        'Interpretable LLM-based scoring',
        'AHP-JSD weighting mechanism',
        'Bias mitigation and robust evaluation',
        'Validated on real-world datasets'
    ],
    year: 2025,
    images: [
        '/images/uniscore-thumb.png'
    ]
    },

  {
    id: 2,
    title: 'Cell-Structured Generative Agent for Narrative Coherence',
    thumbnail: '/images/snap-thumb.png',
    shortDescription: 'Generative agent with modular cell-based control for long-horizon coherence.',
    description:
      'Designed a modular cell-based control unit for long-horizon scenario tracking in LLMs. Mitigated spatial-temporal distortion in multi-turn interactions by chaining generative cells, achieving statistically significant gains in human evaluation over vanilla GPT-4o.',
    tech: ['NLP', 'LLMs'],
    features: ['Cell-based generative control', 'Long-horizon tracking', 'Human evaluation gains'],
    year: 2024,
    images: [
      '/images/snap-thumb.png',
    ]
  },
  {
    id: 3,
    title: 'Real-time DB Lightweight Information Chatbot',
    thumbnail: '/images/db-chatbot-thumb.png',
    shortDescription: 'Lightweight chatbot with 2-stage RAG pipeline for exchange students.',
    description:
      'Designed a 2-stage RAG pipeline for an exchange student Q&A chatbot. Achieved a user trust score of 4.72/5 in real deployment.',
    tech: ['Python', 'RAG', 'FastAPI'],
    features: ['2-stage retrieval pipeline', 'Real-time chatbot', 'User trust evaluation'],
    year: 2024,
    images: [
      '/images/db-chatbot-1.png'
    ],
    link: 'https://github.com/lastcnv05/CapstoneProject-2024-Fall'
  },
  {
    id: 4,
    title: 'Echo Food Planner – Agricultural Price Forecasting & Meal Plan RecSys',
    thumbnail: '/images/echo-food-thumb.png',
    shortDescription: 'Food price forecasting and meal recommendation system.',
    description:
      'Predicted food prices using STL decomposition and CNN-LSTM hybrid architecture. Developed a meal planning service using collaborative filtering and cost optimization. Awarded Excellence Prize at the MAFA Startup Competition.',
    tech: ['Python', 'LSTM', 'STL decomposition'],
    features: ['Food price forecasting', 'Meal plan recommendation', 'Competition-winning system'],
    year: 2024,
    images: [
      '/images/echo-food-1.png',
    ]
  },
  {
    id: 5,
    title: 'LiterAI – AI-Powered Literacy Support Platform',
    thumbnail: '/images/LiterAll-thumb.png',
    shortDescription: 'AI literacy platform for text transformation and readability adaptation.',
    description:
      'Designed an AI-based framework for real-time text transformation and readability adaptation. Developed dynamic scoring metrics and deployed a full-stack platform for live literacy support. Awarded Grand Prize at SKKU AI Hackathon.',
    tech: ['React', 'Node.js', 'AI Models'],
    features: ['Text transformation', 'Readability adaptation', 'Full-stack platform'],
    year: 2024,
    images: [
      '/images/LiterAll-thumb.png',
    ],
    link: 'https://github.com/nim-od/LiterAll'
  },
  {
    id: 6,
    title: 'Social Isolation Risk Mapping',
    thumbnail: '/images/social-risk-thumb.png',
    shortDescription: 'Survey-based scoring framework for youth social isolation risks.',
    description:
      'Developed AHP-JSD, a novel survey-based scoring framework combining Analytic Hierarchy Process with Jensen-Shannon Divergence. Applied it to quantify youth social isolation risks from masked telecom and financial datasets. Awarded 2nd Prize at Data Safety Zone Competition.',
    tech: ['Python', 'AHP', 'Survey Analytics'],
    features: ['AHP-JSD framework', 'Youth risk quantification', 'Competition finalist project'],
    year: 2023,
    images: [
      '/images/social-risk-1.png'
    ]
  },
  {
    id: 7,
    title: 'SKKU Learning Fair Video Platform',
    thumbnail: '/images/skku-video-thumb.png',
    shortDescription: 'AWS-based platform for large-scale learning events.',
    description:
      'Developed an AWS-based video platform capable of handling 4,000+ users per hour. Reduced infrastructure costs by 60% through optimization. Project commissioned by Sungkyunkwan University.',
    tech: ['AWS', 'Node.js', 'Video Streaming'],
    features: ['Large-scale streaming', 'Cost optimization', 'Commissioned university project'],
    year: 2021,
    images: [
      '/images/skku-video-1.png',
      '/images/skku-video-2.png',
      '/images/skku-video-3.png'
    ]
  },
  {
    id: 8,
    title: 'StyleGAN-based Virtual Fashion Model',
    thumbnail: '/images/stylegan-thumb.png',
    shortDescription: 'Virtual fashion model with identity-preserving clothing transformation.',
    description:
      'Developed a StyleGAN-based fashion transformation model. Implemented identity-preserving clothing style transfer algorithms in partnership with Smilegate.',
    tech: ['StyleGAN', 'PyTorch', 'Computer Vision'],
    features: ['Virtual fashion modeling', 'Clothing style transfer', 'Industry partnership'],
    year: 2021,
    images: [
      '/images/stylegan-1.png',
      '/images/stylegan-2.png',
      '/images/stylegan-3.png'
    ]
  }
];

export default projectsData;
