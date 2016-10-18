const Parser = require("jison").Parser;

const o = function (pattern: String) {
    let code = `$$ = {
        type: '${pattern}',
        args: [`;

    var args = pattern.split(/\s+/);

    for (let i = 1; i <= args.length; i++) {
        code += `$${i},`;
    }

    code += `],
    };`;

    return [pattern, code];
};

const grammar = {
    "lex": {
        "rules": [
            ["\s+", "/* skip whitespace */"],
            ["namespace", "return 'NS'"],
            ["attribute", "return 'ATTR'"],
            ["include", "return 'INCLUDE'"],
            ["enum", "return 'ENUM'"],
            ["union", "return 'UNION'"],
            ["struct", "return 'STRUCT'"],
            ["table", "return 'TABLE'"],
            ["root_type", "return 'ROOT_TYPE'"],
            ["file_identifier", "return 'FILE_ID'"],
            ["file_extension", "return 'FILE_EXT'"],
            ["(byte|ubyte|bool|short|ushort|int|uint|float|long|ulong|double)", "return 'TYPE'"],
            ["[+-]?[0-9]+", "return 'INT'"],
            ["[+-]?[0-9]+(\.[0-9]+)?", "return 'FLOAT'"],
            ["[a-zA-Z][a-zA-Z0-9_]*", "return 'SYMBOL'"],
            ["[\"\']", "return '\"'"],
            [":", "return ':'"],
            [";", "return ';'"],
            ["=", "return '='"],
            ["(", "return '('"],
            [")", "return ')'"],
            ["{", "return '{'"],
            ["}", "return '}'"],
            ["<<EOF>>", "return 'EOF'"],
            [".", "return 'INVALID'"],
        ],
    },

    "bnf": {
        "start": [
            ["statement_list EOF", "return $1"],
        ],

        "statement_list": [
            o("statement_list statement"),
            o("statement"),
        ],
    }
};

exports.parser = new Parser(grammar);

//console.log(exports.parser.generate());
