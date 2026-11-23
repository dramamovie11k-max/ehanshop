import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import HomePage from '@/pages/HomePage';
import SiteModeSettings from '@/components/admin/SiteModeSettings';

const settings = vi.hoisted(() => ({ mode: '', loading: false, banner: '', homepageId: '', available: false }));
vi.mock('@/hooks/useSiteSettings', () => ({ useSiteSettings: () => ({
  isLoading: settings.loading,
  getSetting: (key: string) => key === 'site_mode' ? settings.mode : key === 'home_banner_config' ? settings.banner : key === 'sales_home_page_id' ? settings.homepageId : '',
}) }));
vi.mock('@/pages/HomeSalesPage', () => ({ default: () => <h1>Sales page catalog</h1> }));
vi.mock('@/pages/WebsiteHome', () => ({ default: () => <h1>Product and category storefront</h1> }));

vi.mock('@/hooks/useSalesPages', () => ({
  useSalesPage: (identifier: string, field: string) => ({
    data: settings.available && identifier === 'sales-id' && field === 'id' ? { title: 'Selected sales homepage' } : undefined,
    isLoading: false,
  }),
}));
vi.mock('@/pages/SalesPage', () => ({ default: ({ data }: { data: { title: string } }) => <h1>{data.title}</h1> }));

beforeEach(() => { cleanup(); settings.mode = ''; settings.loading = false; settings.banner = ''; settings.homepageId = ''; settings.available = false; });
afterEach(() => vi.unstubAllGlobals());
describe('homepage mode switching', () => {
  it('keeps existing sites on the sales-page catalog when no mode is saved', async () => {
    render(<HomePage />);
    expect(await screen.findByText('Sales page catalog')).toBeInTheDocument();
  });
  it('waits for saved settings rather than briefly showing the wrong homepage', () => {
    settings.loading = true; settings.mode = 'website'; render(<HomePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
  it('preloads the first responsive banner without downloading the remaining slides early', async () => {
    settings.banner = JSON.stringify({ images: [
      'https://shop.example/api/media/products/first.webp',
      'https://shop.example/api/media/products/second.webp',
    ] });
    const { container } = render(<HomePage />);
    await screen.findByText('Sales page catalog');
    const links = container.querySelectorAll('link[rel="preload"][as="image"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('imagesrcset')).toContain('first.webp?width=384');
    expect(links[0].getAttribute('imagesrcset')).not.toContain('second.webp');
    expect(links[0]).toHaveAttribute('imagesizes', '100vw');
  });
  it('preloads the mobile banner without requesting the desktop banner on mobile', async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    settings.banner = JSON.stringify({
      images: ['https://shop.example/api/media/products/desktop.webp'],
      mobileImages: ['https://shop.example/api/media/products/mobile.webp'],
    });
    const { container } = render(<HomePage />);
    await screen.findByText('Sales page catalog');
    const links = container.querySelectorAll('link[rel="preload"][as="image"]');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('imagesrcset')).toContain('mobile.webp');
    expect(links[0].getAttribute('imagesrcset')).not.toContain('desktop.webp');
  });
  it('switches between the catalog and storefront when no sales homepage is selected', async () => {
    settings.mode = 'website'; const { rerender } = render(<HomePage />);
    expect(await screen.findByText('Product and category storefront')).toBeInTheDocument();
    expect(screen.queryByText('Sales page catalog')).not.toBeInTheDocument();
    settings.mode = 'landing'; rerender(<HomePage />);
    expect(await screen.findByText('Sales page catalog')).toBeInTheDocument();
    expect(screen.queryByText('Product and category storefront')).not.toBeInTheDocument();
    settings.mode = 'website'; rerender(<HomePage />);
    expect(await screen.findByText('Product and category storefront')).toBeInTheDocument();
  });
  it('renders the selected sales page at home and restores the storefront in website mode', async () => {
    settings.mode = 'landing';
    settings.homepageId = 'sales-id';
    settings.available = true;
    const { rerender } = render(<HomePage />);
    expect(await screen.findByText('Selected sales homepage')).toBeInTheDocument();
    settings.mode = 'website';
    rerender(<HomePage />);
    expect(await screen.findByText('Product and category storefront')).toBeInTheDocument();
  });
  it('falls back to the catalog when the selected sales page is unavailable', async () => {
    settings.homepageId = 'sales-id';
    render(<HomePage />);
    expect(await screen.findByText('Sales page catalog')).toBeInTheDocument();
  });
  it('uses the landing catalog for an unrecognized saved mode', async () => {
    settings.mode = 'invalid'; render(<HomePage />);
    expect(await screen.findByText('Sales page catalog')).toBeInTheDocument();
  });
  it('provides the exact persisted mode when an administrator selects either option', () => {
    const onChange = vi.fn(); const { rerender } = render(<SiteModeSettings value="landing" onChange={onChange} />);
    const radios = screen.getAllByRole('radio'); expect(radios[0]).toBeChecked();
    fireEvent.click(radios[1]); expect(onChange).toHaveBeenLastCalledWith('website');
    rerender(<SiteModeSettings value="website" onChange={onChange} />);
    expect(radios[1]).toBeChecked(); fireEvent.click(radios[0]); expect(onChange).toHaveBeenLastCalledWith('landing');
  });
});
