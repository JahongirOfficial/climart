import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PartnerModal } from '../PartnerModal';
import { Partner } from '@shared/api';

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('PartnerModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders modal with correct title for new partner', () => {
    render(
      <PartnerModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Yangi kontragent')).toBeInTheDocument();
  });

  it('renders modal with correct title for editing partner', () => {
    const partner: Partner = {
      _id: '1',
      code: 'P001',
      name: 'Test Partner',
      type: 'customer',
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <PartnerModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        partner={partner}
      />
    );

    expect(screen.getByText('Kontragentni tahrirlash')).toBeInTheDocument();
  });

  it('allows selecting partner type', async () => {
    render(
      <PartnerModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const typeSelect = screen.getByLabelText('Turi *');
    fireEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.getByText('Mijoz')).toBeInTheDocument();
      expect(screen.getByText('Yetkazib beruvchi')).toBeInTheDocument();
      expect(screen.getByText('Ikkalasi')).toBeInTheDocument();
    });
  });

  it('submits form with correct data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <PartnerModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText('Nomi *');
    fireEvent.change(nameInput, { target: { value: 'New Partner' } });

    const submitButton = screen.getByText('Saqlash');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/partners',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('handles form validation', () => {
    render(
      <PartnerModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText('Nomi *') as HTMLInputElement;
    expect(nameInput.required).toBe(true);
  });
});
