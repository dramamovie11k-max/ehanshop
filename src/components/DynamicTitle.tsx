import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const updateMetaTag = (property: string, content: string, isName = false) => {
  if (!content) return;
  const attr = isName ? "name" : "property";
  let tag = document.querySelector(`meta[${attr}="${property}"]`);
  if (tag) {
    tag.setAttribute("content", content);
  } else {
    tag = document.createElement("meta");
    tag.setAttribute(attr, property);
    tag.setAttribute("content", content);
    document.head.appendChild(tag);
  }
};

const DynamicTitle = () => {
  const { getSetting } = useSiteSettings();
  const tabTitle = getSetting("browser_tab_title", "");
  const ogTitle = getSetting("og_title", "");
  const ogDescription = getSetting("og_description", "");
  const ogImage = getSetting("og_image", "");

  useEffect(() => {
    if (tabTitle) {
      document.title = tabTitle;
    }

    // OG meta tags
    const titleToUse = ogTitle || tabTitle;
    if (titleToUse) {
      updateMetaTag("og:title", titleToUse);
      updateMetaTag("twitter:title", titleToUse, true);
    }

    if (ogDescription) {
      updateMetaTag("description", ogDescription, true);
      updateMetaTag("og:description", ogDescription);
      updateMetaTag("twitter:description", ogDescription, true);
    }

    if (ogImage) {
      updateMetaTag("og:image", ogImage);
      updateMetaTag("twitter:image", ogImage, true);
    }
  }, [tabTitle, ogTitle, ogDescription, ogImage]);

  return null;
};

export default DynamicTitle;
