export interface CommunityComment {
  id: string
  authorName: string
  authorInitials: string
  content: string
  createdAt: string
}

export interface CommunityPost {
  id: string
  title: string
  category: string
  content: string
  sourceLink?: string
  sourceExplanation?: string
  city?: string
  status?: 'pending' | 'approved' | 'rejected'
  verificationLevel?: 'unverified' | 'verified'
  authorName: string
  authorEmail?: string
  authorInitials: string
  createdAt: string
  upvotes: number
  hasUpvoted?: boolean
  comments: CommunityComment[]
}

export const COMMUNITY_CATEGORIES: string[] = [
  'All Dispatches',
  'Infrastructure & Economy',
  'Technology & Computing',
  'Public Policy & Law',
  'Science & Health',
  'Civic Affairs & Education',
]

export const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-seed-1',
    title: 'Intermodal Freight Analysis: Breaking down the national transit corridor blueprint',
    category: 'Infrastructure & Economy',
    content: 'The integration of dedicated rail-freight interchanges directly with inland waterways along the Ganga is the most critical shift in the newly tabled infrastructure policy. The primary challenge remains the execution of statutory right-of-way clearances across state jurisdictions.',
    sourceLink: 'https://delhichronicle.in/economy/national-transit-blueprint-2026',
    authorName: 'Raghavan Iyer',
    authorInitials: 'RI',
    createdAt: 'Today, 2:15 PM',
    upvotes: 19,
    comments: [
      {
        id: 'c-1',
        authorName: 'Meera Sen',
        authorInitials: 'MS',
        content: 'Compressing logistics overhead from 13.8% of GDP to sub-9% would unlock massive export competitiveness for domestic manufacturing clusters.',
        createdAt: '2 hours ago',
      },
      {
        id: 'c-2',
        authorName: 'Arun Kulkarni',
        authorInitials: 'AK',
        content: 'Inland waterways have historically struggled with seasonal draft depths during dry months. Automated dredging telemetry will be essential.',
        createdAt: '45 mins ago',
      },
    ],
  },
  {
    id: 'post-seed-2',
    title: 'Why room-temperature Silicon Photonics is a pivotal milestone for Indian computing R&D',
    category: 'Technology & Computing',
    content: 'Operating optical interconnects at ambient temperatures without cryogenic chillers resolves the dominant thermal bottleneck in next-generation high-performance computing clusters. Foundry partnerships will determine how quickly this transitions from IISc labs to fabrication.',
    sourceLink: 'https://techcrunch.com/2026/10/29/iisc-silicon-photonic-ai-chips',
    authorName: 'Dr. K. Swaminathan',
    authorInitials: 'KS',
    createdAt: 'Yesterday',
    upvotes: 34,
    comments: [
      {
        id: 'c-3',
        authorName: 'Tanvi Saxena',
        authorInitials: 'TS',
        content: 'Co-packaging optical transceivers directly onto compute substrates eliminates copper line losses, which is where 40% of datacenter power gets converted into waste heat.',
        createdAt: 'Yesterday, 8:20 PM',
      },
    ],
  },
  {
    id: 'post-seed-3',
    title: 'Algorithmic Governance: Balancing open innovation with auditability under the Digital India framework',
    category: 'Public Policy & Law',
    content: 'The proposed statutory guidelines for automated decision-making introduce structured transparency tiers without mandating proprietary model weights disclosure, striking a practical balance for engineering teams.',
    sourceLink: 'https://indianexpress.com/article/india/supreme-court-ai-governance-guidelines-2026',
    authorName: 'Ananya Deshmukh',
    authorInitials: 'AD',
    createdAt: '2 days ago',
    upvotes: 27,
    comments: [
      {
        id: 'c-4',
        authorName: 'Vikram Joshi',
        authorInitials: 'VJ',
        content: 'Article 21 human recourse guarantees are critical. Having an auditable appeal trail preserves citizen rights in automated benefit distribution.',
        createdAt: '1 day ago',
      },
    ],
  },
  {
    id: 'post-seed-4',
    title: 'Restoring Bundelkhand Stepwells: Low-tech community engineering beats high-cost deep borewells',
    category: 'Science & Health',
    content: 'Desilting historical baoris recharges shallow aquifers naturally through porous sandstone strata. It is remarkable how 16th-century hydraulic engineering solved seasonal drought challenges that modern diesel pumps often exacerbate by draining the deep water table.',
    sourceLink: 'https://theguardian.com/world/2026/oct/28/bundelkhand-stepwells-heritage-water',
    authorName: 'Nitin Pandey',
    authorInitials: 'NP',
    createdAt: '3 days ago',
    upvotes: 42,
    comments: [
      {
        id: 'c-5',
        authorName: 'Geeta Rao',
        authorInitials: 'GR',
        content: 'UNESCO recognizing this model should encourage municipal corporations in Deccan plateau cities to restore urban water bodies instead of concreting them over.',
        createdAt: '2 days ago',
      },
    ],
  },
]
