function loadParser() {
    const fs = require("fs");
    const jison = require("jison");
    const path = require("path");

    const grammar = fs.readFileSync(`${__dirname}/grammar.jison`, "utf8");

    return new jison.Parser(grammar);
}

exports.parser = loadParser();
