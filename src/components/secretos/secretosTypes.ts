export interface SecretAPI {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Secret {
  id: string
  titulo: string
  fechaCreacion: string
  fechaActualizacion: string
}

export function mapSecretFromAPI(apiSecret: SecretAPI): Secret {
  return {
    id: apiSecret.id,
    titulo: apiSecret.title,
    fechaCreacion: apiSecret.created_at,
    fechaActualizacion: apiSecret.updated_at,
  }
}

export function mapSecretsFromAPI(apiSecrets: SecretAPI[]): Secret[] {
  return apiSecrets.map(mapSecretFromAPI)
}
