import Banner from "@/components/sections/banner/Banner";
import CartProvider from "@/components/cart/CartProvider";
import Footer from "@/components/sections/footer/Footer";
import Navbar from "@/components/sections/navbar/Navbar";
import { getStoreCatalog } from "@/lib/store-catalog";
import { getHomeHeroContent } from "@/lib/home-hero";

export const instant = false;

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492235777798";
  const [{ costumes }, homeContent] = await Promise.all([getStoreCatalog(), getHomeHeroContent()]);

  return (
    <CartProvider whatsappNumber={whatsappNumber} costumes={costumes}>
      <Banner content={homeContent.sections} />
      <Navbar whatsappNumber={whatsappNumber} costumes={costumes} />
      {children}
      <Footer whatsappNumber={whatsappNumber} content={homeContent.sections} />
    </CartProvider>
  );
}
