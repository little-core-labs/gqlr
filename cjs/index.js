'use strict';
const fetch = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('node-fetch'))
const { ClientError } = require('./types.js')

class GraphQLClient {
  constructor (url, options = {}) {
    this.url = url
    this.options = options
  }

  async rawRequest (query, variables) {
    const { headers, ...others } = this.options

    const body = JSON.stringify({
      query,
      variables: variables
    })

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
      throw new ClientError(
        { ...errorResult, status: response.status, headers: response.headers },
        { query, variables }
      )
    }
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
exports.GraphQLClient = GraphQLClient

function rawRequest (url, query, variables) {
  const client = new GraphQLClient(url)
  return client.rawRequest(query, variables)
}
exports.rawRequest = rawRequest

function request (url, query, variables) {
  const client = new GraphQLClient(url)
  return client.request(query, variables)
}
exports.request = request

function getResult (response) {
  const contentType = response.headers.get('Content-Type')
  if (contentType && contentType.startsWith('application/json')) {
    return response.json()
  } else {
    return response.text()
  }
}
