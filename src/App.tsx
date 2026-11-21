import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import PixelCutterStudio from './components/PixelCutterStudio';
import CapabilitiesSection from './components/CapabilitiesSection';
import WorkflowAndProof from './components/WorkflowAndProof';
import PlansAndContact from './components/PlansAndContact';
import Footer from './components/Footer';

export default function App() {
  const scrollToStudio = () => {
    const el = document.getElementById('studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#141619]">
      <Navbar onOpenStudio={scrollToStudio} />
      <main>
        <HeroSection onStartCutting={scrollToStudio} />
        <PixelCutterStudio />
        <CapabilitiesSection />
        <WorkflowAndProof />
        <PlansAndContact onOpenStudio={scrollToStudio} />
      </main>
      <Footer />
    </div>
  );
}
