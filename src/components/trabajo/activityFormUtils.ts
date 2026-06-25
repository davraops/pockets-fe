export interface ContractClientSource {
  data?: {
    clientName?: string
  }
}

/** Unique client names from contracts, sorted for display. */
export function getContractClientNames(contracts: ContractClientSource[]): string[] {
  const names = contracts
    .map(contract => contract.data?.clientName?.trim())
    .filter((name): name is string => Boolean(name))

  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Form select options: contract clients plus the current value when editing legacy rows. */
export function buildActivityClientOptions(
  contractClients: string[],
  selectedClient?: string
): string[] {
  const trimmed = selectedClient?.trim()
  if (!trimmed || contractClients.includes(trimmed)) {
    return contractClients
  }

  return [trimmed, ...contractClients]
}

/** Filter dropdown: contract clients plus any client already used in activities. */
export function mergeClientFilterOptions(contractClients: string[], activityClients: string[]): string[] {
  const merged = new Set<string>()

  contractClients.forEach(name => merged.add(name))
  activityClients
    .map(name => name?.trim())
    .filter((name): name is string => Boolean(name))
    .forEach(name => merged.add(name))

  return [...merged].sort((a, b) => a.localeCompare(b, 'es'))
}
