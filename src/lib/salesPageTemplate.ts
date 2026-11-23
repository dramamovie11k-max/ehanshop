import { lazy } from "react";

const loaders = {
  "template-01-organic": () => import("@/components/salespage/templates/Template01Organic"),
  "template-02-clothing": () => import("@/components/salespage/templates/Template02Clothing"),
  "template-03-fashion": () => import("@/components/salespage/templates/Template03Fashion"),
  "template-04-gadget": () => import("@/components/salespage/templates/Template04Gadget"),
  "template-05-countdown": () => import("@/components/salespage/templates/Template05Countdown"),
  "template-06-panjabi": () => import("@/components/salespage/templates/Template06Panjabi"),
  "template-07-gadget": () => import("@/components/salespage/templates/Template07Gadget"),
  "template-08-minimal": () => import("@/components/salespage/templates/Template08Minimal"),
  "template-09-superfood": () => import("@/components/salespage/templates/Template09SuperFood"),
  "template-10-superfood2": () => import("@/components/salespage/templates/Template10SuperFood2"),
  "template-11-superfood3": () => import("@/components/salespage/templates/Template11SuperFood3"),
  "template-12-gadget3": () => import("@/components/salespage/templates/Template12Gadget3"),
  "template-13-natural-card": () => import("@/components/salespage/templates/Template13NaturalCard"),
  "template-14-video-organic": () => import("@/components/salespage/templates/Template14VideoOrganic"),
  "template-15-universal": () => import("@/components/salespage/templates/Template15Universal"),
  "legacy": () => import("@/components/salespage/LegacySalesPageRenderer"),
};

const templates = Object.fromEntries(
  Object.entries(loaders).map(([id, load]) => [id, lazy(load)]),
);

function templateKey(id: string): keyof typeof loaders {
  if (id === "nature-fresh") return "template-01-organic";
  return Object.prototype.hasOwnProperty.call(loaders, id) ? id as keyof typeof loaders : "legacy";
}

export function preloadSalesPageTemplate(id: string) {
  return loaders[templateKey(id)]();
}

export function salesPageTemplate(id: string) {
  return templates[templateKey(id)];
}
