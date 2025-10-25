# pdf-image-wasm

A library for converting PDF to images using WebAssembly.

Inspired of https://github.com/ol-th/pdf-img-convert.js but uses https://github.com/Brooooooklyn/canvas so there's no postinstall.

This is ready for BaaS functions such as Supabase functions.

## Development

- Install dependencies:

```bash
bun i
```

- Run the unit tests:

```bash
bun test
```

- Build the library:

```bash
bun run build
```

- Publish the library

Install [Task](https://taskfile.dev/)

```bash
task publish
```
