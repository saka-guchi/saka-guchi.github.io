import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AnimatedVetPet } from '../../src/components/AnimatedVetPet';

describe('AnimatedVetPet Component Tests', () => {
  it('renders SVG animation elements for nurse cat Mike-chan', () => {
    render(<AnimatedVetPet size={48} />);

    const pet = screen.getByTestId('header-vet-pet');
    expect(pet).toBeInTheDocument();
    expect(pet).toHaveAttribute('title', expect.stringContaining('ナース猫のミケちゃん'));

    // SVGタグおよび内部要素が存在すること
    const svg = pet.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('triggers cheer bubble and floating heart on click', () => {
    vi.useFakeTimers();
    render(<AnimatedVetPet size={48} />);

    const pet = screen.getByTestId('header-vet-pet');
    fireEvent.click(pet);

    // 応援メッセージ吹き出しが表示されること
    const bubble = screen.getByRole('status');
    expect(bubble).toBeInTheDocument();
    expect(bubble.textContent).toMatch(/がんばるにゃ|ファイト|カルテ|サクラ|集中力/);

    // 一定時間後に消えること
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});

