import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { ProblemSolutionSection } from '@/components/sections/ProblemSolutionSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { PricingSection } from '@/components/sections/PricingSection';
import { PackagesSection } from '@/components/sections/PackagesSection';
import { CalendarSection } from '@/components/sections/CalendarSection';
import { WhatsAppSection } from '@/components/sections/WhatsAppSection';
import { GallerySection } from '@/components/sections/GallerySection';
import { ReviewsSection } from '@/components/sections/ReviewsSection';
import { LocationSection } from '@/components/sections/LocationSection';
import { CTASection } from '@/components/sections/CTASection';

function IndexContent() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-glow">
      <Header />

      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <ServicesSection />
        <PricingSection />
        <PackagesSection />
        <CalendarSection onOpenLogin={() => navigate('/auth/login')} />
        <WhatsAppSection />
        <GallerySection />
        <ReviewsSection />
        <LocationSection />
        <CTASection />
      </main>

      <Footer />
      {isMobile && <BottomNav />}
    </div>
  );
}

const Index = () => <IndexContent />;

export default Index;
