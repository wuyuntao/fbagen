﻿export namespace Grammar {

    export function parse(filePath: string) {
        const fs = require("fs");
        const jison = require("jison");
        const path = require("path");
        const grammar = fs.readFileSync(`${__dirname}/grammar.jison`, "utf8");
        const parser = new jison.Parser(grammar);

        let file = fs.readFileSync(filePath, "utf8");
        let ast = parser.parse(file);

        return ast;
    }

}
