# fbagen

[fbagen](https://github.com/wuyuntao/fbagen) generates object-based accessor code from [FlatBuffers](https://google.github.io/flatbuffers/) schema. Currently fbagen only generate C# code, support of Java / JavaScript is comming soon.

## Motivation

While FlatBuffers provides a performance boost on accessing serialized data, it is a little bit of pain to handwrite serialization code for every message. Especially in the prototype stage, schema changes a lot and serialization code have to be adopted.

fbagen parses FlatBuffers schema with [Jison](https://github.com/zaach/jison) and generates traditional object-based, read-only accessors and serializers for FlatBuffer `struct` or `table`.

## Usage

### Install from NPM

```bash
$ npm install fbagen
$ node_modules/.bin/fbagen -n -o /path/to/accessors /path/to/flatbuffer/schema
```

### Clone from Github
```bash
$ git clone https://github.com/wuyuntao/fbagen.git
$ cd fbagen
$ node index.js -n -o /path/to/accessors /path/to/flatbuffer/schema
```

### Command-line options
```bash
$ node index.js --help

  Generate object-based C# accessor code from FlatBuffer schema

  Usage
    $ fbagen <files>

  Options
    -o, --output-path       Output generated files to path
    -n, --csharp            Generate C# code

  Examples
    $ fbagen -o GeneratedCode -n Schema.fbs
```

### Extra schema attributes

fbagen provides several attributes to customize code generation.

* `use_list`: When this attribute is added to a `Vector` type, fbagen will use `List<T>` as field type instead of `Array`.

## Generated code style

You can find a sample [schema](https://github.com/wuyuntao/fbagen/blob/master/examples/FbagenDemo/Schema.fbs) and [accessors](https://github.com/wuyuntao/fbagen/blob/master/examples/FbagenDemo/SchemaAccessors.cs) here.

## Todo-list

* Support `union` syntax
* Support `include` syntax
* Add accessor generation for Java / JavaScript