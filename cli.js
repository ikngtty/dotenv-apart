#!/usr/bin/env node

const spawn = require('cross-spawn')
const path = require('path')

const argv = require('minimist')(process.argv.slice(2))
const dotenv = require('dotenv')

function printHelp () {
  console.log([
    'Usage: dotenv-apart [--help] [-e <path>] [-c <environment>] [-- command]',
    '  --help              print help',
    '  -c <environment>    support cascading env variables from `.env`, `.env.<environment>` files',
    '  -o, --override      override system variables. Cannot be used along with cascade (-c).',
    '  command             `command` is the actual command you want to run. Best practice is to precede this command with ` -- `. Everything after `--` is considered to be your command. So any flags will not be parsed by this tool but be passed to your command. If you do not do it, this tool will strip those flags'
  ].join('\n'))
}

if (argv.help) {
  printHelp()
  process.exit()
}

const override = argv.o || argv.override

if (argv.c && override) {
  console.error('Invalid arguments. Cascading env variables conflicts with overrides.')
  process.exit(1)
}

// FIXME: `path` module cannot resolve `~`.
const envDirBase = '~/.envs/'

// The current directory is expected to be like '*/github.com/ikngtty/my-project/'.
// In this example, the env files are expected to be in
// '<envDirBase>/github.com/ikngtty/my-project/'.
const currentDir = path.resolve()
const currentDirParts = currentDir.split(path.sep)
if (currentDirParts.length < 4) {
  console.error('The current directory is too shallow for expectations.')
  process.exit(1)
}
const envDir = path.resolve(envDirBase, ...currentDirParts.slice(-3))

let paths = []
paths.push('.env')

if (argv.c) {
  paths = paths.reduce((accumulator, path) => accumulator.concat(
    [`${path}.${argv.c}`, path]
  ), [])
}

paths.forEach(function (env) {
  dotenv.config({ path: path.resolve(envDir, env), override })
})

const command = argv._[0]
if (!command) {
  printHelp()
  process.exit(1)
}

const child = spawn(command, argv._.slice(1), { stdio: 'inherit' })
  .on('exit', function (exitCode, signal) {
    if (typeof exitCode === 'number') {
      process.exit(exitCode)
    } else {
      process.kill(process.pid, signal)
    }
  })

for (const signal of ['SIGINT', 'SIGTERM', 'SIGPIPE', 'SIGHUP', 'SIGBREAK', 'SIGWINCH', 'SIGUSR1', 'SIGUSR2']) {
  process.on(signal, function () {
    child.kill(signal)
  })
}
