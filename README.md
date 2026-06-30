# mlpack Studio

A modern interactive workbench for the C++ [mlpack](https://www.mlpack.org/) library. The React interface covers data preparation, classification, regression, nearest neighbors, clustering, dimensionality reduction, anomaly detection, statistics, recommendations, time-series feature work, evaluation, and batch prediction.

The UI runs immediately in an honest demo mode. When the native service is online, experiments are sent to the C++ API and the result explicitly says it was computed by mlpack.

## Run the interface

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Build the real C++ mlpack service

Install a C++17 compiler, CMake, and mlpack 4.x (for example through vcpkg), then point CMake at the package installation:

```powershell
cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=C:/path/to/vcpkg/scripts/buildsystems/vcpkg.cmake
cmake --build build --config Release
.\build\Release\mlpack-studio-api.exe
```

The native service listens only on `127.0.0.1:7312`. Its current executable endpoints demonstrate real `mlpack::RandomForest` training and `mlpack::KMeans` clustering; the catalog provides the UI contract for expanding the same dispatcher across every workbench module.

## Tests

Unit tests live in one unified location: `tests/unit`. Vitest is configured to
discover tests from that directory and to enforce at least 90% line coverage for
the unit-tested helper modules.

```powershell
npm test
npm run test:coverage
npm run build
```

## CI pipeline

GitHub Actions runs the pipeline in `.github/workflows/ci.yml` on pushes, pull
requests, and manual dispatches.

- Unit Tests: installs dependencies and runs `npm run test:coverage`.
- Production Build: runs `npm run build` after the unit tests pass.
- Supply Chain: runs Dependency Review on pull requests and `npm audit` for
  production dependency vulnerabilities.
- Code Scanning / Security: runs CodeQL with the extended security query suite.
- Code Scanning / Quality: runs CodeQL with the security-and-quality query suite
  as a separate code scanning job.
