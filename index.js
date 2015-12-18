var docker = require('docker-remote-api')
var throughJSON = require('through-json')
var duplexify = require('duplexify')

var build = function(tag, opts) {
  if (!opts) opts = {}

  var dup = duplexify()
  var request = opts.request || docker(opts.host)

  var qs = {}
  qs.t = tag

  if (opts.cache === false) qs.nocache = 'true'
  if (opts.quiet) qs.q = 'true'
  if (opts.remove === false) qs.rm = 'false'
  if (opts.forceremove) qs.forcerm = 'true'
  if (opts.buildArgs)  qs.buildargs = JSON.stringify(opts.buildArgs)
  if (opts.cpuShares) qs.cpushares = opts.cpuShares
  if (opts.cgroupParent) qs.cgroupparent = opts.cgroupParent
  if (opts.cpuPeriod) qs.cpuperiod = opts.cpuPeriod
  if (opts.cpuQuota) qs.cpuquota = opts.cpuQuota
  if (opts.cpusetCpus) qs.cpusetcpus = opts.cpusetCpus
  if (opts.cpusetMems) qs.cpusetmems = opts.cpusetMems
  if (opts.dockerfile) qs.dockerfile = opts.dockerfile
  if (opts.memory) qs.memory = opts.memory
  if (opts.memorySwap) qs.memswap = opts.memorySwap
  if (opts.pull) qs.pull = '1'
  if (opts.ulimits) qs.ulimits = JSON.stringify(opts.ulimits)

  var onerror = function(err) {
    dup.destroy(err || new Error('Premature close'))
  }

  var post = request.post('/build', {
    qs: qs,
    version: opts.version || 'v1.15',
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
