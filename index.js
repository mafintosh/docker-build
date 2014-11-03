var docker = require('docker-remote-api')
var throughJSON = require('through-json')
var duplexify = require('duplexify')

var build = function(tag, opts) {
  if (!opts) opts = {}

  var dup = duplexify()
  var request = opts.request || docker(opts.host)

  var qs = opts.buildOptions || {}
  qs.t = tag

  if (opts.cache === false) qs.nocache = 'true'
  if (opts.quiet) qs.q = 'true'

  var onerror = function(err) {
    dup.destroy(err || new Error('Premature close'))
  }

  var post = request.post('/build', {
    qs: qs,
    version: opts.version,
    headers: {
      'Content-Type': 'application/tar',
      'X-Registry-Config': opts.registry
    }
  }, function(err, response) {
    if (err) return onerror(err)

    var parser = throughJSON(function(data) {
      if (!data.error) return data.stream
      onerror(new Error(data.error.trim()))
    })

    post.removeListener('close', onerror)
    post.on('close', function() { // to avoid premature close when stuff is buffered
      if (!response._readableState.ended) onerror()
    })

    dup.setReadable(response.pipe(parser))
  })

  dup.setWritable(post)

  post.on('error', onerror)
  post.on('close', onerror)

  return dup
}

module.exports = build
