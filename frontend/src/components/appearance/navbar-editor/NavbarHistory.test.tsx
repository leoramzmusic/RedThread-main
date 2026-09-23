import { render, screen } from '@testing-library/react';
import NavbarHistory from './NavbarHistory';
import { AppearanceHistory, HistoryAction } from '../../../types/appearance';

const rows: AppearanceHistory[] = [
  { _id: 'h1', resource_id: 'a', action: HistoryAction.UPDATED, user_id: 'u1', user_name: 'Admin', context: 'Cambio de estilo', timestamp: '2026-09-23T10:00:00.000Z' },
];

describe('NavbarHistory', () => {
  it('renders rows with action and user', () => {
    render(<NavbarHistory history={rows} onClear={() => {}} />);
    expect(screen.getByText('updated')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Cambio de estilo')).toBeInTheDocument();
  });

  it('shows empty message and disabled clear when no history', () => {
    render(<NavbarHistory history={[]} onClear={() => {}} />);
    expect(screen.getByText(/No hay historial/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Limpiar Historial/i })).toBeDisabled();
  });
});