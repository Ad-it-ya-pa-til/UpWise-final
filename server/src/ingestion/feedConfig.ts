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
  // ENGLISH SOURCES
  // ==========================================

  // India & Politics (EN)
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
    subcategory: 'Current affairs',
    defaultPublisher: 'The Indian Express',
    language: 'en',
  },

  // Technology & Science (EN)
  {
    name: 'TechCrunch',
    feedUrl: 'https://techcrunch.com/feed/',
    category: 'Technology & Science',
    subcategory: 'Startups & AI',
    defaultPublisher: 'TechCrunch',
    language: 'en',
  },
  {
    name: 'The Verge',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    category: 'Technology & Science',
    subcategory: 'AI and technology',
    defaultPublisher: 'The Verge',
    language: 'en',
  },
  {
    name: 'Ars Technica',
    feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'Technology & Science',
    subcategory: 'Scientific discoveries',
    defaultPublisher: 'Ars Technica',
    language: 'en',
  },
  {
    name: 'NASA Releases',
    feedUrl: 'https://www.nasa.gov/news-release/feed/',
    category: 'Technology & Science',
    subcategory: 'Space',
    defaultPublisher: 'NASA',
    language: 'en',
  },

  // Business & Economy (EN)
  {
    name: 'LiveMint Economy',
    feedUrl: 'https://www.livemint.com/rss/economy',
    category: 'Business & Economy',
    subcategory: 'Economy',
    defaultPublisher: 'Mint',
    language: 'en',
  },
  {
    name: 'LiveMint Markets',
    feedUrl: 'https://www.livemint.com/rss/markets',
    category: 'Business & Economy',
    subcategory: 'Finance and markets',
    defaultPublisher: 'Mint',
    language: 'en',
  },
  {
    name: 'CNBC Business',
    feedUrl: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',
    category: 'Business & Economy',
    subcategory: 'Business',
    defaultPublisher: 'CNBC',
    language: 'en',
  },

  // Sports (EN)
  {
    name: 'ESPN Cricinfo',
    feedUrl: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    category: 'Sports',
    subcategory: 'Cricket',
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

  // World & Lifestyle (EN)
  {
    name: 'BBC World',
    feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'World & Lifestyle',
    subcategory: 'World news',
    defaultPublisher: 'BBC News',
    language: 'en',
  },
  {
    name: 'The Guardian World',
    feedUrl: 'https://www.theguardian.com/world/rss',
    category: 'World & Lifestyle',
    subcategory: 'Environment',
    defaultPublisher: 'The Guardian',
    language: 'en',
  },

  // ==========================================
  // HINDI SOURCES (हिन्दी समाचार स्रोत)
  // ==========================================

  // India & Politics (HI)
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

  // Technology & Science (HI)
  {
    name: 'Amar Ujala Tech',
    feedUrl: 'https://www.amarujala.com/rss/technology.xml',
    category: 'Technology & Science',
    subcategory: 'टेक और गैजेट्स',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // Business & Economy (HI)
  {
    name: 'Amar Ujala Business',
    feedUrl: 'https://www.amarujala.com/rss/business-news.xml',
    category: 'Business & Economy',
    subcategory: 'कारोबार और बाज़ार',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // Sports (HI)
  {
    name: 'Amar Ujala Sports',
    feedUrl: 'https://www.amarujala.com/rss/sports-news.xml',
    category: 'Sports',
    subcategory: 'खेल समाचार',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },

  // World & Lifestyle (HI)
  {
    name: 'Amar Ujala World',
    feedUrl: 'https://www.amarujala.com/rss/world-news.xml',
    category: 'World & Lifestyle',
    subcategory: 'अंतरराष्ट्रीय जगत',
    defaultPublisher: 'अमर उजाला',
    language: 'hi',
  },
];
