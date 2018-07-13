<img
  src="https://rawgithub.com/kube/vscode-clang-complete/master/logo.svg"
  width=200px>

# VSCode ClangComplete
### Visual Studio Code C/C++ completion and diagnostics using Clang

> ## Important Note
>
> This minimal extension was done when the VSCode Language Server protocol was released, and does not require anything else than `clang` installed.
>
> Though, [LSP has now been standardized by Microsoft](https://microsoft.github.io/language-server-protocol/), and the **LLVM team** created their own implementation, named [`clangd`](https://clang.llvm.org/extra/clangd.html), which also has an [associated VSCode extension](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd).

## Install

Launch Quick Open (`⌘`+`P`) and enter

```
ext install ClangComplete
```

## Setup

You need to have Clang installed, and accessible via your path.

### Compiler flags

Optional flags for Clang can be defined in a `.clang_complete` file at the *root path*  of the project :

```
 -DDEBUG
 -include ../config.h
 -I../include
```

## Development

Start the development script:

```
yarn dev
```

### Debug

Start the `Client + Server` debug configuration from the Debug Panel.
