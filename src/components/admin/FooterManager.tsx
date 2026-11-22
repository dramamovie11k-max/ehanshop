import { useState } from "react";
import { Plus, Trash2, GripVertical, Link, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

interface FooterManagerProps {
  quickLinks: FooterLink[];
  customerServiceLinks: FooterLink[];
  onQuickLinksChange: (links: FooterLink[]) => void;
  onCustomerServiceChange: (links: FooterLink[]) => void;
}

const FooterManager = ({
  quickLinks,
  customerServiceLinks,
  onQuickLinksChange,
  onCustomerServiceChange,
}: FooterManagerProps) => {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addLink = (type: "quick" | "customer") => {
    const newLink: FooterLink = {
      id: generateId(),
      label: "",
      url: "",
    };

    if (type === "quick") {
      onQuickLinksChange([...quickLinks, newLink]);
    } else {
      onCustomerServiceChange([...customerServiceLinks, newLink]);
    }
  };

  const updateLink = (
    type: "quick" | "customer",
    id: string,
    field: "label" | "url",
    value: string
  ) => {
    if (type === "quick") {
      onQuickLinksChange(
        quickLinks.map((link) =>
          link.id === id ? { ...link, [field]: value } : link
        )
      );
    } else {
      onCustomerServiceChange(
        customerServiceLinks.map((link) =>
          link.id === id ? { ...link, [field]: value } : link
        )
      );
    }
  };

  const removeLink = (type: "quick" | "customer", id: string) => {
    if (type === "quick") {
      onQuickLinksChange(quickLinks.filter((link) => link.id !== id));
    } else {
      onCustomerServiceChange(customerServiceLinks.filter((link) => link.id !== id));
    }
  };

  const renderLinkEditor = (
    type: "quick" | "customer",
    links: FooterLink[],
    title: string,
    description: string
  ) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-base">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                placeholder="লেবেল (যেমন: Home)"
                value={link.label}
                onChange={(e) => updateLink(type, link.id, "label", e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="URL (যেমন: /about)"
                value={link.url}
                onChange={(e) => updateLink(type, link.id, "url", e.target.value)}
                className="h-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => removeLink(type, link.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {links.length === 0 && (
          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
            <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">কোনো লিংক নেই। নতুন লিংক যোগ করুন।</p>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => addLink(type)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        নতুন লিংক যোগ করুন
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          ফুটার মেনু ম্যানেজমেন্ট
        </CardTitle>
        <CardDescription>
          ফুটারে প্রদর্শিত Quick Links এবং Customer Service লিংক গুলো এখান থেকে ম্যানেজ করুন
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderLinkEditor(
          "quick",
          quickLinks,
          "Quick Links",
          "ওয়েবসাইটের প্রধান পেজগুলোর লিংক"
        )}

        <Separator />

        {renderLinkEditor(
          "customer",
          customerServiceLinks,
          "Customer Service",
          "কাস্টমার সার্ভিস সম্পর্কিত পেজগুলোর লিংক"
        )}

        {/* Preview */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-medium">প্রিভিউ</h4>
          <div className="p-4 bg-[#0a2618] rounded-lg">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h5 className="font-bold text-yellow-400 mb-2">Quick Links</h5>
                <ul className="space-y-1">
                  {quickLinks.map((link) => (
                    <li key={link.id} className="text-emerald-200/80 hover:text-blue-400">
                      » {link.label || "লেবেল নেই"}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-yellow-400 mb-2">Customer Service</h5>
                <ul className="space-y-1">
                  {customerServiceLinks.map((link) => (
                    <li key={link.id} className="text-emerald-200/80 hover:text-blue-400">
                      » {link.label || "লেবেল নেই"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FooterManager;
