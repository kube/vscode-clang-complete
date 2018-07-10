<img
  src="https://rawgithub.com/kube/vscode-clang-complete/master/logo.svg"
  width=200px>

# VSCode ClangComplete
### Visual Studio Code C/C++ completion using Clang

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
