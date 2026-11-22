import ContactVariant01 from "./variants/ContactVariant01";
import ContactVariant02 from "./variants/ContactVariant02";
import ContactVariant03 from "./variants/ContactVariant03";
import { SalesPage } from "@/types/salesPage";
import { getTemplateStyles } from "@/lib/salesPageTemplates";

interface ContactSectionProps {
  page: SalesPage;
}

const ContactSection = ({ page }: ContactSectionProps) => {
  const { template, colors } = getTemplateStyles(page.template_id || 'nature-fresh');
  const variant = page.contact_variant || '01';
  const isLightTheme = ['nature-fresh', 'classic-white', 'soft-elegance', 'bold-orange', 'fresh-lime'].includes(template.id);

  switch (variant) {
    case '02':
      return <ContactVariant02 page={page} colors={colors} isLightTheme={isLightTheme} />;
    case '03':
      return <ContactVariant03 page={page} colors={colors} isLightTheme={isLightTheme} />;
    default:
      return <ContactVariant01 page={page} colors={colors} isLightTheme={isLightTheme} />;
  }
};

export default ContactSection;
