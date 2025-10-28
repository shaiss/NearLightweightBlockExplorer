# NEAR Lightweight Block Explorer

A lightweight, RPC-based blockchain explorer for NEAR Protocol with automatic failover support. Perfect for local development and connecting to multiple RPC providers with high availability.

## ✨ Features

- 🚀 **Lightweight** - No database required, queries directly via RPC
- 🔄 **Automatic Failover** - Seamlessly switches between RPC providers on failures
- 🔁 **Smart Retry** - Exponential backoff (100ms → 300ms → 900ms) for resilient requests
- ⚙️ **Provider Management** - Visual settings page to manage RPC endpoints
- 🌐 **Multi-Network** - Supports mainnet, testnet, and custom localnet configurations
- 📊 **Real-time** - View blocks, transactions, and network status
- 🎨 **Modern UI** - Clean, responsive interface built with React and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (run `nvm use` if using nvm)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The explorer will be available at http://localhost:5173/

## 🔧 RPC Provider Configuration

### Default Setup

The explorer comes pre-configured with:
- **FastNEAR** (mainnet) - enabled by default
- **NEAR Official** (testnet) - enabled by default  
- **Localhost:3030** (localnet) - enabled by default

### Configure Providers

1. Navigate to **Settings** in the navigation menu
2. Enable/disable providers by network type (Mainnet, Testnet, Localnet)
3. Add custom RPC endpoints for your local nodes
4. Test provider connectivity with the "Test" button
5. Reorder providers to set failover priority

### Add Custom Provider

```
Name: My Local Node
URL: http://localhost:3030
```

Click "Add Provider" to save.

For detailed information on RPC failover, see [RPC_FAILOVER_GUIDE.md](./RPC_FAILOVER_GUIDE.md).

## 📖 Usage

### Exploring Blocks

- **Home Page** - View latest network status and recent blocks
- **Blocks List** - Browse all blocks with pagination
- **Block Detail** - View detailed information about a specific block
- **Transaction List** - See all transactions for a given block

### Search

Use the search feature to find:
- Blocks by height or hash
- Transactions by hash
- Accounts by ID

### Settings

Configure RPC providers:
- Select which networks to use (mainnet/testnet/localnet)
- Add custom RPC endpoints
- Test provider connectivity
- Set failover priority

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔍 How It Works

### RPC Failover Architecture

1. **Provider Manager** - Fetches and manages RPC provider list from GitHub
2. **Failover Client** - Implements retry logic with smart error detection
3. **Auto-Switch** - Automatically fails over on network errors (not RPC errors)
4. **Persistence** - Saves provider preferences to localStorage

See [RPC_FAILOVER_GUIDE.md](./RPC_FAILOVER_GUIDE.md) for technical details.

## 🛠️ Development

### Project Structure

```
├── components/        # React components
│   └── ui/           # UI primitives (Button, Card, etc.)
├── contexts/         # React contexts (Theme)
├── lib/              # Core libraries
│   ├── nearRpcFailover.ts    # Failover RPC client
│   ├── providerManager.ts    # Provider management
│   └── toast.ts              # Toast notifications
├── pages/            # Page components (routes)
└── public/           # Static assets
```

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Wouter** - Lightweight routing

### Local Development with NEAR Node

To connect to a local NEAR node:

1. Start your local NEAR node on port 3030
2. Go to Settings in the explorer
3. Verify "Localhost:3030" is enabled
4. The explorer will automatically use your local node

## Contributing

To contribute to NEAR Explorer, please see [CONTRIBUTING](CONTRIBUTING.md).

Most real-time collaboration happens in a variety of channels on the
[NEAR Discord server](https://near.chat), with channels dedicated for getting help, community,
documentation, and all major contribution areas in the NEAR ecosystem. A good place to ask
for help would be the #general channel.

## License

NEAR Explorer is distributed under the terms of both the MIT license and the Apache License (Version 2.0).

See [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE) for details.
