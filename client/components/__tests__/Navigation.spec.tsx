import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navigation', () => {
  const renderNavigation = () => {
    return render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  };

  it('renders all main modules', () => {
    renderNavigation();

    expect(screen.getByText("Ko'rsatkichlar")).toBeInTheDocument();
    expect(screen.getByText('Xaridlar')).toBeInTheDocument();
    expect(screen.getByText('Savdo')).toBeInTheDocument();
    expect(screen.getByText('Tovarlar')).toBeInTheDocument();
    expect(screen.getByText('Kontragentlar')).toBeInTheDocument();
    expect(screen.getByText('Ombor')).toBeInTheDocument();
    expect(screen.getByText('Pul')).toBeInTheDocument();
  });

  it('shows submenu on hover', async () => {
    renderNavigation();

    const purchasesButton = screen.getByText('Xaridlar');
    fireEvent.mouseEnter(purchasesButton);

    expect(screen.getByText("Ta'minotchiga buyurtma yaratish")).toBeInTheDocument();
    expect(screen.getByText('Qabul qilish')).toBeInTheDocument();
  });

  it('shows sales submenu items', () => {
    renderNavigation();

    const salesButton = screen.getByText('Savdo');
    fireEvent.mouseEnter(salesButton);

    expect(screen.getByText('Mijozlarning buyurtmalari')).toBeInTheDocument();
    expect(screen.getByText('Yuklab yuborish')).toBeInTheDocument();
  });

  it('shows warehouse submenu items', () => {
    renderNavigation();

    const warehouseButton = screen.getByText('Ombor');
    fireEvent.mouseEnter(warehouseButton);

    expect(screen.getByText('Kirim qilish')).toBeInTheDocument();
    expect(screen.getByText('Chiqim qilish')).toBeInTheDocument();
    expect(screen.getByText("Ko'chirish")).toBeInTheDocument();
  });

  it('shows contacts submenu items', () => {
    renderNavigation();

    const contactsButton = screen.getByText('Kontragentlar');
    fireEvent.mouseEnter(contactsButton);

    expect(screen.getByText('Hamkorlar')).toBeInTheDocument();
    expect(screen.getByText('Shartnomalar')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
  });

  it('navigates to module without submenu', () => {
    renderNavigation();

    const ecommerceButton = screen.getByText('Onlayn savdo');
    fireEvent.click(ecommerceButton);

    expect(mockNavigate).toHaveBeenCalledWith('/ecommerce');
  });
});
