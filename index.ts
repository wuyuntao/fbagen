const meow = require("meow");
const parser = require("./src/grammar").parser;
const fs = require("fs");

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
    for (let filePath of cli.input) {
        console.log(`Read file from '${filePath}'`);
        let file = fs.readFileSync(filePath, "utf8");

        console.log("Parse ast");
        let ast = parser.parse(file);
        console.log(JSON.stringify(ast));
    }
}
else {
    console.info(cli.help);
}
