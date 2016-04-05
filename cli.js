#!/usr/bin/env node

var build = require('./')
var minimist = require('minimist')
var tstream = require('tar-stream')
var tar = require('tar-fs')
var concat = require('concat-stream')
var ignore = require('ignore-file')

var join = function(a, b) {
  if (!a) return b
  if (!b) return a
  return function(filename) {
    return a(filename) || b(filename)
  }
}

var argv = minimist(process.argv, {
  boolean: ['cache', 'version'],
  alias: {
    tag: 't',
    quiet: 'q',
    version: 'v',
    host: 'H'
  },
  default: {
    cache: true,
    'api-version': 'v1.22'
  }
})

var tag = argv._[2]
var path = argv._[3] || '.'

if (argv.version) {
  console.log(require('./package').version)
  process.exit(0)
}

if (argv.help || !tag) {
  console.error(
    'Usage: docker-build [tag] [path?] [options]\n'+
    '\n'+
    '  --host,        -H   [docker-host]\n'+
    '  --quiet,       -q\n'+
    '  --version,     -v\n'+
    '  --api-version       [api version (v1.22)]\n'+
    '  --no-cache\n'+
    '  --no-ignore\n'
  )
  process.exit(1)
}

var onerror = function(err) {
  console.error(err.message)
  process.exit(2)
}

var opts = {
  host: argv.host,
  cache: argv.cache,
  quiet: argv.quiet,
  version: argv['api-version']
}

var input = function() {
  if (path !== '-') {
    var filter = ignore.sync('.dockerignore') || join(ignore.compile('.git'), ignore.sync('.gitignore'))
    if (argv.ignore === false) filter = null
    return tar.pack(path, {ignore:filter})
  }

  var pack = tstream.pack()

  process.stdin.pipe(concat(function(data) {
    pack.entry({name:'Dockerfile', type:'file'}, data)
    pack.finalize()
  }))

  return pack
}

input()
  .on('error', onerror)
  .pipe(build(tag, opts))
  .on('error', onerror)
  .pipe(process.stdout)
