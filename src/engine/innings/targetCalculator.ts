export interface TargetInput {
  firstInningsRuns: number
  /** A manually entered officially-supplied revised target (e.g. DLS), overriding the simple calculation. The plan requires manual entry rather than an invented DLS implementation. */
  manualRevisedTarget?: number
}

export function calculateTarget(input: TargetInput): number {
  if (input.manualRevisedTarget !== undefined) {
    return input.manualRevisedTarget
  }
  return input.firstInningsRuns + 1
}
