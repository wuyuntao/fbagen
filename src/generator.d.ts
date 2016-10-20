export declare namespace Generators {
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
    abstract class Generator {
        static STATEMENT_LIST: string;
        static NAMESPACE_DECL: string;
        static STRUCT_DECL: string;
        static TABLE_DECL: string;
        static ENUM_DECL: string;
        protected namespace: string;
        protected types: TypeStatement[];
        protected enums: string[];
        constructor(schema: StatementList);
        private findNamespace(schema);
        private findTypes(schema);
        private findEnums(schema);
        protected isType(typeName: string): boolean;
        protected isEnum(enumName: string): boolean;
        abstract generate(): string;
        abstract ext(): string;
    }
    class CSharpGenerator extends Generator {
        constructor(schema: StatementList);
        generate(): string;
        beginNamespace(suffix: string): string;
        endNamespace(): string;
        addAccessor(type: TypeStatement, isMutable: boolean): string;
        beginType(typeName: string, isStruct: boolean, isMutable: boolean): string;
        endType(): string;
        addTypeField(field: FieldStatement, isStruct: boolean, isMutable: boolean): string;
        getFieldTypeName(field: FieldStatement): string;
        isList(field: FieldStatement): boolean;
        addAccessorConstructor(type: TypeStatement): string;
        addSerializer(type: TypeStatement): string;
        beginSerializer(typeName: string, isMutable: boolean): string;
        addSerializeMethod(type: TypeStatement, isMutable: boolean): string;
        addGetRootAsMethod(type: TypeStatement, isMutable: boolean): string;
        addDeserializeMethod(type: TypeStatement, isMutable: boolean): string;
        endSerializer(): string;
        getTypeName(typeName: string, withNamespace: boolean): string;
        getAccessorName(typeName: string, isMutable: boolean, withNamespace: boolean): string;
        getSerializerName(typeName: string, withNamespace: boolean): string;
        isDeprecatedField(field: FieldStatement): boolean;
        isStruct(type: TypeStatement): boolean;
        ext(): string;
    }
}
