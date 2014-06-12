#!/usr/bin/env node

var build = require('./')
var minimist = require('minimist')
var tar = require('tar-fs')

var argv = minimist(process.argv, {
  boolean: 'cache',
  alias: {
    remote: 'r',
    tag: 't',
    help: 'h'
  }
})

if (argv.help) {
  console.error(
    'docker-build [folder?] [options]\n'+
    ' --remote, -r  [docker-host]\n'+
    ' --tag,    -t  [tag]\n'+
    ' --no-cache\n'
  )
  process.exit(1)
}

var onerror = function(err) {
  console.error(err.message)
  process.exit(2)
}

tar.pack(argv._[2] || '.').on('error', onerror).pipe(build(argv.remote, argv)).on('error', onerror)