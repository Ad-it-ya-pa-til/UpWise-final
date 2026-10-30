import { Article } from '../types/news'

export interface AiPromptTemplate {
  id: string
  label: string
  promptText: string
  category?: string
}

export const AI_PROMPT_PILLS: AiPromptTemplate[] = [
  {
    id: 'summary',
    label: 'Summary & Key Points',
    promptText: 'Summarize the core reporting and takeaways in 3 concise points.',
  },
  {
    id: 'policy',
    label: 'Policy & Economic Impact',
    promptText: 'What are the economic, policy, and regulatory implications of this story?',
  },
  {
    id: 'exam',
    label: 'UPSC / Exam Case Study',
    promptText: 'How is this relevant for competitive examinations and public administration?',
  },
  {
    id: 'deep-dive',
    label: 'Technical Deep Dive',
    promptText: 'Explain the technical and architectural concepts mentioned here in plain English.',
  },
]

export function generateSimulatedAiResponse(
  userQuery: string,
  article?: Article | null
): { reply: string; modelName: string; isDemo: true } {
  const queryLower = userQuery.toLowerCase()
  const title = article?.title || 'the current news landscape'
  const publisher = article?.source?.name || 'Upwise Hub editorial dispatches'
  const category = article?.categoryName || 'General Current Affairs'

  let responseBody = ''

  if (queryLower.includes('exam') || queryLower.includes('upsc') || queryLower.includes('civil services')) {
    responseBody = `**[Simulated Editorial Analysis • Academic & Exam Context]**

**Relevance:** ${category} & Public Policy
**Subject Anchor:** General Studies Paper II (Governance) & Paper III (Technology / Economy)

1. **Constitutional & Policy Angle:** This development concerning "${title}" ties directly into public sector modernization and statutory accountability.
2. **Key Data Point for Answers:** Sourced from verified reporting by ${publisher}, note the targeted reduction in operational bottlenecks and structured framework compliance.
3. **Critical Assessment:** In essay and answer writing, contrast the efficiency gains of centralized planning against state-level implementation federalism and right-of-way statutory challenges.`
  } else if (queryLower.includes('policy') || queryLower.includes('economic') || queryLower.includes('regulation') || queryLower.includes('impact')) {
    responseBody = `**[Simulated Editorial Analysis • Policy & Market Implications]**

Analyzing the policy dimensions of "${title}":

• **Fiscal & Infrastructure Allocations:** Enhances capital allocation efficiency across high-yield economic corridors, aligning public-private investment incentives.
• **Regulatory Standard:** Mandates verifiable compliance thresholds while curbing monopolistic lock-ins and supply-chain vulnerabilities.
• **Sovereign Impact:** Strengthens domestic manufacturing resilience and reduces external dependencies in critical industrial inputs.`
  } else if (queryLower.includes('tech') || queryLower.includes('explain') || queryLower.includes('concept') || queryLower.includes('how')) {
    responseBody = `**[Simulated Editorial Analysis • Plain-English Explainer]**

**Topic:** Core architecture behind "${title}"

• **The Core Problem:** Conventional methods suffer from physical ceilings—whether thermal dissipation limits or bureaucratic jurisdictional latency.
• **The Breakthrough:** By transitioning to verified standards (as detailed in ${publisher}'s dispatch), the system achieves significantly higher throughput with minimal energy and administrative friction.
• **Future Trajectory:** Pilot testing validates unit economics, paving the way for utility-scale domestic rollout over the next 18–24 months.`
  } else if (article) {
    responseBody = `**[Simulated Editorial Analysis • Story Breakdown]**

Based on verified reporting from **${publisher}** regarding **"${title}"**:

1. **Core Development:** ${article.summary}
2. **Key Takeaway:** ${article.keyTakeaways?.[0] || 'Strategic milestone advancing domestic capabilities and institutional policy.'}
3. **Contextual Significance:** Positioned in the **${category}** desk, this story reflects broader structural modernization across India and global supply corridors.`
  } else {
    responseBody = `**[Simulated Editorial Analysis • Query Response]**

Regarding your query ("${userQuery}"):

Upwise Hub synthesizes verified coverage across National Affairs, Deep Tech, Markets, Sports, and Global Affairs. 

For the most precise analysis, select any article on your front page or digest feed and ask for a targeted breakdown, policy implication review, or comparative analysis.`
  }

  return {
    reply: responseBody,
    modelName: 'UPWISE Editorial Engine (Simulated Preview)',
    isDemo: true,
  }
}
