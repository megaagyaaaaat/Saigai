import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegionDetailsPanel } from '../components/regions/RegionDetailsPanel';
import { MOCK_REGIONS } from '../data/mockRegions';
import { MOCK_INCIDENTS } from '../data/mockIncidents';
import { MOCK_RAINFALL_OBSERVATIONS, MOCK_RAINFALL_SERIES_MAP } from '../data/mockRainfall';
import { MOCK_WARNINGS, MOCK_STATIONS } from '../data/mockStations';

// Mock ECharts react wrapper in tests
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

describe('RegionDetailsPanel Component', () => {
  const mockRegion = MOCK_REGIONS[0];
  const mockData = {
    region: mockRegion,
    incidents: MOCK_INCIDENTS.filter((i) => i.regionId === mockRegion.id),
    rainfall: MOCK_RAINFALL_OBSERVATIONS.filter((r) => r.regionId === mockRegion.id),
    rainfallSeries: MOCK_RAINFALL_SERIES_MAP[mockRegion.id] || [],
    warnings: MOCK_WARNINGS.filter((w) => w.regionId === mockRegion.id),
    stations: MOCK_STATIONS.filter((s) => s.regionId === mockRegion.id),
  };

  it('renders region title and cross-state extent', () => {
    render(<RegionDetailsPanel data={mockData} onClose={vi.fn()} />);

    expect(screen.getByText(mockRegion.name)).toBeInTheDocument();
    expect(screen.getByText(/Meghalaya · Assam/i)).toBeInTheDocument();
  });

  it('displays correct summary metrics', () => {
    render(<RegionDetailsPanel data={mockData} onClose={vi.fn()} />);

    expect(screen.getByText(`${mockRegion.avgRainfall72h}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockRegion.soilSaturationPercent}%`)).toBeInTheDocument();
  });

  it('switches tabs and displays active warnings', () => {
    render(<RegionDetailsPanel data={mockData} onClose={vi.fn()} />);

    const warningsTab = screen.getByRole('button', { name: /Alerts & Warnings/i });
    fireEvent.click(warningsTab);

    // Warning title from mock data should appear
    expect(screen.getByText(/RED ALERT: High Probability of Debris Flows/i)).toBeInTheDocument();
  });
});
