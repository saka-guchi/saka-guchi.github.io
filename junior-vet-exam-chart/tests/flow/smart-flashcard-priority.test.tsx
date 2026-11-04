import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickFlashCardModal } from '../../src/components/QuickFlashCardModal';

describe('要点暗記カード（QuickFlashCardModal）スマート出題（忘れかけ優先＆シャッフル）結合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ヘッダーに「🧠 忘れかけ優先」バッジが表示されていること', () => {
    render(<QuickFlashCardModal onClose={() => {}} />);
    expect(screen.getByTestId('smart-priority-badge')).toHaveTextContent('🧠 忘れかけ優先');
  });

  it('記憶定着度が低い（忘れかけている）単元が優先的に最初の方に出題されること', () => {
    // 2つの理科単元の記憶キープ度を設定
    // skill-rika-gas-co2（二酸化炭素）を 10%（極めて忘れかけ）に設定
    // skill-rika-plant-dicot-monocot（単子葉・双子葉）を 100%（完璧定着）に設定
    localStorage.setItem('junior_vet_memory_retention_skill-rika-gas-co2', '10');
    localStorage.setItem('junior_vet_memory_retention_skill-rika-plant-dicot-monocot', '100');

    render(<QuickFlashCardModal initialSkillId="skill-rika-gas-co2" onClose={() => {}} />);

    // 最初に出題されるカードは 10% の忘れかけ単元であること
    expect(screen.getByTestId('flashcard-retention-val')).toHaveTextContent('10%');
  });

  it('initialSkillIdが指定された場合、その指定単元が1枚目として確実に表示されること', () => {
    render(<QuickFlashCardModal initialSkillId="skill-rika-plant-vascular" onClose={() => {}} />);
    // 維管束のカードが表示されていること
    expect(screen.getByText(/維管束/)).toBeInTheDocument();
  });

  it('カードをめくって「思い出せた！」を押すと記憶キープ度が+20%ブーストされること', () => {
    localStorage.setItem('junior_vet_memory_retention_skill-rika-gas-co2', '20');

    render(<QuickFlashCardModal initialSkillId="skill-rika-gas-co2" onClose={() => {}} />);
    expect(screen.getByTestId('flashcard-retention-val')).toHaveTextContent('20%');

    // カードをタップして裏返す
    const flipArea = screen.getByText('👆 タップして【答えと獣医ポイント】を見る');
    fireEvent.click(flipArea);

    // 「思い出せた！」ボタンを押す
    const boostBtn = screen.getByTestId('flashcard-remembered-btn');
    fireEvent.click(boostBtn);

    // 40% に上昇すること
    expect(screen.getByTestId('flashcard-retention-val')).toHaveTextContent('40%');
  });
});
