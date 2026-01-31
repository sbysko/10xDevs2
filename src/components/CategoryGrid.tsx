/**
 * CategoryGrid Component
 *
 * Responsive grid layout for category cards
 *
 * Grid breakpoints:
 * - Mobile (<768px): 1 column
 * - Tablet (768-1024px): 2 columns
 * - Desktop (>1024px): 3 columns (max)
 *
 * Props:
 * - children: React.ReactNode
 */

interface CategoryGridProps {
  children: React.ReactNode;
}

export default function CategoryGrid({ children }: CategoryGridProps) {
  return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
