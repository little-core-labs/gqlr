import tap from 'tap'
import body from 'body-parser'
import express from 'express'
import { createServer } from 'http'

import { GraphQLClient, request, rawRequest, rawStringRequest } from './index.js'

const ctx = {}

tap.afterEach(() => {
  // https://stackoverflow.com/questions/10378690/remove-route-mappings-in-nodejs-express/28369539#28369539
  ctx.server._router.stack.forEach((item, i) => {
    if (item.name === 'mock') ctx.server._router.stack.splice(i, 1)
  })
})

tap.test('set up test server', t => {
  ctx.server = express()
  ctx.server.use(body.json())
  ctx.nodeServer = createServer()
  ctx.nodeServer.listen({ port: 3210 })
  ctx.url = 'http://localhost:3210'
  ctx.nodeServer.on('request', ctx.server)
  ctx.nodeServer.once('listening', t.end)
  ctx.mock = (spec) => {
    const requests = []
    ctx.server.use('*', function mock (req, res) {
      requests.push({
        method: req.method,
        headers: req.headers,
        body: req.body
      })
      if (spec.headers) {
        Object.entries(spec.headers).forEach(([name, value]) => {
          res.setHeader(name, value)
        })
      }
      res.send(spec.body ?? {})
    })
    return { ...spec, requests }
  }
})

tap.test('export contract', async t => {
  t.ok(GraphQLClient)
  t.ok(request)
  t.ok(rawRequest)

  const client = new GraphQLClient('https://example.com/graphql')

  t.ok(client)
})

tap.test('minimal query', async t => {
  console.log()
  const data = ctx.mock({
    body: {
      data: {
        viewer: {
          id: 'some-id'
        }
      }
    }
  }).body.data

  const results = await request(ctx.url, '{ viewer { id } }')
  t.same(results, data)
})

tap.test('minimal raw query', async t => {
  const { extensions, data } = ctx.mock({
    body: {
      data: {
        viewer: {
          id: 'some-id'
        }
      },
      extensions: {
        version: '1'
      }
    }
  }).body
  const { headers, ...result } = await rawRequest(ctx.url, '{ viewer { id } }')

  t.same(result, { data, extensions, status: 200 })
})

tap.test('minimal string query', async t => {
  const { extensions, data } = ctx.mock({
    body: {
      data: {
        viewer: {
          id: 'some-id'
        }
      },
      extensions: {
        version: '1'
      }
    }
  }).body

  const body = JSON.stringify({
    query: '{ viewer { id } }',
    variables: {}
  })

  const { headers, ...result } = await rawStringRequest(ctx.url, body)

  t.same(result, { data, extensions, status: 200 })
})

tap.test('minimal raw query with response headers', async t => {
  const {
    headers: reqHeaders,
    body: { data, extensions }
  } = ctx.mock({
    headers: {
      'Content-Type': 'application/json',
      'X-Custom-Header': 'test-custom-header'
    },
    body: {
      data: {
        viewer: {
          id: 'some-id'
        }
      },
      extensions: {
        version: '1'
      }
    }
  })
  const { headers, ...result } = await rawRequest(ctx.url, '{ viewer { id } }')

  t.same(result, { data, extensions, status: 200 })
  t.same(headers.get('X-Custom-Header'), reqHeaders['X-Custom-Header'])
})

tap.test('content-type with charset', async t => {
  const { data } = ctx.mock({
    // headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: {
      data: {
        viewer: {
          id: 'some-id'
        }
      }
    }
  }).body
  const results = await request(ctx.url, '{ viewer { id } }')
  t.same(results, data)
})

tap.test('basic error', async t => {
  ctx.mock({
    body: {
      errors: {
        message: 'Syntax Error GraphQL request (1:1) Unexpected Name "x"\n\n1: x\n   ^\n',
        locations: [
          {
            line: 1,
            column: 1
          }
        ]
      }
    }
  })

  const res = await request(ctx.url, 'x').catch((x) => x)

  t.same(res.message, 'Syntax Error GraphQL request (1:1) Unexpected Name "x"\n\n1: x\n   ^\n')
})

tap.test('basic error with raw request', async t => {
  ctx.mock({
    body: {
      errors: {
        message: 'Syntax Error GraphQL request (1:1) Unexpected Name "x"\n\n1: x\n   ^\n',
        locations: [
          {
            line: 1,
            column: 1
          }
        ]
      }
    }
  })
  const res = await rawRequest(ctx.url, 'x').catch((x) => x)
  t.same(res.message, 'Syntax Error GraphQL request (1:1) Unexpected Name "x"\n\n1: x\n   ^\n')
})

tap.test('shut down test server', t => {
  ctx.nodeServer.close(t.end)
})
