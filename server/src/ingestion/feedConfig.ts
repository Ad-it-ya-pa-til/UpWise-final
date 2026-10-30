import { CategoryKey } from '../types/index.js';

export interface FeedSourceConfig {
  name: string;
  feedUrl: string;
  category: CategoryKey;
  subcategory: string;
  defaultPublisher: string;
  language: 'en' | 'hi';
}

export const FEED_SOURCES: FeedSourceConfig[] = [
  // ==========================================
  // 1. TECHNOLOGY (EN & HI)
  // ==========================================
  {
    name: 'The Verge',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    category: 'Technology',
    subcategory: 'Consumer Hardware & Tech',
    defaultPublisher: 'The Verge',
    language: 'en',
  },
  {
    name: 'Ars Technica',
    feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'Technology',
    subcategory: 'Computing Platforms & Systems',
    defaultPublisher: 'Ars Technica',
    language: 'en',
  },
  {
    name: 'TechCrunch Technology',
    feedUrl: 'https://techcrunch.com/feed/',
    category: 'Technology',
    subcategory: 'Digital Infrastructure',
    defaultPublisher: 'TechCrunch',
    language: 'en',
  },
  {
    name: 'Amar Ujala Tech',
    feedUrl: 'https://www.amarujala.com/rss/technology.xml',
    category: 'Technology',
    subcategory: 'टेक और गैजेट्स',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // ==========================================
  // 2. INDIA & POLITICS (EN & HI)
  // ==========================================
  {
    name: 'The Hindu National',
    feedUrl: 'https://www.thehindu.com/news/national/feeder/default.rss',
    category: 'India & Politics',
    subcategory: 'Government and policy',
    defaultPublisher: 'The Hindu',
    language: 'en',
  },
  {
    name: 'Indian Express National',
    feedUrl: 'https://indianexpress.com/section/india/feed/',
    category: 'India & Politics',
    subcategory: 'Governance & Public Policy',
    defaultPublisher: 'The Indian Express',
    language: 'en',
  },
  {
    name: 'Amar Ujala National',
    feedUrl: 'https://www.amarujala.com/rss/national-news.xml',
    category: 'India & Politics',
    subcategory: 'राष्ट्रीय राजनीति एवं नीतियां',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },
  {
    name: 'BBC Hindi News',
    feedUrl: 'https://feeds.bbci.co.uk/hindi/rss.xml',
    category: 'India & Politics',
    subcategory: 'देश और विदेश',
    defaultPublisher: 'BBC News हिंदी',
    language: 'hi',
  },

  // ==========================================
  // 3. BUSINESS (EN & HI)
  // ==========================================
  {
    name: 'LiveMint Economy',
    feedUrl: 'https://www.livemint.com/rss/economy',
    category: 'Business',
    subcategory: 'Macroeconomics & Fiscal Policy',
    defaultPublisher: 'Mint',
    language: 'en',
  },
  {
    name: 'LiveMint Markets',
    feedUrl: 'https://www.livemint.com/rss/markets',
    category: 'Business',
    subcategory: 'Markets & Indices',
    defaultPublisher: 'Mint',
    language: 'en',
  },
  {
    name: 'CNBC Business',
    feedUrl: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',
    category: 'Business',
    subcategory: 'Global Trade & Banking',
    defaultPublisher: 'CNBC',
    language: 'en',
  },
  {
    name: 'Amar Ujala Business',
    feedUrl: 'https://www.amarujala.com/rss/business-news.xml',
    category: 'Business',
    subcategory: 'कारोबार और बाज़ार',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // ==========================================
  // 4. SCIENCE (EN)
  // ==========================================
  {
    name: 'NASA Releases',
    feedUrl: 'https://www.nasa.gov/news-release/feed/',
    category: 'Science',
    subcategory: 'Space Exploration & Astronomy',
    defaultPublisher: 'NASA',
    language: 'en',
  },
  {
    name: 'Phys.org Science',
    feedUrl: 'https://phys.org/rss-feed/',
    category: 'Science',
    subcategory: 'Physics & Earth Sciences',
    defaultPublisher: 'Phys.org',
    language: 'en',
  },
  {
    name: 'ScienceDaily Discoveries',
    feedUrl: 'https://www.sciencedaily.com/rss/all.xml',
    category: 'Science',
    subcategory: 'Bio & Health Sciences',
    defaultPublisher: 'ScienceDaily',
    language: 'en',
  },

  // ==========================================
  // 5. SPORTS (EN & HI)
  // ==========================================
  {
    name: 'ESPN Cricinfo',
    feedUrl: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    category: 'Sports',
    subcategory: 'Cricket & Tournaments',
    defaultPublisher: 'ESPNcricinfo',
    language: 'en',
  },
  {
    name: 'BBC Sport',
    feedUrl: 'http://feeds.bbci.co.uk/sport/rss.xml',
    category: 'Sports',
    subcategory: 'Major tournaments',
    defaultPublisher: 'BBC Sport',
    language: 'en',
  },
  {
    name: 'Amar Ujala Sports',
    feedUrl: 'https://www.amarujala.com/rss/sports-news.xml',
    category: 'Sports',
    subcategory: 'खेल समाचार',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // ==========================================
  // 6. WORLD (EN & HI)
  // ==========================================
  {
    name: 'BBC World',
    feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'World',
    subcategory: 'Global Dispatch',
    defaultPublisher: 'BBC News',
    language: 'en',
  },
  {
    name: 'The Guardian World',
    feedUrl: 'https://www.theguardian.com/world/rss',
    category: 'World',
    subcategory: 'International Relations & Climate',
    defaultPublisher: 'The Guardian',
    language: 'en',
  },
  {
    name: 'Amar Ujala World',
    feedUrl: 'https://www.amarujala.com/rss/world-news.xml',
    category: 'World',
    subcategory: 'अंतरराष्ट्रीय जगत',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // ==========================================
  // 7. CAREERS (EN)
  // ==========================================
  {
    name: 'Indian Express Jobs',
    feedUrl: 'https://indianexpress.com/section/jobs/feed/',
    category: 'Careers',
    subcategory: 'Workforce & Examinations',
    defaultPublisher: 'The Indian Express',
    language: 'en',
  },
  {
    name: 'LiveMint Education',
    feedUrl: 'https://www.livemint.com/rss/education',
    category: 'Careers',
    subcategory: 'Higher Education & Industry Skills',
    defaultPublisher: 'Mint',
    language: 'en',
  },
  {
    name: 'The Hindu Education',
    feedUrl: 'https://www.thehindu.com/education/feeder/default.rss',
    category: 'Careers',
    subcategory: 'Academics & Research Careers',
    defaultPublisher: 'The Hindu',
    language: 'en',
  },

  // ==========================================
  // 8. AI & STARTUPS (EN)
  // ==========================================
  {
    name: 'TechCrunch Startups',
    feedUrl: 'https://techcrunch.com/category/startups/feed/',
    category: 'AI & Startups',
    subcategory: 'Startups & Venture',
    defaultPublisher: 'TechCrunch',
    language: 'en',
  },
  {
    name: 'TechCrunch AI',
    feedUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'AI & Startups',
    subcategory: 'Artificial Intelligence & Models',
    defaultPublisher: 'TechCrunch',
    language: 'en',
  },
];
