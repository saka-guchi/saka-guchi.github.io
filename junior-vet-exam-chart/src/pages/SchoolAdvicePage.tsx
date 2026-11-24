import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SCHOOL_ADVICE_DATA,
  type SchoolId,
  type AdviceItem,
  type AdviceSection,
} from '../data/school-advice-data';
import {
  getTodayCheckedItemIds,
  toggleAdviceItemCheck,
  resetTodayChecks,
  getSchoolCompletionStats,
} from '../utils/school-advice';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';
import styles from './SchoolAdvicePage.module.css';

export const SchoolAdvicePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSchool = (searchParams.get('school') as SchoolId) || 'chiyoda';
  const [selectedSchoolId, setSelectedSchoolId] = useState<SchoolId>(
    initialSchool === 'meguro' ? 'meguro' : 'chiyoda'
  );
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => getTodayCheckedItemIds());

  useEffect(() => {
    const handleUpdate = () => {
      setCheckedIds(getTodayCheckedItemIds());
    };
    window.addEventListener('school-advice-updated', handleUpdate);
    return () => window.removeEventListener('school-advice-updated', handleUpdate);
  }, []);

  const handleSelectSchool = (schoolId: SchoolId) => {
    sound.playPop();
    setSelectedSchoolId(schoolId);
    setSearchParams({ school: schoolId });
  };

  const handleToggle = (itemId: string) => {
    const checked = toggleAdviceItemCheck(itemId);
    setCheckedIds(getTodayCheckedItemIds());
    if (checked) {
      sound.playAnimalHappy();
      const stats = getSchoolCompletionStats(selectedSchoolId);
      if (stats.checked === stats.total && stats.total > 0) {
        fireConfetti({ count: 40 });
      }
    } else {
      sound.playPop();
    }
  };

  const handleReset = () => {
    sound.playPop();
    resetTodayChecks(selectedSchoolId);
    setCheckedIds(getTodayCheckedItemIds());
  };

  const currentSchool = SCHOOL_ADVICE_DATA[selectedSchoolId];
  const stats = getSchoolCompletionStats(selectedSchoolId);

  const renderItemText = (item: AdviceItem) => {
    if (!item.highlightText) {
      return item.text;
    }
    const parts = item.text.split(item.highlightText);
    if (parts.length <= 1) {
      return item.text;
    }
    return (
      <>
        {parts[0]}
        <span className={styles.highlight}>{item.highlightText}</span>
        {parts.slice(1).join(item.highlightText)}
      </>
    );
  };

  const renderBadge = (item: AdviceItem) => {
    if (!item.badge) return null;
    let badgeClass = styles.badgePriority;
    if (item.badge.type === 'bonus') badgeClass = styles.badgeBonus;
    if (item.badge.type === 'warn') badgeClass = styles.badgeWarn;
    return <span className={badgeClass}>{item.badge.text}</span>;
  };

  const renderItemList = (items: AdviceItem[]) => {
    return (
      <ul className={styles.itemList}>
        {items.map(item => {
          const isChecked = checkedIds.has(item.id);
          return (
            <li
              key={item.id}
              className={`${styles.itemRow} ${isChecked ? styles.itemChecked : ''}`}
              onClick={() => handleToggle(item.id)}
              data-testid={`advice-item-${item.id}`}
            >
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={isChecked}
                onChange={() => {}}
                aria-label={item.text}
              />
              <div className={styles.itemContent}>
                {renderBadge(item)}
                {renderItemText(item)}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderSection = (section: AdviceSection) => {
    let themeModClass = styles.theme_common;
    if (section.themeClass === 'kokugo') themeModClass = styles.theme_kokugo;
    if (section.themeClass === 'sansu') themeModClass = styles.theme_sansu;
    if (section.themeClass === 'rika') themeModClass = styles.theme_rika;
    if (section.themeClass === 'shakai') themeModClass = styles.theme_shakai;
    if (section.themeClass === 'card-warn') themeModClass = styles.theme_card_warn;

    return (
      <section
        key={section.id}
        className={`${styles.sectionCard} ${themeModClass}`}
        data-testid={`section-${section.id}`}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {section.rubyTitle ? (
              section.rubyTitle.map((rt, idx) =>
                rt.ruby ? (
                  <ruby key={idx}>
                    {rt.text}
                    <rt>{rt.ruby}</rt>
                  </ruby>
                ) : (
                  <span key={idx}>{rt.text}</span>
                )
              )
            ) : (
              section.title
            )}
          </h2>
          <div className={styles.doctorBadge} title={section.doctorTitle}>
            <span>{section.doctorAvatar}</span>
            <span>{section.doctorTitle}</span>
          </div>
        </div>

        {section.directItems && renderItemList(section.directItems)}

        {section.subSections && (
          <div className={styles.grid2}>
            {section.subSections.map((sub, sIdx) => (
              <div key={sIdx} className={styles.box}>
                <h3 className={styles.boxTitle}>{sub.title}</h3>
                {renderItemList(sub.items)}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className={styles.pageContainer} data-testid="school-advice-page">
      <div className={styles.innerContainer}>
        {/* ナビゲーションバー */}
        <div className={styles.navHeader}>
          <button
            className={styles.backBtn}
            onClick={() => {
              sound.playPop();
              navigate('/');
            }}
            data-testid="back-to-home-btn"
          >
            ← ホームへもどる
          </button>

          <div className={styles.schoolTabs} role="tablist">
            <button
              className={`${styles.schoolTabBtn} ${selectedSchoolId === 'chiyoda' ? styles.schoolTabBtnActive : ''}`}
              onClick={() => handleSelectSchool('chiyoda')}
              data-testid="tab-chiyoda"
              role="tab"
              aria-selected={selectedSchoolId === 'chiyoda'}
            >
              🏥 千代田中学校
            </button>
            <button
              className={`${styles.schoolTabBtn} ${selectedSchoolId === 'meguro' ? styles.schoolTabBtnActive : ''}`}
              onClick={() => handleSelectSchool('meguro')}
              data-testid="tab-meguro"
              role="tab"
              aria-selected={selectedSchoolId === 'meguro'}
            >
              🏥 多摩大目黒中学校
            </button>
          </div>
        </div>

        {/* ヒーローヘッダー */}
        <header
          className={styles.heroHeader}
          style={{ background: currentSchool.headerGradient }}
        >
          <div className={styles.hospitalBadge}>{currentSchool.hospitalName}</div>
          <h1 className={styles.mainTitle}>{currentSchool.headerTitle}</h1>
          <p className={styles.subTitle}>{currentSchool.headerSubTitle}</p>
        </header>

        {/* 達成度バー */}
        <div className={styles.progressSummaryCard} data-testid="progress-summary-card">
          <div className={styles.progressInfo}>
            <div className={styles.progressLabelRow}>
              <span>
                🌟 今日のクリア度: <strong>{stats.checked} / {stats.total} 項目</strong>
                {stats.checked === stats.total && stats.total > 0 ? '（全達成！🎉）' : ''}
              </span>
              <span><strong>{stats.percent}%</strong></span>
            </div>
            <div className={styles.progressBarBg} aria-label="達成度プログレスバー">
              <div
                className={styles.progressBarFill}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
          <button
            className={styles.resetBtn}
            onClick={handleReset}
            title="今日のチェックをリセット"
          >
            🔄 今日の分をリセット
          </button>
        </div>

        {/* 各セクション */}
        <div className={styles.sectionsList}>
          {currentSchool.sections.map(sec => renderSection(sec))}
        </div>

        {/* フッター */}
        <footer className={styles.footer}>
          {currentSchool.footerMessage}
        </footer>
      </div>
    </div>
  );
};
