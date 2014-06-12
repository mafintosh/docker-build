#!/usr/bin/env node

var build = require('./')
var minimist = require('minimist')
var tar = require('tar-fs')

var argv = minimist(process.argv, {
  boolean: ['cache', 'version'],
  alias: {
    remote: 'r',
    tag: 't',
    help: 'h',
    quiet: 'q',
    version: 'v'
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

tar.pack(argv._[2] || '.')
  .on('error', onerror)
  .pipe(build(argv.remote, argv))
  .on('error', onerror)
  .pipe(process.stdout)