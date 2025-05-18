# dotenv-apart

## Installing

```bash
$ npm install -g github:ikngty/dotenv-apart
```

## Usage

```bash
$ dotenv-apart -- <command with arguments>
```

This will load the variables from the .env file in the directory under `~/.envs` and then run the command (using the new set of environment variables).

The .env file is expected to be in the corresponding directory to the current one.
If the current one is `~/Projects/src/github.com/ikngtty/my-project`, the .env file is `~/.envs/github.com/ikngtty/my-project/.env`.
(This location rule of the project directory is Golang's legacy rule and [ghq](https://github.com/x-motemen/ghq)'s one.)

Alternatively, if you do not need to pass arguments to the command, you can use the shorthand:

```bash
$ dotenv-apart <command>
```

### Edit `.env` file
The expected `.env` path can be shown by `-p` flag:

```bash
$ dotenv-apart -p
```

You can use this with other commands to create or edit `.env`.
For example, to create:

```bash
$ touch "$(dotenv-apart -p)"
```

or to edit:

```bash
$ open "$(dotenv-apart -p)"
```

etc.

### Cascading env variables
Some applications load from `.env` and `.env.development`
(see [#37](https://github.com/entropitor/dotenv-cli/issues/37) for more information).
`dotenv-apart` supports this using `-c development` for `.env` and `.env.development`.

### Flags to the underlying command
If you want to pass flags to the inner command use `--` after all the flags to `dotenv-apart`.

E.g. the following command without dotenv-apart:
```bash
mvn exec:java -Dexec.args="-g -f"
```

will become the following command with dotenv-apart:
```bash
$ dotenv-apart -- mvn exec:java -Dexec.args="-g -f"
```

### Variable expansion in the command

If your `.env` file looks like:

```
SAY_HI=hello!
```

you might expect `dotenv-apart echo "$SAY_HI"` to display `hello!`. In fact, this is not what happens: your shell will first interpret your command before passing it to `dotenv-apart`, so if `SAY_HI` envvar is set to `""`, the command will be expanded into `dotenv-apart echo`: that's why `dotenv-apart` cannot make the expansion you expect.

#### Possible solutions

1. Bash and escape

One possible way to get the desired result is:

```
$ dotenv-apart -- bash -c 'echo "$SAY_HI"'
```

In bash, everything between `'` is not interpreted but passed as is. Since `$SAY_HI` is inside `''` brackets, it's passed as a string literal.

Therefore, `dotenv-apart` will start a child process `bash -c 'echo "$SAY_HI"'` with the env variable `SAY_HI` set correctly which means bash will run `echo "$SAY_HI"` in the right environment which will print correctly `hello`

2. Subscript encapsulation

Another solution is simply to encapsulate your script in another subscript.

Example here with npm scripts in a package.json

```json
{
  "scripts": {
    "_print-stuff": "echo $STUFF",
    "print-stuff": "dotenv-apart -- npm run _print-stuff",
  }
}
```

This example is used in a project setting (has a package.json).  Should always install locally `npm install -D dotenv-apart`

### Override

Override any environment variables that have already been set on your machine with values from your .env file.

```bash
dotenv-apart -o -- jest
```

## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)
