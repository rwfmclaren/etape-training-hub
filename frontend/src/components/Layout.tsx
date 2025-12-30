import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      <Navigation />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        {children}
      </div>
    </div>
  );
}
