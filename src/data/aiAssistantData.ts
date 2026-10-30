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
