# TextEase

A modern desktop text editor built with Electron and TypeScript, supporting multiple file formats (TXT, RTF, Markdown).

[![CI/CD](https://github.com/avixiii-dev/TextEase/actions/workflows/ci.yml/badge.svg)](https://github.com/avixiii-dev/TextEase/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/avixiii-dev/TextEase/branch/main/graph/badge.svg)](https://codecov.io/gh/avixiii-dev/TextEase)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 📝 Multi-format support (TXT, RTF, Markdown)
- 🔍 Advanced Find/Replace with RegExp
- 📱 Responsive and modern UI
- 🌙 Dark mode support
- 💾 Auto-save and backup
- 📊 Word count and statistics
- 🖼️ Live Markdown preview
- 🎨 Syntax highlighting
- 📥 Drag & Drop file support

## Getting Started

### Prerequisites

- Node.js (>= 16.x)
- npm (>= 8.x)

### Installation

```bash
# Clone the repository
git clone https://github.com/avixiii-dev/TextEase.git

# Navigate to project directory
cd TextEase

# Install dependencies
npm install

# Start development
npm run watch

# In another terminal, start the app
npm start
```

### Building

```bash
# Build TypeScript files
npm run build

# Create distributable
npm run electron-builder
```

## Development

### Project Structure

```
TextEase/
├── src/                # Source files
│   ├── models/        # Data models
│   ├── views/         # UI components
│   ├── controllers/   # Business logic
│   └── utils/         # Helper functions
├── tests/             # Test files
│   ├── unit/         # Unit tests
│   └── e2e/          # End-to-end tests
├── docs/             # Documentation
└── dist/             # Compiled files
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Documentation

- [API Documentation](https://avixiii-dev.github.io/TextEase/docs)
- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## CI/CD Pipeline

Our CI/CD pipeline includes:

1. **Continuous Integration**
   - Linting
   - Unit Testing
   - E2E Testing
   - Code Coverage Analysis

2. **Continuous Deployment**
   - Automatic builds for Windows, macOS, and Linux
   - Documentation generation and deployment
   - GitHub Release creation

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Marked](https://marked.js.org/)
- [Highlight.js](https://highlightjs.org/)
