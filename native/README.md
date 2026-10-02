<!-- Generated file: edit the source in the dev repository. sha256:e64ac3b9cd90b3cc -->
# Native library

[Back to xeoIFC](../README.md#4-native-library)

`xeoifc.dll` (`libxeoifc.so` on Linux) exposes the whole engine through one plain C header, `xeoifc.h`. Any program that
can call C loads it: C++, C# (P/Invoke), Python (ctypes), Delphi, Java (JNA); desktop GUI applications and headless server processes
alike. Small working programs in C, C# and Python are in [examples](../examples); the
[Build on xeoIFC](https://xeofoundry.github.io/xeoIFC/showcase/integrate/) page lists every platform and recipe. A host can use any subset of its function groups: the document API session, the IFC export (split and merge), background
load jobs with progress callbacks, and the wgpu renderer drawing into a native window handle.

Function groups and a C example:
[architecture/integration-map.md](../architecture/integration-map.md#native-library-xeoifcdll-c-abi-any-language)

<a href="https://xeofoundry.github.io/xeoIFC/showcase/xeoifc-qt/">
  <img width="900" alt="xeoIFC Qt, an open-source desktop IFC viewer on xeoifc.dll, with the villa model - click for the showcase page" src="../docs/showcase/xeoifc-qt/xeoifc-qt.png" />
</a>

xeoIFC Qt is an open-source (MIT) desktop IFC viewer for Windows and Linux: about 4,500 lines of C++ with Qt 6 Widgets on
`xeoifc.dll`. Click the image for the [showcase page](https://xeofoundry.github.io/xeoIFC/showcase/xeoifc-qt/) with the calls it
makes and measured load times, or download the `xeoifc-qt-source.zip` package with Visual Studio solution and CMake:
[https://github.com/xeofoundry/xeoIFC/releases/](https://github.com/xeofoundry/xeoIFC/releases/)
