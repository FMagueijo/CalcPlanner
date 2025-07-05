# CalcPlanner - Construction Cost Estimator

A simple React Native app for creating and managing construction cost estimates with material pricing per square meter.

## Features

- 📝 Create construction cost estimates
- 🏗️ Material pricing per square meter
- 💰 Labor cost calculations
- 🎨 Finish cost management
- 📊 PDF export functionality
- 💾 Save and manage multiple estimates
- ✏️ Edit existing estimates
- 🌙 Dark theme UI

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd calcplanner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on your preferred platform:
   - Press `i` for iOS
   - Press `a` for Android
   - Press `w` for web

## Usage

### Creating an Estimate

1. Go to the "Novo Orçamento" tab
2. Enter a name for your estimate
3. Select materials and enter quantities
4. Set labor cost per square meter
5. Add finish costs
6. Save the estimate

### Managing Estimates

- View all saved estimates in the "Orçamentos" tab
- Edit existing estimates
- Export to PDF
- Delete estimates

## Tech Stack

- **React Native** with Expo
- **TypeScript**
- **AsyncStorage** for data persistence
- **Expo Print** for PDF generation
- **React Navigation** for tab navigation

## Project Structure

```
app/
├── _layout.tsx          # Tab navigation
├── index.tsx           # New estimate screen
├── orcamentos.tsx      # Estimates list screen
├── types.ts            # TypeScript interfaces
├── hooks/
│   └── useOrcamentos.ts # Data management hook
└── data/
    └── materiaisDefault.ts # Default materials
```

## License

MIT License
