# Contributing to SentVibe

Thank you for your interest in contributing to SentVibe! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jahboukie/sentvibe.git
   cd sentvibe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## 🛠️ Development Workflow

### Project Structure

```
src/
├── bin/           # CLI entry point
├── commands/      # CLI commands
├── license/       # License management
├── memory/        # Memory system
├── sandbox/       # Sandbox environment
├── utils/         # Utilities
└── types/         # TypeScript types
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Development mode
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## 📝 Contribution Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier)
- Add JSDoc comments for public APIs
- Write tests for new features

### Commit Messages

Use conventional commit format:
```
feat: add new memory search feature
fix: resolve license validation issue
docs: update installation guide
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Commit your changes
7. Push to your fork
8. Open a Pull Request

### Testing

- Write unit tests for new features
- Ensure existing tests pass
- Test CLI commands manually
- Test with different AI tools (VS Code, Cursor, etc.)

## 🐛 Bug Reports

When reporting bugs, please include:

- SentVibe version (`sv --version`)
- Operating system
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

## 💡 Feature Requests

For feature requests:

- Check existing issues first
- Describe the use case
- Explain how it benefits AI-assisted development
- Consider implementation complexity

## 📚 Documentation

Help improve documentation:

- Fix typos and unclear explanations
- Add examples and use cases
- Update outdated information
- Translate to other languages

## 🤝 Community

- Be respectful and inclusive
- Help other contributors
- Share knowledge and best practices
- Follow the Code of Conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for making SentVibe better! 🚀
