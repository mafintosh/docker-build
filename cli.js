#!/usr/bin/env node

var build = require('./')
var minimist = require('minimist')
var tarfs = require('tar-fs')
var tarstream = require('tar-stream')
var concat = require('concat-stream')

var argv = minimist(process.argv, {
  boolean: ['cache', 'version'],
  alias: {
    remote: 'r',
    tag: 't',
    help: 'h',
    quiet: 'q',
    version: 'v'
  },
  default: {
    cache: true
  }
})

if (argv.help) {
  console.error(
    'Usage: docker-build [folder?] [options]\n'+
    '\n'+
    '  --remote,  -r  [docker-host]\n'+
    '  --tag,     -t  [tag]\n'+
    '  --quiet,   -q\n'+
    '  --version, -v\n'+
    '  --no-cache\n'
  )
  process.exit(1)
}

if (argv.version) {
  console.log(require('./package').version)
  process.exit(0)
}

var onerror = function(err) {
  console.error(err.message)
  process.exit(2)
}

var path = argv._[2] || '.'

var input = function() {
  if (path !== '-') return tarfs.pack(path)

  var pack = tarstream.pack()

  process.stdin.pipe(concat(function(data) {
    pack.entry({name:'Dockerfile', type:'file'}, data)
    pack.finalize()
  }))

  return pack
}

input()
  .on('error', onerror)
  .pipe(build(argv.remote, argv))
  .on('error', onerror)
  .pipe(process.stdout)