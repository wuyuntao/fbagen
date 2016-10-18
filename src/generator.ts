﻿export namespace Generators {

    const upperCamelCase = require('uppercamelcase');

    class GeneratorError extends Error {
    }

    interface StatementList {
        type: string;
        statements: Statement[];
    }

    interface Statement {
        type: string;
    }

    interface NamespaceStatement extends Statement {
        namespace: string;
    }

    interface TypeStatement extends Statement {
        name: string;
        fields: FieldStatement[];
    }

    interface FieldStatement extends Statement {
        name: string;
        fieldType: FieldTypeStatement;
    }

    interface FieldTypeStatement extends Statement {
        name: string;
        isScalar: boolean;
        isArray: boolean;
    }

    interface EnumStatement extends Statement {
        name: string
    }

    export abstract class Generator {
        static STATEMENT_LIST = "statement_list";
        static NAMESPACE_DECL = "namespace_decl";
        static STRUCT_DECL = "struct_decl";
        static TABLE_DECL = "table_decl";
        static ENUM_DECL = "enum_decl";

        protected namespace: string;
        protected types: TypeStatement[];
        protected enums: string[];

        constructor(schema: StatementList) {
            if (schema.type != Generator.STATEMENT_LIST)
                throw new GeneratorError(`Missing '${Generator.STATEMENT_LIST}'`);

            if (schema.statements.length == 0)
                throw new GeneratorError(`Missing statements in '${Generator.STATEMENT_LIST}'`);

            this.findNamespace(schema);
            this.findTypes(schema);
            this.findEnums(schema);
        }

        private findNamespace(schema: StatementList) {
            for (let statement of schema.statements) {
                if (statement.type == Generator.NAMESPACE_DECL) {
                    let nss = <NamespaceStatement>statement;
                    if (this.namespace == null) {
                        this.namespace = nss.namespace;
                        console.info(`Found namespace ${nss.namespace}`);
                    }
                    else
                        throw new GeneratorError(`Duplicate namespace`);
                }
            }
        }

        private findTypes(schema: StatementList) {
            this.types = [];

            for (let statement of schema.statements) {
                if (statement.type == Generator.STRUCT_DECL || statement.type == Generator.TABLE_DECL) {
                    this.types.push(<TypeStatement>statement);
                }
            }
        }

        private findEnums(schema: StatementList) {
            this.enums = [];

            for (let statement of schema.statements) {
                if (statement.type == Generator.ENUM_DECL) {
                    let es = <EnumStatement>statement;
                    this.enums.push(es.name);
                }
            }
        }

        protected isType(typeName: string): boolean {
            return this.types.findIndex(t => t.name == typeName) >= 0;
        }

        protected isEnum(enumName: string): boolean {
            return this.enums.findIndex(e => e == enumName) >= 0;
        }

        public abstract generate(): string;

        public abstract ext(): string;
    }

    export class CSharpGenerator extends Generator {
        constructor(schema) {
            super(schema)
        }

        public generate(): string {
            let code = `// automatically generated by fbagen, do not modify
`;

            code += this.beginNamespace();

            for (let type of this.types) {
                code += this.addType(type);
            }

            code += this.endNamespace();

            return code;
        }

        beginNamespace(): string {
            return `
namespace ${this.namespace}
{
`
        }

        endNamespace(): string {
            return `
}`
        }

        addType(type: TypeStatement): string {
            console.log(JSON.stringify(type));

            let isStruct = type.type == Generator.STRUCT_DECL;
            let code = ``;

            code += this.beginType(type.name, isStruct, true);

            for (let field of type.fields) {
                code += this.addTypeField(field, isStruct, true);
            }

            code += this.endType();

            return code;
        }

        beginType(typeName: string, isStruct: boolean, isMutable: boolean): string {
            return `
    public ${isStruct ? 'struct' : 'class'} ${isMutable ? 'Mutable' : 'Immutable'}${typeName}
    {
`;
        }

        endType(): string {
            return `
    }
`;
        }

        addTypeField(field: FieldStatement, isStruct: boolean, isMutable: boolean): string {
            let fieldType = <FieldTypeStatement>field.fieldType;

            let fieldTypeName: string;
            if (fieldType.isScalar) {
                // C# conversion: ubyte -> byte, byte -> sbyte
                if (fieldType.name == "ubyte")
                    fieldTypeName = "byte";
                else if (fieldType.name == "byte")
                    fieldTypeName = "sbyte";
                else
                    fieldTypeName = fieldType.name;
            } else if (this.isType(fieldType.name)) {
                fieldTypeName = `${isMutable ? 'Mutable' : 'Immutable'}${fieldType.name}`;
            }
            else if (this.isEnum(fieldType.name)) {
                fieldTypeName = fieldType.name;
            }
            else {
                console.warn(`Not implemented yet: ${JSON.stringify(fieldType)}`);
                return '';
            }

            if (fieldType.isArray)
                fieldTypeName += '[]';

            let code = `
        public ${fieldTypeName} ${upperCamelCase(field.name)}`;
            if (isStruct)
                code += `;
`;
            else
                code += ` { get; set; }
`;

            return code;
        }

        public ext(): string {
            return ".cs";
        }
    }
}
