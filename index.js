var http = require('http')
var url = require('url')
var concat = require('concat-stream')
var stream = require('stream')
var util = require('util')
var querystring = require('querystring')
var host = require('docker-host')

var Build = function(remote, opts) {
  if (!(this instanceof Build)) return new Build(remote, opts)
  stream.Duplex.call(this)

  if (typeof remote === 'object' && !opts) {
    opts = remote
    remote = null
  }

  if (!opts) opts = {}

  var self = this
  var parsed = url.parse(host(remote))
  var qs = {}

  if (opts.tag) qs.t = opts.tag
  if (opts.cache === false) qs.nocache = 'true'
  if (opts.quiet) qs.q = 'true'

  var request = http.request({
    method: 'POST',
    port: parsed.port,
    hostname: parsed.hostname === '0.0.0.0' ? 'localhost' : parsed.hostname,
    path: '/v1.12/build?'+querystring.stringify(qs),
    headers: {
      'Content-Type': 'application/tar',
      'X-Registry-Config': new Buffer(JSON.stringify(opts.registry || {})+'\n').toString('base64')
    }
  })

  var ondrain = function() {
    var tmp = self._ondrain
    self._ondrain = null
    if (tmp) tmp()
  }

  var onerror = function(err) {
    if (!util.isError(err)) err = new Error(err.toString().trim())
    self.destroy(err)
  }

  var onclose = function() {
    self.destroy()
  }

  var onend = function() {
    self.push(null)
  }

  var onfinish = function() {
    request.end()
  }

  var onreadable = function() {
    if (self._reading) self._read()
  }

  var onresponse = function(response) {
    if (response.statusCode !== 200) return response.pipe(concat(onerror))

    self._response = response
      .on('readable', onreadable)
      .on('end', onend)
  }

  request
    .on('drain', ondrain)
    .on('error', onerror)
    .on('close', onclose)
    .on('response', onresponse)

  this._reading = false
  this._response = null
  this._request = request
  this._destroyed = false
  this._ondrain = null

  this.on('finish', onfinish)
}

util.inherits(Build, stream.Duplex)

Build.prototype.destroy = function(err) {
  if (this._destroyed) return
  this._destroyed = true
  if (err) this.emit('error', err)
  this._request.abort()
  this.emit('close')
}

Build.prototype._write = function(data, enc, cb) {
  if (this._request.write(data) !== false) return cb()
  this._ondrain = cb
}

Build.prototype._read = function() {
  this._reading = true

  if (!this._response) return
  var data = this._response.read()
  if (!data) return

  this._reading = false

  try {
    data = JSON.parse(data.toString())
  } catch (err) {
    return this.destroy(err)
  }

  if (data.error) return this.destroy(new Error(data.error))
  this.push(data.stream)
}

module.exports = Build