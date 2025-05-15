#!/usr/bin/env node

const spawn = require('cross-spawn')
const path = require('path')

const argv = require('minimist')(process.argv.slice(2))
const dotenv = require('dotenv')

function printHelp () {
  console.log([
    'Usage: dotenv-apart [--help] [-e <path>] [-v <name>=<value>] [-c [environment]] [-- command]',
    '  --help              print help',
    '  -e <path>           parses the file <path> as a `.env` file and adds the variables to the environment',
    '  -e <path>           multiple -e flags are allowed',
    '  -v <name>=<value>   put variable <name> into environment using value <value>',
    '  -v <name>=<value>   multiple -v flags are allowed',
    '  -c [environment]    support cascading env variables from `.env`, `.env.<environment>`, `.env.local`, `.env.<environment>.local` files',
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

let paths = []
if (argv.e) {
  if (typeof argv.e === 'string') {
    paths.push(argv.e)
  } else {
    paths.push(...argv.e)
  }
} else {
  paths.push('.env')
}

if (argv.c) {
  paths = paths.reduce((accumulator, path) => accumulator.concat(
    typeof argv.c === 'string'
      ? [`${path}.${argv.c}.local`, `${path}.local`, `${path}.${argv.c}`, path]
      : [`${path}.local`, path]
  ), [])
}

function validateCmdVariable (param) {
  const [, key, val] = param.match(/^(\w+)=([\s\S]+)$/m) || []
  if (!key || !val) {
    console.error(`Invalid variable name. Expected variable in format '-v variable=value', but got: \`-v ${param}\`.`)
    process.exit(1)
  }

  return [key, val]
}
const variables = []
if (argv.v) {
  if (typeof argv.v === 'string') {
    variables.push(validateCmdVariable(argv.v))
  } else {
    variables.push(...argv.v.map(validateCmdVariable))
  }
}
const parsedVariables = Object.fromEntries(variables)

paths.forEach(function (env) {
  dotenv.config({ path: path.resolve(env), override })
})

Object.assign(process.env, parsedVariables)

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
