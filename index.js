var duplexify = require('duplexify')
var parse = require('through-json')
var docker = require('docker-remote-api')

var build = function(remote, opts) {
  if (arguments.length === 1 && typeof remote === 'object') return build(null, remote)
  if (!opts) opts = {}

  var request = remote instanceof docker ? remote : docker(remote)

  var qs = {}
  if (opts.tag) qs.t = opts.tag
  if (opts.cache === false) qs.nocache = 'true'
  if (opts.quiet) qs.q = 'true'

  var req = request.post('/build', {
    qs: qs,
    registry: opts.registry,
    headers: {
      'Content-Type': 'application/tar'
    }
  }, function(err, res) {
    if (err) return dup.destroy(err)
    dup.setReadable(res.pipe(parse(function(data) {
      if (!data.error) return data.stream
      dup.destroy(new Error(data.error.trim()))
    })))
  })

  var dup = duplexify(req)

  req.on('error', function(err) {
    dup.destroy(err)
  })

  req.on('close', function() {
    dup.destroy(new Error('Premature close'))
  })

  return dup
}

module.exports = build