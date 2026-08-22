// Shared in-memory demo prediction store
export const demoPredictions = new Map<
  string,
  { status: string; output: string; createdAt: number }
>()
