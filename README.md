# docker-build

Docker build as a duplex stream. Pipe in a tar stream and pipe out the build output

``` js
npm install docker-build
```

[![build status](http://img.shields.io/travis/mafintosh/docker-build.svg?style=flat)](http://travis-ci.org/mafintosh/docker-build)

## Usage

``` js
var build = require('docker-build')
var fs = require('fs')

fs.createReadStream('a-tar-file-with-a-dockerfile.tar')
  .pipe(build('my-new-image'))
  .pipe(process.stdout)
```

The above example will build a docker image from the input tarball
and pipe the build output to stdout using docker running locally on port 2375.

## API

``` js
var stream = build(tag, [options])
```

`options` can contain the following:

``` js
{
  host: '/var/run/docker.sock', // host to docker
  cache: true, // whether or not to use docker fs cache (defaults to true)
  quiet: false, // be quiet - defaults to false,
  registry: conf // add a registry config
}
```

## CLI

There is a command line too available as well

```
$ npm install -g docker-build
$ docker-build --help
```

Running `docker-build some-image-tag` will build current working directory

## License

MIT