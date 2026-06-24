export enum CleanupMode {
  STANDARD = 'standard',
  FORCED = 'forced',
  DRY_RUN = 'dry-run',
  DRY_RUN_FORCED = 'dry-run-forced',
}

export type CleanupResult = {
  deleted: number
  cutoff: string
  mode: CleanupMode
  count?: number // for dry runs
}

export type CleanupInfo = {
  cutoff: string
  eligibleForCleanup: number
  retentionDays: number
  mode?: CleanupMode
}