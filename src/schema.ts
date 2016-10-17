const Parser = require("jison").Parser;

const grammar = {
    "lex": {
        "rules": [
            ["\\s+", "/* skip whitespace */"],
            ["[a-f0-9]+", "return 'HEX';"],
        ],
    },

    "bnf": {
        "hex_strings": ["hex_strings HEX", "HEX"]
    }
};

module.exports = new Parser(grammar);

console.log(module.exports.generate());
