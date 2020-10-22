# gqlr
![tests](https://github.com/little-core-labs/gqlr/workflows/tests/badge.svg)

Minimaler Fork of the Minimal GraphQL client [graphql-request](https://ghub.io/graphql-request).

## Features

- Even simpler than graphql-request! Needlessly duplicated code removed.
- Same Promise-based API (works with `async` / `await`).
- No Typescript.
- Actually Isomorphic (works with Node / browsers). Ships a real ESM module, instead of the fake one TS generates.

## Why?

graphql-request was causing problems downstream due to the fake ESM module it ships, making it incompatible with **both** browser esm and node.js esm.  Additionally, many people are using graphql-request already, so making some simple breaking changes would cause a headache for everyone involved.

## Install

```sh
npm add gqlr
```

## Quickstart

Send a GraphQL query with a single line of code. ▶️ [Try it out](https://runkit.com/593130bdfad7120012472003/593130bdfad7120012472004).

```js
import { request } from 'gqlr'

const query = `{
  Movie(title: "Inception") {
    releaseDate
    actors {
      name
    }
  }
}`

request('https://api.graph.cool/simple/v1/movies', query).then((data) => console.log(data))
```

or directly in the browser with native ESM:

```js
import { request } from 'https://unpkg.com/gqlr@^1?module'

const query = `{
  Movie(title: "Inception") {
    releaseDate
    actors {
      name
    }
  }
}`

request('https://api.graph.cool/simple/v1/movies', query).then((data) => console.log(data))
```

## Usage

```js
import { request, GraphQLClient } from 'gqlr' // Works with real Node.js ESM

// Run GraphQL queries/mutations using a static function
request(endpoint, query, variables).then((data) => console.log(data))

// ... or create a GraphQL client instance to send requests
const client = new GraphQLClient(endpoint, { headers: {} })
client.request(query, variables).then((data) => console.log(data))
```

## API

### `import { GraphQLClient, request, rawRequest } from 'gqlr'`

Import the `GraphQLClient` class, `request` and `rawRequest` from `gqlr`.

### `client = new GraphQLClient(url, [opts])`

Create a new `client` instance of `GraphQLClient` for a given `url` with the following default `opts` passed the [`node-fetch`](https://ghub.io/node-fetch) internally:

```js
{
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
}
````

Any `opts.headers` are mixed in with the default headers, and any other properties on `opts` are passed as `fetch` options.

### `{ headers, status, ...result } = await client.rawRequest(query, [variables])`

Make a `query` request with a `client` including the optional `variables` object, returning extra response properties like `extensions`.

### `data = await client.request(query, [variables])`

Make a `query` request with a `client` including the optional `variables` object, returning just the `data` field.

### `data = await client.stringRequest(body)`

Make a request with a `body` string to the configured GQL endpoint.  The body should be in the form of:


```js
const body = JSON.stringify({
  query: '{ viewer { id } }',
  variables: {}
})
```

Useful with tools like [SWR](https://github.com/vercel/swr), where you usually stringify a query and variables object into a cache key that gets passed to your fetcher function.  With `stringRequest`, you can avoid double `JSON.stringify` problems, or complex variable scope passing.

### `client = client.setHeaders(headers)`

Pass a `headers` object to a client to customize the headers.

### `client = client.setHeader(key, value)`

Set a specific header by a key and a value.

### `{ headers, status, ...result } = rawRequest(url, query, [variables], [opts])`

Convenience function to instantiate a client and make a request in a single function call, returning the extended properties of the graphql request.

### `data = request(url, query, [variables], [opts])`

Convenience function to instantiate a client and make a request in a single function call.

### `data = stringRequest(url, body, [opts])`

Convenience function to instantiate a client and make a `stringRequest` in a single function call.

## Examples

### Authentication via HTTP header

```js
import { GraphQLClient } from 'gqlr'

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer MY_TOKEN',
    },
  })

  const query = /* GraphQL */ `
    {
      Movie(title: "Inception") {
        releaseDate
        actors {
          name
        }
      }
    }
  `

  const data = await graphQLClient.request(query)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))
```

[Example File](examples/authentication-via-http-header.js)

### Passing more options to fetch

```js
import { GraphQLClient } from 'gqlr'

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const graphQLClient = new GraphQLClient(endpoint, {
    credentials: 'include',
    mode: 'cors',
  })

  const query = /* GraphQL */ `
    {
      Movie(title: "Inception") {
        releaseDate
        actors {
          name
        }
      }
    }
  `

  const data = await graphQLClient.request(query)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))
```

[Example](examples/passing-more-options-to-fetch.js)

### Using variables

```js
import { request } from 'gqlr'

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const query = /* GraphQL */ `
    query getMovie($title: String!) {
      Movie(title: $title) {
        releaseDate
        actors {
          name
        }
      }
    }
  `

  const variables = {
    title: 'Inception',
  }

  const data = await request(endpoint, query, variables)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))
```

[Example](examples/using-variables.js)

### Error handling

```js
import { request } from 'gqlr'

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const query = /* GraphQL */ `
    {
      Movie(title: "Inception") {
        releaseDate
        actors {
          fullname # "Cannot query field 'fullname' on type 'Actor'. Did you mean 'name'?"
        }
      }
    }
  `

  try {
    const data = await request(endpoint, query)
    console.log(JSON.stringify(data, undefined, 2))
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    process.exit(1)
  }
}

main().catch((error) => console.error(error))
```

[Example](examples/error-handling.js)

### Using `require` instead of `import`

```js
const { request } = require('gqlr')

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const query = /* GraphQL */ `
    {
      Movie(title: "Inception") {
        releaseDate
        actors {
          name
        }
      }
    }
  `

  const data = await request(endpoint, query)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))
```

### Cookie support for `node`

```sh
npm install fetch-cookie
```

```js
// This probably only works in CJS environments.
require('fetch-cookie/node-fetch')(require('node-fetch'))

require { GraphQLClient } = require('gqlr')

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: 'Bearer MY_TOKEN',
    },
  })

  const query = /* GraphQL */ `
    {
      Movie(title: "Inception") {
        releaseDate
        actors {
          name
        }
      }
    }
  `

  const data = await graphQLClient.rawRequest(query)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))
```

[Example](examples/cookie-support-for-node.js)

### Receiving a raw response

The `request` method will return the `data` or `errors` key from the response.
If you need to access the `extensions` key you can use the `rawRequest` method:

```js
import { rawRequest } from 'gqlr'

async function main() {
  const endpoint = 'https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr'

  const query = /* GraphQL */ `
    {
      Movie(title: "Inception") {
        releaseDate
        actors {
          name
        }
      }
    }
  `

  const { data, errors, extensions, headers, status } = await rawRequest(endpoint, query)
  console.log(JSON.stringify({ data, errors, extensions, headers, status }, undefined, 2))
}

main().catch((error) => console.error(error))
```

[Example](examples/receiving-a-raw-response.js)

## FAQ

### What's the difference between `gqlr` and `graphql-request`?

`gqlr` is a minimal, mostly drop-in replacement of `graphql-request` aimed at:

- shipping artifacts with working esm exports.
- work in the browser without a bundler (even more minimal)
- work with Node.js "type": "module".
- further reducing library size (remove unnecessarily duplicated code)
- removing the project overhead of Typescript syntax, Typescript tooling, and Typescript bugs.
- Clarify undocumented methods and edge-cases.

Breaking changes include:

- No fake 'default' export.  If you use this, switch to importing named exports.
- Imports node-fetch.  This might break react native, not sure.


### This is too simple, to use the power of graphql you must use...

- This module pairs really well with [swr](https://swr.now.sh) and other similar ideas.  If you need caching, react hooks and any other party tricks, just use that.  Orthogonal concerns ftw.
