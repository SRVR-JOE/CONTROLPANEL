/**
 * Render tests for the DroppableSlot component.
 *
 * DroppableSlot uses @dnd-kit/core's useDroppable hook. We mock it so the
 * component renders as a plain div, then assert on:
 *  - RU number display
 *  - Valid/invalid visual state (border and background color changes)
 *  - Highlighted state
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ============================================================
// Mock @dnd-kit/core — useDroppable hook
// isOver is false by default — individual tests override via the factory
// ============================================================

// Mutable flag so individual tests can simulate isOver=true
let mockIsOver = false;

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: mockIsOver,
  }),
}));

// Mock RU_HEIGHT constant
vi.mock('@/components/rack/RackUnit', () => ({
  RU_HEIGHT: 20,
}));

// ============================================================
// Import component after mocks are defined
// ============================================================

import DroppableSlot from '../DroppableSlot';

// ============================================================
// Helpers
// ============================================================

/** Default neutral border color from the component's no-state branch */
const NEUTRAL_BORDER = 'var(--border)';
/** Valid drop target border */
const VALID_BORDER = 'rgba(59, 130, 246, 0.6)';
/** Invalid drop target border */
const INVALID_BORDER = 'rgba(239, 68, 68, 0.6)';

/** Valid drop target background */
const VALID_BG = 'rgba(59, 130, 246, 0.08)';
/** Invalid drop target background */
const INVALID_BG = 'rgba(239, 68, 68, 0.08)';

// ============================================================
// Tests — basic rendering
// ============================================================

describe('DroppableSlot — basic rendering', () => {
  it('renders the RU number as text', () => {
    render(<DroppableSlot rackId="rack-1" column={0} ru={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders different RU numbers correctly', () => {
    const { rerender } = render(<DroppableSlot rackId="rack-1" column={0} ru={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();

    rerender(<DroppableSlot rackId="rack-1" column={0} ru={26} />);
    expect(screen.getByText('26')).toBeInTheDocument();
  });

  it('renders in a neutral state when isHighlighted is false and isOver is false', () => {
    const { container } = render(
      <DroppableSlot rackId="rack-1" column={0} ru={3} isHighlighted={false} />
    );
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.style.borderColor).toBe(NEUTRAL_BORDER);
    // jsdom preserves 'transparent' as a string — neither blue nor red should be applied
    const bg = rootDiv.style.background;
    expect(bg).not.toBe(VALID_BG);
    expect(bg).not.toBe(INVALID_BG);
  });
});

// ============================================================
// Tests — highlighted state (isHighlighted=true, not isOver)
// ============================================================

describe('DroppableSlot — highlighted state', () => {
  it('shows valid (blue) style when isHighlighted=true and isValidTarget=true', () => {
    const { container } = render(
      <DroppableSlot
        rackId="rack-1"
        column={0}
        ru={2}
        isHighlighted
        isValidTarget={true}
      />
    );
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.style.borderColor).toBe(VALID_BORDER);
    expect(rootDiv.style.background).toBe(VALID_BG);
  });

  it('shows invalid (red) style when isHighlighted=true and isValidTarget=false', () => {
    const { container } = render(
      <DroppableSlot
        rackId="rack-1"
        column={0}
        ru={2}
        isHighlighted
        isValidTarget={false}
      />
    );
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.style.borderColor).toBe(INVALID_BORDER);
    expect(rootDiv.style.background).toBe(INVALID_BG);
  });

  it('shows neutral style when isHighlighted=true but isValidTarget is undefined', () => {
    // When isHighlighted is true but isValidTarget is not set, neither valid nor invalid branch runs
    const { container } = render(
      <DroppableSlot
        rackId="rack-1"
        column={0}
        ru={4}
        isHighlighted
        isValidTarget={undefined}
      />
    );
    const rootDiv = container.firstChild as HTMLElement;
    // Neither valid (blue) nor invalid (red) should be applied
    expect(rootDiv.style.borderColor).not.toBe(VALID_BORDER);
    expect(rootDiv.style.borderColor).not.toBe(INVALID_BORDER);
  });
});

// ============================================================
// Tests — isOver state (simulated via mock)
// ============================================================

describe('DroppableSlot — isOver state', () => {
  it('shows valid (blue) style when isOver=true and isValidTarget=true', () => {
    mockIsOver = true;
    const { container } = render(
      <DroppableSlot
        rackId="rack-1"
        column={0}
        ru={7}
        isValidTarget={true}
      />
    );
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.style.borderColor).toBe(VALID_BORDER);
    expect(rootDiv.style.background).toBe(VALID_BG);
    mockIsOver = false;
  });

  it('shows invalid (red) style when isOver=true and isValidTarget=false', () => {
    mockIsOver = true;
    const { container } = render(
      <DroppableSlot
        rackId="rack-1"
        column={0}
        ru={8}
        isValidTarget={false}
      />
    );
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.style.borderColor).toBe(INVALID_BORDER);
    expect(rootDiv.style.background).toBe(INVALID_BG);
    mockIsOver = false;
  });
});

// ============================================================
// Tests — style isolation
// ============================================================

describe('DroppableSlot — state isolation between renders', () => {
  it('different slots at different RUs render their respective RU number', () => {
    const { unmount: u1 } = render(<DroppableSlot rackId="rack-x" column={0} ru={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    u1();

    render(<DroppableSlot rackId="rack-x" column={0} ru={20} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('valid and invalid slots have distinct border colors', () => {
    const { container: validContainer } = render(
      <DroppableSlot rackId="rack-1" column={0} ru={1} isHighlighted isValidTarget={true} />
    );
    const { container: invalidContainer } = render(
      <DroppableSlot rackId="rack-1" column={0} ru={2} isHighlighted isValidTarget={false} />
    );

    const validRoot = validContainer.firstChild as HTMLElement;
    const invalidRoot = invalidContainer.firstChild as HTMLElement;

    expect(validRoot.style.borderColor).toBe(VALID_BORDER);
    expect(invalidRoot.style.borderColor).toBe(INVALID_BORDER);
    expect(validRoot.style.borderColor).not.toBe(invalidRoot.style.borderColor);
  });
});
