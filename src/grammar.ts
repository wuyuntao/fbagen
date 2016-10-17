const Parser = require("jison").Parser;

const o = function (str) {

};

const grammar = {
    "lex": {
        "rules": [
            ["\\s+", "/* skip whitespace */"],
            ["[a-f0-9]+", "return 'HEX';"],
        ],
    },

    "bnf": {
        "root": [
            ["statement_list", "return $1"],
        ],

        "statement_list": [
            o("statement_list statement"),
            o("statement"),
        ],
    }
};

exports.parser = new Parser(grammar);

console.log(exports.parser.generate());
