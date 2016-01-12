# vscode-clang-complete
###Visual Studio Code C/C++ completion using Clang

##Setup

At the moment the completion only works for C.<br>
You need to have Clang installed, and accessible via your path.

####Compiler flags

Optional flags for Clang can be defined in a `.clang_complete` file at the *root path*  of the project :

```
    -DDEBUG
    -include ../config.h
    -I../include
```

##Next

- C++/ObjC support
- Precompiled Headers
- Better completion, even when typing in already started token.
- Completion of functions parameters
- Type-check on Hover
- Linter
