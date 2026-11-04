<!-- Generated file: edit the source in the dev repository. sha256:70480b677431405a -->
# xeoIFC examples

The same small program in C, C# and Python on the native library (`xeoifc.dll` / `libxeoifc.so`, one plain C header).
Each one:

1. loads an IFC file with a background load job;
2. finds the external walls with one document API query;
3. writes them to a new IFC file, or skips export when no walls match (an existing output file is left unchanged).

All three print the same lines, so you can compare them directly. The whole program is about 100 lines in each
language.

| Folder | Language | Build and run |
|---|---|---|
| [c](c) | C11, CMake | `cmake -S c -B build -DXEOIFC_SDK_DIR=<sdk>` then `cmake --build build --config Release` |
| [csharp](csharp) | C# (.NET 8, P/Invoke) | `dotnet run --project csharp -- <library> <model.ifc>` |
| [python](python) | Python 3.8+ (ctypes, no packages) | `python python/external_walls.py <library> <model.ifc>` |

## The library

Download the package of your platform from [Releases](https://github.com/xeofoundry/xeoIFC/releases/) and unpack it:

| Package | Library |
|---|---|
| `xeoifc-lib-windows-amd64.zip` | `lib/windows-x64/xeoifc.dll` (with `xeoifc.dll.lib`) |
| `xeoifc-lib-linux-amd64.zip` | `lib/linux-x64/libxeoifc.so` |
| `xeoifc-lib-linux-arm64.zip` | `lib/linux-arm64/libxeoifc.so` |

Each one also holds `include/xeoifc.h` and `LICENSE.txt`, the xeoIFC Testing License of the library.

Use `<sdk>` for the unpacked folder and `<library>` for the library file in it. On Windows the library needs the
Microsoft Visual C++ Redistributable (VCRUNTIME140.dll); on Linux it needs glibc 2.35 or newer.

A test model is [villa.ifc](https://xeofoundry.github.io/xeoIFC/showcase/villa/villa.ifc) from the showcase: an
IFC4 model with 14 external walls.

## Output

```text
villa.ifc: 294 elements, 26018 triangles, 0.04 s
  Front wall between the rooms (Ground floor)
  Front wall, wing joint (Ground floor)
  ...
  First floor east wall (First floor)
14 external walls -> external-walls.ifc (51 KB)
evaluation marker: True
```

The program writes `external-walls.ifc` into the current folder. The numbers depend on the release; the time depends on
the machine.

## Licence key

Everything works without a key. The files the library writes then carry an "xeoIFC evaluation version" element, and the
last line prints `evaluation marker: True`. With a licence key in the environment variable `XEO_IFC_LICENSE_KEY`, the
file is plain and the line prints `False`. For a key or an evaluation, contact [XeoFoundry](https://xeofoundry.com).

## Licence

The example programs are MIT licensed ([LICENSE](LICENSE)). The xeoifc library is covered by its own licence
(`LICENSE.txt` in the library package).
