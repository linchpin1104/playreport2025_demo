# Force Rebuild

This file is used to force Vercel to rebuild from scratch by invalidating the build cache.

Build timestamp: 2025-07-19T05:55:00Z

## Recent Changes
- Fixed package.json dependencies (autoprefixer, postcss, tailwindcss moved to dependencies)
- Enhanced Next.js configuration for better module resolution
- Added Node.js engine specification
- Simplified Vercel configuration
- Created UI components barrel export
- Added .vercelignore file

## Expected Fix
This rebuild should resolve the following Vercel build errors:
1. Cannot find module 'autoprefixer'
2. Module not found: Can't resolve '@/components/ui/*'

## Debug Info
- Next.js Version: 14.2.30
- Node.js Requirement: >=18.0.0
- PostCSS: 8.5.6
- Autoprefixer: 10.4.21
- TailwindCSS: 3.0.7 