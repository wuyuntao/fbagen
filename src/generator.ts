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
        attributes: AttributeStatement[];
    }

    interface FieldTypeStatement extends Statement {
        name: string;
        isScalar: boolean;
        isArray: boolean;
    }

    interface EnumStatement extends Statement {
        name: string;
    }

    interface AttributeStatement extends Statement {
        name: string;
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
                        //console.info(`Found namespace ${nss.namespace}`);
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
using FlatBuffers;
using FlatBuffers.Schema;
using System;
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
            //console.log(JSON.stringify(type));

            let isStruct = this.isStruct(type);
            let code = ``;

            code += this.beginType(type.name, isStruct, true);

            for (let field of type.fields) {
                if (!this.isDeprecatedField(field)) {
                    code += this.addTypeField(field, isStruct, true);
                }
            }

            code += this.endType();

            code += this.beginSerializer(type.name, true);

            code += this.addSerializeMethod(type, true);
            code += this.addGetRootAsMethod(type, true);
            code += this.addDeserializeMethod(type, true);

            code += this.endSerializer();

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
                return `
        // ${fieldType.name} ${field.name} is not implemented yet
`;
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

        beginSerializer(typeName: string, isMutable: boolean): string {
            let accessorName = this.getAccessorName(typeName, isMutable);
            let serializerName = this.getSerializerName(typeName);
            return `
    public class ${serializerName} : FlatBufferSerializer<${accessorName}, ${typeName}>
    {
        public static readonly ${serializerName} Instance = new ${serializerName}();
`;
        }

        addSerializeMethod(type: TypeStatement, isMutable: boolean): string {
            let accessorName = this.getAccessorName(type.name, isMutable);
            let code = `
        public override Offset<${type.name}> Serialize(FlatBufferBuilder fbb, ${accessorName} obj)
        {
`;
            if (this.isStruct(type))
            {
                code += `            return ${type.name}.Create${type.name}(fbb`;
                for(let field of type.fields) {
                    let fieldName = upperCamelCase(field.name);
                    code += `, obj.${fieldName}`;
                }
                code += `);`;
            } else {
                code += `            ${type.name}.Start${type.name}(fbb);
`;

                for(let field of type.fields) {
                    if(this.isDeprecatedField(field))
                        continue;

                    let fieldName = upperCamelCase(field.name);

                    if(field.fieldType.isArray) {
                        if (field.fieldType.name == "string") {
                            code += `            ${type.name}.Add${fieldName}(fbb, ${type.name}.Create${fieldName}Vector(fbb, SerializeString(fbb, obj.${fieldName})));
`;
                        } else if (field.fieldType.isScalar || this.isEnum(field.fieldType.name)) {
                            code += `            ${type.name}.Add${fieldName}(fbb, ${type.name}.Create${fieldName}Vector(fbb, obj.${fieldName}));
`;
                        } else if (this.isType(field.fieldType.name)) {
                            code += `            ${type.name}.Add${fieldName}(fbb, ${type.name}.Create${fieldName}Vector(fbb, ${field.fieldType.name}Serializer.Instance.Serialize(fbb, obj.${fieldName})));
`;
                        } else {
                            code += `            // ${field.fieldType.name} ${fieldName} is not implemented yet
`;
                        }
                    } else {
                        if (field.fieldType.name == "string") {
                            code += `            if (!string.IsNullOrEmpty(obj.${fieldName}))
                 ${type.name}.Add${fieldName}(fbb, fbb.CreateString(obj.${fieldName}));
`;
                        } else if (field.fieldType.isScalar || this.isEnum(field.fieldType.name)) {
                            code += `            ${type.name}.Add${fieldName}(fbb, obj.${fieldName});
`;
                        } else if (this.isType(field.fieldType.name)) {
                            code += `            ${type.name}.Add${fieldName}(fbb, ${field.fieldType.name}Serializer.Instance.Serialize(fbb, obj.${fieldName}));
`;
                        } else {
                            code += `            // ${field.fieldType.name} ${fieldName} is not implemented yet
`;
                        }
                    }
                }

                code += `            return ${type.name}.End${type.name}(fbb);
`;
            }


            code += `
        }
`;

            return code;
        }

        addGetRootAsMethod(type: TypeStatement, isMutable: boolean): string {
            let accessorName = this.getAccessorName(type.name, isMutable);
            let code = `
        protected override ${type.name} GetRootAs(ByteBuffer buffer)
        {
`;

            if (this.isStruct(type))
                code += `            throw new NotImplementedException();`;
            else
                code += `            return ${type.name}.GetRootAs${type.name}(buffer);`;

            code += `
        }
`;
            return code;
        }

        addDeserializeMethod(type: TypeStatement, isMutable: boolean): string {
            let accessorName = this.getAccessorName(type.name, isMutable);
            let code = `
        public override ${accessorName} Deserialize(${type.name} obj)
        {
`;

            code += `            var accessor = new ${accessorName}();
`;

            for(let field of type.fields) {
                if (this.isDeprecatedField(field)) {
                    continue;
                }

                let fieldName = upperCamelCase(field.name);
                if (field.fieldType.isArray) {
                     if(field.fieldType.isScalar || this.isEnum(field.fieldType.name)) {
                         code += `            accessor.${fieldName} = DeserializeScalar(obj.${fieldName}Length, obj.${fieldName});
`;
                     } else {
                         code += `            accessor.${fieldName} = ${this.getSerializerName(field.fieldType.name)}.Instance.Deserialize(obj.${fieldName}Length, obj.${fieldName});
`;
                     }
                }
                else {
                    if(field.fieldType.isScalar || this.isEnum(field.fieldType.name)) {
                        code += `            accessor.${fieldName} = obj.${fieldName};
`;
                    } else if (this.isType(field.fieldType.name)) {
                        code += `            accessor.${fieldName} = ${this.getSerializerName(field.fieldType.name)}.Instance.Deserialize(obj.${fieldName});
`;
                    } else {
                        code += `            // ${field.fieldType.name} ${fieldName} is not implemented yet
`;
                    }
                }
            }

            code += `            return accessor;
        }
`;
            return code;
        }

        endSerializer(): string {
            return `
    }
`;
        }

        getAccessorName(typeName: string, isMutable: boolean): string {
             return `${isMutable ? 'Mutable': 'Immutable'}${typeName}`;
        }

        getSerializerName(typeName: string): string {
             return `${typeName}Serializer`;
        }

        isDeprecatedField(field: FieldStatement): boolean {
            return field.attributes != null && field.attributes.findIndex(a => a.name == "deprecated") >= 0;
        }

        isStruct(type: TypeStatement): boolean {
            return type.type == Generator.STRUCT_DECL;
        }

        public ext(): string {
            return ".cs";
        }
    }
}
