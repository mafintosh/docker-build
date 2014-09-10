var docker = require('docker-remote-api')
var throughJSON = require('through-json')
var duplexify = require('duplexify')

var build = function(tag, opts) {
  if (!opts) opts = {}

  var dup = duplexify()
  var request = opts.request || docker(opts.host)

  var qs = {}
  qs.t = opts.tag

  if (opts.cache === false) qs.nocache = 'true'
  if (opts.quiet) qs.q = 'true'

  var post = request.post('/build', {
    qs: qs,
    version: opts.version,
    headers: {
      'Content-Type': 'application/tar',
      'X-Registry-Config': opts.registry
    }
  }, function(err, response) {
    if (err) return dup.destroy(err)

    var parser = throughJSON(function(data) {
      if (!data.error) return data.stream
      dup.destroy(new Error(data.error.trim()))
    })

    dup.setReadable(response.pipe(parser))
  })

  dup.setWritable(post)

  post.on('error', function(err) {
    dup.destroy(err)
  })

  post.on('close', function() {
    dup.destroy(new Error('Premature close'))
  })

  return dup
}

module.exports = build