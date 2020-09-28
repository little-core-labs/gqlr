import fetch from 'node-fetch'
import { ClientError } from './types.js'

export class GraphQLClient {
  constructor (url, options = {}) {
    this.url = url
    this.options = options
  }

  async stringRequest (body) {
    // If you need to generate your gql body elsewhere, you can still utilize errors and options.
    const { headers, ...others } = this.options

    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
      ...others
    })

    const result = await getResult(response)

    if (response.ok && !result.errors && result.data) {
      const { headers, status } = response
      return { ...result, headers, status }
    } else {
      const errorResult = typeof result === 'string' ? { error: result } : result

      let bodyObj = body
      try {
        bodyObj = JSON.parse(body)
      } catch (e) { /* Swallow parsing errors */ }

      throw new ClientError(
        { ...errorResult, status: response.status, headers: response.headers },
        bodyObj
      )
    }
  }

  rawRequest (query, variables) {
    const body = JSON.stringify({
      query,
      variables: variables
    })

    return this.stringRequest(body)
  }

  async request (query, variables) {
    const { data } = await this.rawRequest(query, variables)
    return data
  }

  setHeaders (headers) {
    this.options.headers = headers

    return this
  }

  setHeader (key, value) {
    const { headers } = this.options

    if (headers) {
      // todo what if headers is in nested array form... ?
      headers[key] = value
    } else {
      this.options.headers = { [key]: value }
    }
    return this
  }
}

export function rawRequest (url, query, variables) {
  const client = new GraphQLClient(url)
  return client.rawRequest(query, variables)
}

export function request (url, query, variables) {
  const client = new GraphQLClient(url)
  return client.request(query, variables)
}

export function stringRequest (url, body) {
  const client = new GraphQLClient(url)
  return client.stringRequest(body)
}

function getResult (response) {
  const contentType = response.headers.get('Content-Type')
  if (contentType && contentType.startsWith('application/json')) {
    return response.json()
  } else {
    return response.text()
  }
}
