# Etape Training Hub - Frontend

Modern, professional frontend for the Etape Training Hub built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The development server will start at `http://localhost:5173`

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

For production, set `VITE_API_BASE_URL` to your backend URL.

## Features

- **Role-Based Access Control** - Different interfaces for athletes, trainers, and admins
- **Modern UI** - Professional design with Tailwind CSS
- **Responsive** - Mobile-first design
- **Toast Notifications** - Success/error feedback
- **Loading States** - Smooth loading experiences
- **Sidebar Navigation** - Collapsible sidebar with icons

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI components
│   ├── Sidebar.tsx  # Sidebar navigation
│   ├── Layout.tsx   # Main layout wrapper
│   └── ToastProvider.tsx
├── context/         # React context providers
├── pages/           # Page components
├── services/        # API services
├── types/           # TypeScript types
└── App.tsx          # Main app component
```

## Design System

### Colors

- **Primary**: Blue (#3b82f6) - Actions, links, active states
- **Success**: Green (#10b981) - Success messages
- **Danger**: Red (#ef4444) - Errors, destructive actions
- **Gray**: Neutral colors for text and backgrounds

### Components

All UI components follow a consistent design pattern with:
- Rounded corners (rounded-lg, rounded-xl)
- Subtle shadows
- Smooth transitions
- Focus states for accessibility

## License

MIT
