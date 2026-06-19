# Require a modern CMake release with reliable FetchContent and imported-target support.
cmake_minimum_required(VERSION 3.20)

# Name the native project and explicitly state that it compiles C++ only.
project(mlpack_studio_native LANGUAGES CXX)

# mlpack 4.x supports C++17; selecting it also allows modern language conveniences.
set(CMAKE_CXX_STANDARD 17)
# Prevent a compiler from silently falling back to an older C++ dialect.
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Locate the user's installed mlpack package and expose its mlpack::mlpack target.
find_package(mlpack CONFIG REQUIRED)

# FetchContent downloads small build-time dependencies during CMake configuration.
include(FetchContent)
# Declare cpp-httplib, the lightweight HTTP layer around the native mlpack runner.
FetchContent_Declare(
  httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.18.6
)
# Download (when necessary) and make httplib's CMake target available below.
FetchContent_MakeAvailable(httplib)

# Compile the native API entry point into a Windows executable named mlpack-studio-api.
add_executable(mlpack-studio-api native/main.cpp)

# Link both real mlpack functionality and the HTTP server into the executable.
# PRIVATE means consumers of this executable do not inherit these dependencies.
target_link_libraries(
  mlpack-studio-api
  PRIVATE
    mlpack::mlpack
    httplib::httplib
)
