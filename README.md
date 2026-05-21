# Zentui

A Starship-inspired statusline and Opencode-style TUI for [Pi](https://pi.dev).

## Screenshots

![Zentui](https://raw.githubusercontent.com/lmilojevicc/pi-zentui/main/assets/zentui.png)

## What is this?

Zentui brings two popular aesthetics to Pi:

- **[Starship](https://starship.rs/) footer** — shows your current directory, git branch, git status indicators, and runtime/version detection in a compact, icon-rich format
- **[Opencode](https://github.com/opencode-ai/opencode) editor** — clean bordered input box with accent rail and model/provider display inside the editor frame

## Features

### Footer (Starship-inspired)

- `󰝰 dirname` — current directory with icon
- `on  branch` — git branch with icon
- `[!?↑]` — git status indicators (modified, untracked, ahead/behind, stashed, etc.)
- `via  v5.5.0` — runtime detection with version and Starship-style Nerd Font runtime/language modules
- Right side shows context usage, token counts, and cost

### Editor (Opencode-inspired)

- Bordered input box with theme accent rail and thinking-level border color
- Model name and provider displayed inside the editor frame
- Thinking level indicator when enabled
- Prompt-box-style user messages matching the ZentUI input chrome

### Git Status Icons

| Icon | Meaning    |
| ---- | ---------- |
| `!`  | Modified   |
| `?`  | Untracked  |
| `+`  | Staged     |
| `✘`  | Deleted    |
| `»`  | Renamed    |
| `=`  | Conflicted |
| `$`  | Stashed    |
| `↑`  | Ahead      |
| `↓`  | Behind     |
| `⇕`  | Diverged   |

### Runtime Detection

Detects Starship Nerd Font runtime/language modules, uses the Starship Nerd Font symbols, and keeps Starship-style defaults such as `bold green` for Node.js. By default Zentui maps those styles through your active Pi theme; switch the Starship/footer color source to `terminal` in `/zentui` if you want your terminal colorscheme to supply the exact ANSI colors.

| Runtime/language | Detection examples                                           |
| ---------------- | ------------------------------------------------------------ |
| Buf              | `buf.yaml`, `buf.gen.yaml`, `buf.work.yaml`                  |
| Bun              | `bun.lock`, `bun.lockb`                                      |
| C                | `.c`, `.h` files                                             |
| C++              | `.cpp`, `.cc`, `.cxx`, `.hpp` files                          |
| CMake            | `CMakeLists.txt`, `CMakeCache.txt`                           |
| COBOL            | `.cbl`, `.cob` files                                         |
| Conda            | `CONDA_DEFAULT_ENV` environment                              |
| Crystal          | `.cr` files, `shard.yml`                                     |
| Dart             | `.dart` files, `pubspec.yaml`, `.dart_tool/`                 |
| Deno             | `deno.json`, `deno.jsonc`, `deno.lock`                       |
| .NET             | `.csproj`, `.fsproj`, `global.json`, `Directory.Build.*`     |
| Elixir           | `mix.exs`                                                    |
| Elm              | `.elm` files, `elm.json`, `elm-stuff/`                       |
| Erlang           | `rebar.config`, `erlang.mk`                                  |
| Fennel           | `.fnl` files                                                 |
| Fortran          | `.f`, `.f90`, `.f95`, `.f03`, `.f08`, `.f18`, `fpm.toml`     |
| Gleam            | `.gleam` files, `gleam.toml`                                 |
| Go               | `go.mod`                                                     |
| Gradle           | `build.gradle`, `build.gradle.kts`, `gradle/`                |
| Guix shell       | `GUIX_ENVIRONMENT` environment                               |
| Haskell          | `.hs`, `.cabal`, `stack.yaml`, `cabal.project`               |
| Haxe             | `.hx`, `.hxml`, `haxelib.json`, `.haxerc`                    |
| Helm             | `helmfile.yaml`, `Chart.yaml`                                |
| Java             | `.java-version`                                              |
| Julia            | `.jl` files, `Project.toml`, `Manifest.toml`                 |
| Kotlin           | `.kt`, `.kts` files                                          |
| Lua              | `.lua` files, `stylua.toml`, `.luarc.json`, `lua/` dir       |
| Maven            | `pom.xml`                                                    |
| Meson            | `MESON_DEVENV=1` and `MESON_PROJECT_NAME` environment        |
| Mojo             | `.mojo` files                                                |
| Nim              | `.nim`, `.nims`, `.nimble`, `nim.cfg`                        |
| Nix shell        | `IN_NIX_SHELL=pure` or `IN_NIX_SHELL=impure` environment     |
| Node.js          | `package.json`, `.nvmrc`, `.node-version`                    |
| OCaml            | `.opam`, `.ml`, `.mli`, `dune`, `_opam/`, `esy.lock/`        |
| Odin             | `.odin` files                                                |
| OPA/Rego         | `.rego` files                                                |
| Perl             | `.pl`, `.pm`, `Makefile.PL`, `cpanfile`, `META.*`            |
| PHP              | `composer.json`                                              |
| Pixi             | `pixi.toml`, `pixi.lock`, `PIXI_ENVIRONMENT_NAME` environment |
| Pulumi           | `Pulumi.yaml`, `Pulumi.yml`                                  |
| PureScript       | `.purs` files, `spago.dhall`, `spago.yaml`, `spago.lock`     |
| Python           | `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`  |
| R                | `.R`, `.Rmd`, `.Rproj`, `DESCRIPTION`, `.Rproj.user/`        |
| Raku             | `.raku`, `.rakumod`, `.p6`, `.pm6`, `META6.json`             |
| Red              | `.red`, `.reds` files                                        |
| Ruby             | `Gemfile`, `.ruby-version`                                   |
| Rust             | `Cargo.toml`                                                  |
| Scala            | `.scala`, `.sbt`, `build.sbt`, `.metals/`                    |
| Solidity         | `.sol` files                                                 |
| Spack            | `SPACK_ENV` environment                                      |
| Swift            | `.swift` files, `Package.swift`                              |
| Terraform        | `.tf`, `.tfplan`, `.tfstate`, `.terraform/`                  |
| Typst            | `.typ` files, `template.typ`                                 |
| Vagrant          | `Vagrantfile`                                                |
| V                | `.v` files, `v.mod`, `vpkg.json`                             |
| Xmake            | `xmake.lua`                                                  |
| Zig              | `.zig` files, `build.zig`                                    |

## Install

```bash
# From npm
pi install npm:pi-zentui

# From git
pi install git:github.com/lmilojevicc/pi-zentui
```

## Config

On first run, Zentui creates a config file at:

```
~/.pi/agent/zentui.json
```

### Default config

```json
{
  "projectRefreshIntervalMs": 30000,
  "icons": {
    "cwd": "󰝰",
    "git": "",
    "ahead": "↑",
    "behind": "↓",
    "diverged": "⇕",
    "conflicted": "=",
    "untracked": "?",
    "stashed": "$",
    "modified": "!",
    "staged": "+",
    "renamed": "»",
    "deleted": "✘",
    "typechanged": "T"
  },
  "colors": {
    "cwd": "bold cyan",
    "gitBranch": "bold purple",
    "gitStatus": "bold red",
    "contextNormal": "dimmed",
    "contextWarning": "bold yellow",
    "contextError": "bold red",
    "tokens": "dimmed",
    "cost": "bold green",
    "separator": "dimmed",
    "runtimePrefix": ""
  },
  "colorSources": {
    "starship": "theme",
    "editor": "theme",
    "userMessages": "theme"
  }
}
```

`projectRefreshIntervalMs` controls how often Zentui refreshes project status (git/runtime) while Pi is idle. Set it to `0` to disable polling; invalid values or values below 5000 ms fall back to `30000`.

### Color values

Use `/zentui` inside Pi to switch color sources between Pi theme colors and terminal colors:

- `starship` — footer/runtime/git/context/cost colors
- `editor + previous messages` — input editor and previous user-message rails/borders

Both settings default to `theme`. The config still stores editor and previous user-message sources separately as `editor` and `userMessages`, but `/zentui` changes them together so the prompt chrome stays consistent.

Color values can use terminal-palette style strings, hex colors, or Pi theme color tokens:

- Named terminal colors: `bold purple`, `yellow`, `bright-cyan`
- 256-color / hex: `bold 149`, `fg:202`, `#89b4fa`
- Backgrounds and modifiers: `bg:blue fg:bright-green`, `underline bg:#bf5700`
- Pi theme tokens: `accent`, `borderMuted`, `syntaxKeyword`

Use the `colors` config key for these values.

## Requirements

- [Pi](https://pi.dev) coding agent 0.74 or newer
- A [Nerd Font](https://www.nerdfonts.com/) for icons

## Development

```bash
npm install
npm run verify
npm run fmt
npm run pack:check
```

### Test in Pi

The project keeps Pi core packages as peer dependencies for runtime and dev dependencies for
typechecking. To avoid accidentally running the local `node_modules/.bin/pi` shim, the dev scripts use
the globally installed Pi binary by default:

```bash
npm run pi:dev
npm run pi:install-local
```

Override the binary if your Pi install is somewhere else:

```bash
PI_BIN=/path/to/pi npm run pi:dev
```

## Credits

Inspired by:

- [Starship](https://starship.rs/) — the minimal, blazing-fast, and infinitely customizable prompt
- [Opencode](https://github.com/opencode-ai/opencode) — terminal-based AI coding assistant

## License

MIT
