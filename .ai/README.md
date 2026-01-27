# Dopasuj Obrazek do Słowa

> An educational web game for children aged 4-6 to learn vocabulary through interactive picture-to-word matching

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## About

**Dopasuj Obrazek do Słowa** (Match Picture to Word) is an educational web application designed to help young children (ages 4-6) develop their vocabulary through engaging, interactive gameplay. The application features:

- **Child-Friendly Interface**: Large, colorful buttons and simple navigation optimized for small hands
- **Multi-Profile Support**: Parents can manage up to 5 child profiles from a single account
- **Comprehensive Vocabulary**: 250 Polish words across 5 categories
- **Progress Tracking**: Star-based motivation system with cloud-synchronized progress
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop devices

### Target Audience

- **Primary Users**: Children aged 4-6 years
- **Account Managers**: Parents and guardians looking for effective educational tools

### Key Features

- Parent authentication system with email/password
- Multiple child profiles per parent account (max 3-5 profiles)
- 250 words in Polish divided into 5 categories:
  - Animals (Zwierzęta)
  - Fruits & Vegetables (Owoce i Warzywa)
  - Vehicles (Pojazdy)
  - Colors & Shapes (Kolory i Kształty)
  - Everyday Objects (Przedmioty Codziennego Użytku)
- Core game loop: 10 questions per session with instant feedback
- Star collection system for motivation
- Category-based progress tracking
- Cloud-based persistence (accessible from any device)

## Tech Stack

### Frontend

- **Framework**: [Astro 5](https://astro.build/) - Hybrid rendering (SSR for authentication, CSR for game)
- **UI Library**: [React 19](https://react.dev/) with TypeScript 5
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) for responsive, mobile-first design
- **Components**: [Shadcn/UI](https://ui.shadcn.com/) for accessible UI components

### Backend & Infrastructure

- **Database**: [Supabase](https://supabase.com/) PostgreSQL
- **Authentication**: Supabase Auth (GoTrue) with `@supabase/auth-ui-react`
- **Storage**: Supabase Storage for AI-generated images
- **Security**: Row Level Security (RLS) for data protection

### Deployment

- **Hosting**: [Vercel](https://vercel.com/) (optimized for Astro)
- **Analytics**: Vercel Analytics for performance monitoring
- **AI Content**: Google Imagen/Banana for generating child-friendly illustrations

### Database Schema

- **`profiles`**: Child profiles with display name, avatar, and total stars
- **`vocabulary`**: 250 words with images, organized by category
- **`user_progress`**: Tracks word mastery and learning progress per child

## Getting Started

### Prerequisites

- **Node.js**: v22.14.0 (specified in `.nvmrc`)
- **Package Manager**: npm, yarn, or pnpm
- **Supabase Account**: Free tier available at [supabase.com](https://supabase.com)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/10xDevs2.git
cd 10xDevs2
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up Supabase**

- Create a new Supabase project
- Run the database migrations (SQL schema for `profiles`, `vocabulary`, `user_progress`)
- Configure Row Level Security policies
- Upload AI-generated images to Supabase Storage

5. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix linting issues |
| `npm run format` | Format code with Prettier |

## Project Scope

### MVP Features (v1.0)

- ✅ Parent authentication (email/password)
- ✅ Multi-child profile management (3-5 profiles per account)
- ✅ 250 Polish vocabulary words with AI-generated images
- ✅ Core game loop (10 questions per session)
- ✅ Star-based progress tracking
- ✅ Category-wise progress display
- ✅ Cloud-synchronized progress
- ✅ Mobile-first responsive design
- ✅ Cross-browser compatibility (Chrome, Safari, Firefox)

### Limitations

- **Language**: Polish only (multilingual support planned for v1.2+)
- **Mode**: Online-only (no offline functionality)
- **Platforms**: Web application (no native mobile apps in MVP)
- **Profile Limit**: Maximum 5 child profiles per parent account

### Future Enhancements (Post-MVP)

- Voice narration for words
- Additional language support
- Advanced progress reports and analytics
- Achievement badges and levels
- Dark mode
- PWA capabilities for offline use
- Parental controls and custom word sets

## Project Status

🚧 **MVP Development Phase**

- **Timeline**: 7 days @ 1-2 hours/day (7-14 hours total)
- **Development Mode**: Solo project, rapid prototyping
- **Target Launch**: Q1 2026

### Success Metrics

- 20+ registered families in the first month
- 15+ mastered words per child in the first week
- 40%+ day-1 retention rate
- < 2 seconds page load time (LCP)
- Zero critical bugs

## License

This project's license information is not yet specified. Please contact the project maintainers for licensing details.

---

**Built with ❤️ for young learners**
