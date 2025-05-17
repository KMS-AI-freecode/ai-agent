# AI Agent

A lightweight and scalable platform for AI agents with minimal dependencies.

## Purpose

AI Agent is a minimalist yet powerful platform for creating and managing a network of AI agents. It emphasizes simplicity, ease of deployment, and extensibility.

## Features

- **Lightweight architecture** with minimal dependencies for quick deployment
- **Modular design** with easily replaceable and extensible components
- **Support for both cloud and local AI models** (OpenAI API and compatible local models)
- **Structured knowledge storage** for AI agent experiences
- **Built-in tools system** allowing agents to perform actions
- **Video embedding support** for rich multimedia communication

## Technical Stack

- **Backend**: Node.js + Express
- **Frontend**: React
- **API**: GraphQL with Apollo Server (code-first approach)
- **Data Storage**: LowDB for development and testing
- **AI Integration**: OpenAI API with support for compatible alternatives

## Getting Started

```bash
# Copy and edit envs
cp .env.sample .env

# Install dependencies
npm install

# Start development server
npm run dev
```

## Production

```bash
npm run generate:types

npm run build

npm run start
```

## Testing

```bash
# Run tests
npm run test
```

## API

- **GraphQL API**: http://localhost:3030/api
- **GraphiQL**: http://localhost:3030/graphiql

## Important Disclaimer

⚠️ **WARNING** ⚠️

This project is still under active development and is **NOT INTENDED FOR PRODUCTION USE**. Please note the following:

- This software was developed with very low security requirements
- Use at your own risk
- Recommended to run only locally and preferably in Docker containers
- Intended for experienced developers only
- No guarantees of security, stability, or data integrity are provided

## License

MIT
