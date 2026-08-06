# STTPlink

AI-powered freight platform specialized in container transport, heavy haul, oversized cargo, and construction equipment.

## Tech Stack

- **Next.js 15** — App Router, React Server Components
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling with custom brand theme
- **ESLint** — Code quality and consistency

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm, yarn, or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   │   └── login/
│   ├── admin/              # Admin dashboard
│   │   └── dashboard/
│   ├── api/                # API routes
│   │   ├── ai/             # AI integration endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   └── health/         # Health check
│   ├── customer/           # Customer portal
│   │   └── portal/
│   ├── driver/             # Driver registration
│   │   └── register/
│   ├── orders/             # Order management
│   ├── globals.css         # Global styles & animations
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── landing/            # Landing page sections
│   ├── layout/             # Header, Footer
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── ai/                 # AI integration layer
│   ├── auth/               # Authentication utilities
│   └── utils.ts            # Shared utilities
└── types/                  # TypeScript type definitions
```

## Brand Colors

| Color        | Hex       | Usage                |
| ------------ | --------- | -------------------- |
| Black        | `#0A0A0A` | Background           |
| White        | `#FAFAFA` | Text                 |
| Orange       | `#D35400` | Primary accent       |
| Orange Light | `#E67E22` | Hover states         |
| Orange Dark  | `#A04000` | Deep accent          |

## Roadmap

- [ ] Driver registration flow
- [ ] Customer portal
- [ ] Order management system
- [ ] Admin dashboard
- [ ] Authentication (NextAuth / Clerk)
- [ ] AI-powered route optimization
- [ ] Real-time tracking

## License

Private — All rights reserved.
