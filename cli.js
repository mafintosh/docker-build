#!/usr/bin/env node

var build = require('./')
var minimist = require('minimist')
var tstream = require('tar-stream')
var tar = require('tar-fs')
var concat = require('concat-stream')

var argv = minimist(process.argv, {
  boolean: ['cache', 'version'],
  alias: {
    tag: 't',
    quiet: 'q',
    version: 'v',
    host: 'H'
  },
  default: {
    cache: true
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
    '  --host,    -H   [docker-host]\n'+
    '  --quiet,   -q\n'+
    '  --version, -v\n'+
    '  --no-cache\n'
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
  quiet: argv.quiet
}

var input = function() {
  if (path !== '-') return tar.pack(path)

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