/* lexical grammar */

%lex

%%

\s+                                                             /* skip whitespace */
"//".*                                                          /* skip single-line comment */
[/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]                             /* skip multi-line comment */

namespace                                                       return 'NS'
attribute                                                       return 'ATTR'
enum                                                            return 'ENUM'
union                                                           return 'UNION'
struct                                                          return 'STRUCT'
table                                                           return 'TABLE'
root_type                                                       return 'ROOT_TYPE'
file_identifier                                                 return 'FILE_ID'
file_extension                                                  return 'FILE_EXT'

(byte|ubyte|bool|short|ushort|int|uint|float|long|ulong|double|string)      return 'TYPE'
[a-zA-Z_][a-zA-Z0-9_]*                                          return 'SYMBOL'
[\+\-]?[0-9]+                                                   return 'INT'
[\+\-]?[0-9]+\.[0-9]+                                           return 'FLOAT'
(true|false)                                                    return 'BOOL'

";"                                                             return ';'
"."                                                             return '.'
\"                                                              return '"'
":"                                                             return ':'
"{"                                                             return '{'
"}"                                                             return '}'
"="                                                             return '='
","                                                             return ','
"("                                                             return '('
")"                                                             return ')'
"["                                                             return '['
"]"                                                             return ']'
<<EOF>>                                                         return 'EOF'
.                                                               return 'INVALID'

/lex

%start schema

%%
/* schema grammar */

schema
    : statement_list EOF                                        { return $1; }
    ;

statement_list
    : statement_list statement                                  { $$ = { type: 'statement_list', statements: $1.statements.concat($2) }; }
    | statement                                                 { $$ = { type: 'statement_list', statements: [$1] }; }
    ;

statement
    : namespace_decl ';'                                        { $$ = $1; }
    | attribute_decl ';'                                        { $$ = $1; }
    | enum_decl                                                 { $$ = $1; }
    | union_decl                                                { $$ = $1; }
    | struct_decl                                               { $$ = $1; }
    | table_decl                                                { $$ = $1; }
    | root_type_decl ';'                                        { $$ = $1; }
    | file_identifier_decl ';'                                  { $$ = $1; }
    | file_extension_decl ';'                                   { $$ = $1; }
    ;

namespace_decl
    : NS namespace_symbol                                       { $$ = { type: 'namespace_decl', namespace: [$2] }; }
    ;

namespace_symbol
    : SYMBOL                                                    { $$ = $1; }
    | namespace_symbol '.' SYMBOL                               { $$ = '' + $1 + '.' + $3; }
    ;

attribute_decl
    : ATTR '"' SYMBOL '"'                                       { $$ = { type: 'attribute_decl', args: [$3] }; }
    ;

enum_decl
    : ENUM SYMBOL ':' TYPE '{' enum_field_list '}'              { $$ = { type: 'enum_decl', name: $2, enumType: $4, fields: $6 }; }
    ;

enum_field_list
    : enum_field_list ',' enum_field                            { $$ = { type: 'enum_field_list', args: $1.args.concat($3) }; }
    | enum_field                                                { $$ = { type: 'enum_field_list', args: [$1] }; }
    ;

enum_field
    : SYMBOL                                                    { $$ = { type: 'enum_field', args: [$1] }; }
    | SYMBOL '=' INT                                            { $$ = { type: 'enum_field', args: [$1, $3] }; }
    | SYMBOL attribute_list_decl                                { $$ = { type: 'enum_field', args: [$1, null, $2] }; }
    | SYMBOL '=' INT attribute_list_decl                        { $$ = { type: 'enum_field', args: [$1, $3, $4] }; }
    ;

union_decl
    : UNION SYMBOL '{' union_name_list '}'                      { $$ = { type: 'union_decl', args: [$2, $4] }; }
    ;

union_name_list
    : union_name_list ',' SYMBOL                                { $$ = { type: 'union_name_list', args: $1.args.concat($3) }; }
    | SYMBOL                                                    { $$ = { type: 'union_name_list', args: [$1] }; }
    ;

struct_decl
    : STRUCT SYMBOL '{' struct_field_list '}'                   { $$ = { type: 'struct_decl', name: $2, fields: $4.fields }; }
    ;

struct_field_list
    : struct_field_list struct_field                            { $$ = { type: 'struct_field_list', fields: $1.fields.concat($2) }; }
    | struct_field                                              { $$ = { type: 'struct_field_list', fields: [$1] }; }
    ;

struct_field
    : SYMBOL ':' field_type ';'                                 { $$ = { type: 'struct_field', name: $1, fieldType: $3 }; }
    | SYMBOL ':' field_type attribute_list_decl ';'             { $$ = { type: 'struct_field', name: $1, fieldType: $3, attributes: $4 }; }
    ;

table_decl
    : TABLE SYMBOL '{' table_field_list '}'                     { $$ = { type: 'table_decl', name: $2, fields: $4.fields }; }
    ;

table_field_list
    : table_field_list table_field                              { $$ = { type: 'table_field_list', fields: $1.fields.concat($2) }; }
    | table_field                                               { $$ = { type: 'table_field_list', fields: [$1] }; }
    ;

table_field
    : SYMBOL ':' field_type ';'                                     { $$ = { type: 'table_field', name: $1, fieldType: $3 }; }
    | SYMBOL ':' field_type '=' variable ';'                        { $$ = { type: 'table_field', name: $1, fieldType: $3, defaultValue: $5 }; }
    | SYMBOL ':' field_type attribute_list_decl ';'                 { $$ = { type: 'table_field', name: $1, fieldType: $3, attributes: $4.attributes }; }
    | SYMBOL ':' field_type '=' variable attribute_list_decl ';'    { $$ = { type: 'table_field', name: $1, fieldType: $3, defaultValue: $5, attributes: $6.attributes }; }
    ;

field_type
    : SYMBOL                                                    { $$ = { type: 'field_type', name: $1 }; }
    | TYPE                                                      { $$ = { type: 'field_type', name: $1, isScalar: true }; }
    | '[' field_type ']'                                        { $$ = { type: 'field_type', name: $2.name, isScalar: $2.isScalar, isArray: true }; }
    ;

attribute_list_decl
    : '(' attribute_list ')'                                    { $$ = $2; }
    ;

attribute_list
    : attribute_list ',' attribute_decl                         { $$ = { type: 'attribute_list', attributes: $1.attributes.concat($3) }; }
    | attribute_decl                                            { $$ = { type: 'attribute_list', attributes: [$1] }; }
    ;

attribute_decl
    : SYMBOL ':' variable                                       { $$ = { type: 'attribute_decl', name: $1, value: $3 }; }
    | SYMBOL                                                    { $$ = { type: 'attribute_decl', name: $1 }; }
    ;

variable
    : INT                                                       { $$ = { type: 'variable', args: [$1] }; }
    | FLOAT                                                     { $$ = { type: 'variable', args: [$1] }; }
    | BOOL                                                      { $$ = { type: 'variable', args: [$1] }; }
    | SYMBOL                                                    { $$ = { type: 'variable', args: [$1] }; }
    ;

root_type_decl
    : ROOT_TYPE SYMBOL                                          { $$ = { type: 'root_type_decl', args: [$2] }; }
    ;

file_identifier_decl
    : FILE_ID '"' SYMBOL '"'                                    { $$ = { type: 'file_identifier_decl', args: [$3] }; }
    ;

file_extension_decl
    : FILE_EXT '"' SYMBOL '"'                                   { $$ = { type: 'file_extension_decl', args: [$3] }; }
    ;
