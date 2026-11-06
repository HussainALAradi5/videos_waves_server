/** Reactions on one message: count per emoji and the viewer's own emoji. */
export interface ReactionSummary {
  counts: Map<string, number>
  mine: string | null
}
