import { describe, expect, it } from 'vitest'
import {
  buildActivityClientOptions,
  getContractClientNames,
  mergeClientFilterOptions,
} from './activityFormUtils'

describe('activityFormUtils', () => {
  const contracts = [
    { data: { clientName: 'Beta Corp' } },
    { data: { clientName: 'Acme Inc.' } },
    { data: { clientName: 'Acme Inc.' } },
    { data: { clientName: '  ' } },
    { data: {} },
  ]

  it('extracts sorted unique client names from contracts', () => {
    expect(getContractClientNames(contracts)).toEqual(['Acme Inc.', 'Beta Corp'])
  })

  it('keeps legacy selected client in form options', () => {
    expect(buildActivityClientOptions(['Acme Inc.'], 'Legacy Client')).toEqual([
      'Legacy Client',
      'Acme Inc.',
    ])
  })

  it('merges contract and activity clients for filters', () => {
    expect(mergeClientFilterOptions(['Acme Inc.'], ['Legacy Client', 'Acme Inc.'])).toEqual([
      'Acme Inc.',
      'Legacy Client',
    ])
  })
})
