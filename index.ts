import * as fs from "fs";
import * as path from "path";
import * as grammar from "./src/grammar";
import * as generator from "./src/generator";

function main() {
    const meow = require("meow");

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
            let schema = grammar.Grammar.parse(filePath);

            let gens : generator.Generators.CSharpGenerator[] = [];
            if (cli.flags.csharp) {
                gens.push(new generator.Generators.CSharpGenerator(schema));
            }

            if (gens.length == 0)
                throw new Error("No generator is specified");

            for (let gen of gens) {
                let codeFileName = `${path.basename(filePath, ".fbs")}Accessors${gen.ext()}`;
                // console.log("filename: " + codeFileName);
                let codeFilePath = path.join(cli.flags.outputPath, codeFileName);
                let code = gen.generate();

                fs.writeFileSync(codeFilePath, code, { encoding: "utf8", flag: 'w' });
            }
        }
    }
    else {
        console.info(cli.help);
    }
}

main();
