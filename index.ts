const meow = require("meow");
const parser = require("./src/schema");

// TODO: Replace meow with commander: https://github.com/tj/commander.js
const cli = meow(`
  Usage
    $ fbagen <files>

  Options
    -o, --output-path       Output generated files to path
    -n, --csharp            Generate C# code

  Examples
    $ fbagen -o GeneratedCode -n Schema.fbs
`, {
        alias: {
            o: 'output-path',
            n: 'csharp',
        },
        string: ["output-path"],
        boolean: ["csharp"],
    });

if (cli.input.length > 0) {
    console.log("files");
    console.log(cli.input);
    console.log("flags");
    console.log(cli.flags);
}
else {
    console.info(cli.help);
}
