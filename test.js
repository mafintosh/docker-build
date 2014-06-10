var tape = require('tape')
var http = require('http')
var path = require('path')
var concat = require('concat-stream')
var fs = require('fs')
var build = require('./')

var server = http.createServer(function(req, res) { // fakish docker thing
  req.resume()
  req.on('end', function() {
    if (req.url.indexOf('parse-error') > -1) {
      res.statusCode = 500
      res.write('bad thing')
      res.end()
      return
    }
    if (req.url.indexOf('stream-error') > -1) {
      res.write(JSON.stringify({stream:'hello'}))
      res.write(JSON.stringify({error:'test'}))
      res.end()
      return
    }
    res.write(JSON.stringify({stream:'hello'}))
    res.write(JSON.stringify({stream:' world'}))
    res.end()
  })
})

server.listen(0, function() {
  server.unref()

  var remote = ':'+server.address().port

  tape('output', function(t) {
    var img = build(remote)

    img.write('i am a tar file')
    img.end()

    img.pipe(concat(function(data) {
      t.same(data.toString(), 'hello world')
      t.end()
    }))
  })

  tape('parse error', function(t) {
    var img = build(remote, {
      tag: 'parse-error'
    })

    img.write('i am a tar file')
    img.end()

    img.on('error', function(err) {
      t.ok(err)
      t.same(err.message, 'bad thing')
      t.end()
    })
  })

  tape('stream error', function(t) {
    t.plan(2)

    var img = build(remote, {
      tag: 'stream-error'
    })

    img.write('i am a tar file')
    img.end()

    img.on('data', function(data) {
      t.same(data.toString(), 'hello')
    })
    img.on('error', function(err) {
      t.same(err.message, 'test')
      t.end()
    })
  })
})
