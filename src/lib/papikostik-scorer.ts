import scoringMap from './papikostik-scoring-map.json';

export type AnswerKey = 'a' | 'b';
export type Answers = Record<string, AnswerKey>;

export interface TraitInfo {
  category: string;
  name: string;
  code: string;
}

export const PAPIKOSTIK_TRAITS: TraitInfo[] = [
  { category: "WORK DIRECTION", name: "need to finish task", code: "N" },
  { category: "WORK DIRECTION", name: "role of hard intens worker", code: "G" },
  { category: "WORK DIRECTION", name: "need to achieve", code: "A" },
  { category: "LEADERSHIP", name: "leadership role", code: "L" },
  { category: "LEADERSHIP", name: "need to control others", code: "P" },
  { category: "LEADERSHIP", name: "ease in decision making", code: "I" },
  { category: "ACTIVITY", name: "pace", code: "T" },
  { category: "ACTIVITY", name: "vigorous type", code: "V" },
  { category: "SOCIAL NATURE", name: "need tobe notice", code: "X" },
  { category: "SOCIAL NATURE", name: "social extension", code: "S" },
  { category: "SOCIAL NATURE", name: "need to belong to group", code: "B" },
  { category: "SOCIAL NATURE", name: "need for closeness and affection", code: "O" },
  { category: "WORK STYLE", name: "theoritical type", code: "R" },
  { category: "WORK STYLE", name: "interest  in working with details", code: "D" },
  { category: "WORK STYLE", name: "organized type", code: "C" },
  { category: "TEMPERAMENT", name: "need for change", code: "Z" },
  { category: "TEMPERAMENT", name: "emotional restraint", code: "E" },
  { category: "TEMPERAMENT", name: "need to be forcefull", code: "K" },
  { category: "FOLLOWERSHIP", name: "need to support authority", code: "F" },
  { category: "FOLLOWERSHIP", name: "need for rule and supervision", code: "W" }
];

export interface PapikostikScore {
  code: string;
  score: number;
  analysis: string;
  name: string;
  category: string;
}

export function getAnalysisCategory(score: number): string {
  if (score >= 0 && score <= 3) return "LOW ANALISYS";
  if (score >= 4 && score <= 5) return "MIDDLE RANGE";
  if (score >= 6 && score <= 9) return "HIGH ANALISYS";
  return "UNKNOWN";
}

export function calculatePapikostik(answers: Answers): PapikostikScore[] {
  // Initialize scores
  const scores: Record<string, number> = {};
  PAPIKOSTIK_TRAITS.forEach(t => scores[t.code] = 0);

  // Tally scores
  for (let i = 1; i <= 90; i++) {
    const qId = i.toString();
    const ans = answers[qId];
    if (!ans) continue;

    // Type casting to access scoringMap
    const map = (scoringMap as Record<string, { a: string, b: string }>)[qId];
    if (map && map[ans]) {
      const traitCode = map[ans];
      if (scores[traitCode] !== undefined) {
        scores[traitCode]++;
      }
    }
  }

  // Format result
  return PAPIKOSTIK_TRAITS.map(t => {
    const score = scores[t.code] || 0;
    return {
      code: t.code,
      name: t.name,
      category: t.category,
      score,
      analysis: getAnalysisCategory(score)
    };
  });
}
