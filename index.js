var duplexify = require('duplexify')
var host = require('docker-host')
var concat = require('concat-stream')
var http = require('http-https')
var parse = require('through-json')
var xtend = require('xtend')
var querystring = require('querystring')

var build = function(remote, opts) {
  opts = opts ? xtend(host(remote), opts) : host(remote)

  var qs = {}
  if (opts.tag) qs.t = opts.tag
  if (opts.cache === false) qs.nocache = 'true'
  if (opts.quiet) qs.q = 'true'

  var req = http.request(xtend(opts, {
    method: 'POST',
    path: '/v1.12/build?'+querystring.stringify(qs),
    headers: {
      'Content-Type': 'application/tar',
      'X-Registry-Config': new Buffer(JSON.stringify(opts.registry || {})+'\n').toString('base64')
    }
  }))

  var dup = duplexify(req)

  var onerror = function(message) {
    dup.destroy(new Error(message.toString().trim()))
  }

  var ondata = function(data) {
    if (!data.error) return data.stream
    dup.destroy(new Error(data.error.trim()))
  }

  req.on('response', function(res) {
    if (res.statusCode !== 200) return res.pipe(concat(onerror))
    dup.setReadable(res.pipe(parse(ondata)))
  })

  req.on('close', function() {
    dup.destroy()
  })

  return dup
}

module.exports = build