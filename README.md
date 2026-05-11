# FinanceHub

[![Build Test](https://github.com/Mohammad-Faiz-Cloud-Engineer/FinanceHub/actions/workflows/build-test.yml/badge.svg?branch=main)](https://github.com/Mohammad-Faiz-Cloud-Engineer/FinanceHub/actions/workflows/build-test.yml)

A modern, mobile-first personal finance management application built with React, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** - Overview of your financial health with net worth, income, expenses, and savings
- **Accounts Management** - Track multiple bank accounts with real-time balances
- **Transaction Tracking** - Record and categorize income, expenses, and transfers
- **Fixed Deposits** - Monitor FD investments with interest calculations and maturity tracking
- **Investments** - Track stocks, mutual funds, and crypto portfolios
- **Insurance** - Manage life, health, and vehicle insurance policies
- **Budgets** - Set monthly budgets and track spending by category
- **Analytics** - Visualize spending patterns with interactive charts
- **Financial Calculators** - EMI, SIP, Compound Interest, and Tax calculators
- **PDF Export** - Generate account statements and reports
- **Dark/Light Theme** - Automatic theme switching based on system preferences

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management with localStorage persistence
- **Recharts** - Data visualization
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library
- **shadcn/ui** - UI component library

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 20 or higher)
- **npm** (comes with Node.js)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Mohammad-Faiz-Cloud-Engineer/FinanceHub.git
```

### 2. Navigate to project directory

```bash
cd FinanceHub
```

### 3. Install dependencies

```bash
npm ci
```

This will install all required packages including:
- React, TypeScript, and Vite
- Tailwind CSS and PostCSS
- Zustand for state management
- Recharts for data visualization
- Framer Motion for animations
- All UI components and utilities

## Development

### Start development server

```bash
npm run dev
```

This will:
- Start the Vite development server
- Open the app at `http://localhost:3000/`
- Enable Hot Module Replacement (HMR) for instant updates
- Watch for file changes and auto-reload

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run TypeScript type checking
npm run type-check

# Lint code
npm run lint
```

## Build for Production

### Create production build

```bash
npm run build
```

This will:
- Run TypeScript compiler to check for errors
- Bundle and minify all assets
- Optimize images and other static files
- Generate production-ready files in the `dist/` folder

### Preview production build

```bash
npm run preview
```

This starts a local server to preview the production build at `http://localhost:4173/`

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

1. Update `vite.config.ts` with your repository name:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... other config
})
```

2. Build and deploy:
```bash
npm run build
# Push the dist folder to gh-pages branch
```

## Project Structure

```
financehub/
├── public/              # Static assets (images, icons)
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Common components (Header, Cards, etc.)
│   │   └── ui/          # shadcn/ui components
│   ├── features/        # Feature-specific components
│   │   ├── accounts/    # Account management
│   │   ├── analytics/   # Analytics and charts
│   │   ├── budgets/     # Budget tracking
│   │   ├── calculators/ # Financial calculators
│   │   ├── fixedDeposits/ # FD management
│   │   ├── insurance/   # Insurance tracking
│   │   ├── investments/ # Investment portfolio
│   │   ├── pdfExport/   # PDF generation
│   │   ├── settings/    # App settings
│   │   └── transactions/ # Transaction management
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── services/        # Business logic and calculations
│   ├── store/           # Zustand state management
│   ├── theme/           # Theme configuration
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # App entry point
│   └── index.css        # Global styles
├── .gitignore           # Git ignore rules
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Mobile Optimized

The application is fully responsive and optimized for mobile devices with:
- Compact card layouts
- Touch-friendly buttons and controls
- Reduced text sizes for better mobile readability
- Smooth scrolling and animations
- Progressive Web App (PWA) ready

## Customization

### Theme Customization

The app uses CSS variables for theming. Customize colors in `src/theme/index.ts`:

```typescript
export const colors = {
  primary: '#0F766E',
  secondary: '#6366F1',
  accent: '#F59E0B',
  // ... more colors
};
```

### Adding New Features

1. Create a new folder in `src/features/`
2. Add your components and logic
3. Update routing in `src/App.tsx`
4. Add navigation in `src/components/common/BottomNav.tsx`

## Data Storage

The app uses browser localStorage to persist data:
- All data is stored locally on your device
- No backend server required
- Data persists across browser sessions
- Export/import functionality available

## Troubleshooting

### Port already in use

If port 3000 is already in use:
```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Build errors

If you encounter build errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Type errors

```bash
# Run type checking
npm run type-check

# Install missing type definitions
npm install --save-dev @types/node
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author

**Mohammad Faiz**

## Contact

For questions or feedback, please open an issue on GitHub.

## Acknowledgments

- Built with React and TypeScript
- UI components from shadcn/ui
- Icons from Lucide React
- Charts powered by Recharts

---

Made with care for personal finance management
