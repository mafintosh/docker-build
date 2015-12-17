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
  registry: conf, // add a registry config
  remove: true, // automatically removes intermediate contaners (defaults to true)
  forceremove: false, // always remove intermediate containers, even if the build fails (defaults to false)
  buildArgs: { foo: 'bar' }, // Set build-time variables
  cpuShares: 0, // CPU shares (relative weight)
  cgroupParent: undefined, // Optional parent cgroup for the container
  cpuPeriod: 0, // Limit the CPU CFS (Completely Fair Scheduler) period
  cpuQuota: 0, // Limit the CPU CFS (Completely Fair Scheduler) quota
  cpusetCpus: 0, // CPUs in which to allow execution (0-3, 0,1)
  cpusetMems: 0, // MEMs in which to allow execution (0-3, 0,1)
  dockerfile: 'Dockerfile', // Name of the Dockerfile
  memory: 0, // Memory limit
  memorySwap: 0, // Total memory (memory + swap), '-1' to disable swap
  pull: false, // Always attempt to pull a newer version of the image
  ulimits: [
    { name: 'core', soft: 0, hard: 0 }, // core file size (blocks)
    { name: 'cpu', soft: 500, hard: 1000 }, // cpu time (seconds)
    { name: 'data', soft: 10240, hard: 20480 }, // data seg size (kbytes)
    { name: 'fsize', soft: 1024, hard: 2048 }, // file size (blocks)
    { name: 'locks', soft: 5, hard: 10 }, // file locks
    { name: 'memlock', soft: 0, hard: 0 }, // locked-in-memory size (kbytes)
    { name: 'msgqueue', soft: 819200, hard: 819400 }, // bytes in POSIX msg queues
    { name: 'nice', soft: 0, hard: 0 }, // max nice
    { name: 'nofile', soft: 1024, hard: 2048 }, // file descriptors
    { name: 'nproc', soft: 63415, hard: 63415 }, // processes
    { name: 'rss', soft: 10240, hard: 20480 }, // resident set size (kbytes)
    { name: 'rtprio', soft: 99, hard: 100 }, // max rt priority
    { name: 'rttime', soft: 15, hard: 20 }, // max rt schedule time (microseconds)
    { name: 'sigpending', soft: 100, hard: 200 }, // queued signals
    { name: 'stack', soft: 8192, hard: 10240 } // maximum stack size (bytes)
  ] // ulimit options
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
