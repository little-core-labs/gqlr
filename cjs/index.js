'use strict';
const fetch = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('node-fetch'))
const get = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('lodash.get'))

class GraphQLClient {
  constructor (url, options = {}) {
    this.url = url
    this.options = options
  }

  async rawStringRequest (requestBody) {
    // If you need to generate your gql body elsewhere, you can still utilize errors and options.
    const { headers, ...others } = this.options

    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: requestBody,
      ...others
    })

    const responseBody = await getBody(response)

    if (response.ok && !responseBody.errors && responseBody.data) {
      const { headers, status } = response
      return { ...responseBody, headers, status }
    } else {
      const errorResponseBody = typeof responseBody === 'string' ? { error: responseBody } : responseBody

      let requestBodyObject = requestBody
      try {
        requestBodyObject = JSON.parse(requestBody)
      } catch (e) { /* Swallow parsing errors */ }

      const error = generateError({ errorResponseBody, response, requestBodyObject })

      throw error
    }
  }

  rawRequest (query, variables) {
    const body = JSON.stringify({
      query,
      variables: variables
    })

    return this.rawStringRequest(body)
  }

  async request (query, variables) {
    const { data } = await this.rawRequest(query, variables)
    return data
  }

  async stringRequest (body) {
    const { data } = await this.rawStringRequest(body)
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

function rawRequest (url, query, variables, opts) {
  const client = new GraphQLClient(url, opts)
  return client.rawRequest(query, variables)
}
exports.rawRequest = rawRequest

function request (url, query, variables, opts) {
  const client = new GraphQLClient(url, opts)
  return client.request(query, variables)
}
exports.request = request

function stringRequest (url, body, opts) {
  const client = new GraphQLClient(url, opts)
  return client.stringRequest(body)
}
exports.stringRequest = stringRequest

function rawStringRequest (url, body, opts) {
  const client = new GraphQLClient(url, opts)
  return client.rawStringRequest(body)
}
exports.rawStringRequest = rawStringRequest

function getBody (response) {
  const contentType = response.headers.get('Content-Type')
  if (contentType && contentType.startsWith('application/json')) {
    return response.json()
  } else {
    return response.text()
  }
}

function generateError ({ errorResponseBody, response, requestBodyObject }) {
  // The goal is to capture a real error, with a halfway decent message.
  // If there are additional object paths with good errors, we can add them here.
  // This coveres apollo.
  const message = get(errorResponseBody, 'errors[0].extensions.exception.data.message[0].messages[0].message') ||
    get(errorResponseBody, 'errors[0].extensions.exception.data.data[0].messages[0].message') ||
    get(errorResponseBody, 'errors[0].message') ||
    get(errorResponseBody, 'errors.message') ||
    get(response, 'statusText') ||
    'There was an error with the request.'
  const error = new Error(message)

  error.response = { ...errorResponseBody, status: response.status, headers: Object.fromEntries(response.headers.entries()) }
  error.request = requestBodyObject

  return error
}
exports.generateError = generateError
