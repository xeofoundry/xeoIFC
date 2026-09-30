# The external-walls sample in C on the prebuilt xeoifc library.
#
#   cmake -S . -B build -DXEOIFC_SDK_DIR=<xeoifc-qt/sdk from xeoifc-qt-source.zip>
#   cmake --build build --config Release
#
# The executable lands in build/ (build/Release with Visual Studio), next to a copy of the xeoifc library.

cmake_minimum_required(VERSION 3.21)
project(external_walls LANGUAGES C)

set(XEOIFC_SDK_DIR "" CACHE PATH "Directory with include/xeoifc.h and lib/<platform> (xeoifc-qt/sdk of xeoifc-qt-source.zip)")
if(NOT EXISTS "${XEOIFC_SDK_DIR}/include/xeoifc.h")
    message(FATAL_ERROR "Set XEOIFC_SDK_DIR to the sdk folder of xeoifc-qt-source.zip (it holds include/xeoifc.h).")
endif()
if(NOT CMAKE_SIZEOF_VOID_P EQUAL 8)
    message(FATAL_ERROR "xeoifc is a 64-bit library: configure a 64-bit build (Visual Studio: -A x64).")
endif()
if(WIN32 AND CMAKE_C_COMPILER_ARCHITECTURE_ID)
    string(TOLOWER "${CMAKE_C_COMPILER_ARCHITECTURE_ID}" XEOIFC_PROCESSOR)
else()
    string(TOLOWER "${CMAKE_SYSTEM_PROCESSOR}" XEOIFC_PROCESSOR)
endif()
if(XEOIFC_PROCESSOR MATCHES "^(x64|x86_64|amd64)$")
    set(XEOIFC_ARCH x64)
elseif(XEOIFC_PROCESSOR MATCHES "^(arm64|aarch64)$")
    set(XEOIFC_ARCH arm64)
else()
    set(XEOIFC_ARCH "${XEOIFC_PROCESSOR}")
endif()
if(WIN32)
    set(XEOIFC_LIBRARY "${XEOIFC_SDK_DIR}/lib/windows-${XEOIFC_ARCH}/xeoifc.dll")
elseif(APPLE)
    message(FATAL_ERROR "There is no macOS build of the xeoifc library yet.")
else()
    set(XEOIFC_LIBRARY "${XEOIFC_SDK_DIR}/lib/linux-${XEOIFC_ARCH}/libxeoifc.so")
endif()
if(NOT EXISTS "${XEOIFC_LIBRARY}")
    message(FATAL_ERROR "No xeoifc library for this platform: ${XEOIFC_LIBRARY} does not exist.")
endif()

add_library(xeoifc SHARED IMPORTED)
set_target_properties(xeoifc PROPERTIES
    IMPORTED_LOCATION "${XEOIFC_LIBRARY}"
    INTERFACE_INCLUDE_DIRECTORIES "${XEOIFC_SDK_DIR}/include")
if(WIN32)
    set_target_properties(xeoifc PROPERTIES IMPORTED_IMPLIB "${XEOIFC_LIBRARY}.lib")
endif()

add_executable(external_walls external_walls.c)
target_link_libraries(external_walls PRIVATE xeoifc)
if(MINGW)
    target_link_options(external_walls PRIVATE -municode)
endif()
if(UNIX)
    set_target_properties(external_walls PROPERTIES BUILD_RPATH "\$ORIGIN" INSTALL_RPATH "\$ORIGIN")
endif()
add_custom_command(TARGET external_walls POST_BUILD
    COMMAND "${CMAKE_COMMAND}" -E copy_if_different "${XEOIFC_LIBRARY}" "$<TARGET_FILE_DIR:external_walls>"
    COMMENT "copy the xeoifc library next to external_walls"
    VERBATIM)
