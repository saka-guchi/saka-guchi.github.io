import React, { useState, useEffect, useRef } from 'react';
import styles from './MentalCareModal.module.css';
import {
  INITIAL_SORTING_CARDS,
  COPING_RECIPES,
  PHILOSOPHY_TOPICS,
  type SortingCardItem,
  type CopingCategory,
  type DialogChoice,
} from '../data/mental-care-data';
import {
  getSavedCopingIds,
  toggleSavedCopingId,
  getCustomSortingCards,
  saveCustomSortingCard,
  deleteCustomSortingCard,
  getCompletedTopicIds,
  markTopicCompleted,
  getTodayCheckin,
  saveTodayCheckin,
  type CustomSortingCard,
  type WeatherType,
  type TodayCheckin,
} from '../utils/mental-care-store';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';

interface MentalCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'puzzle' | 'coping' | 'philosophy';
}

export const MentalCareModal: React.FC<MentalCareModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'puzzle',
}) => {
  const [activeTab, setActiveTab] = useState<'puzzle' | 'coping' | 'philosophy'>(initialTab);

  // Tab 1: パズル用状態
  const [sortedCards, setSortedCards] = useState<Record<string, 'self' | 'others'>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
    card: SortingCardItem;
  } | null>(null);
  const [customCards, setCustomCards] = useState<CustomSortingCard[]>([]);
  const [newCardText, setNewCardText] = useState('');
  const [newCardCategory, setNewCardCategory] = useState<'self' | 'others'>('self');

  // Tab 2: コーピング図鑑用状態
  const [savedCopingIds, setSavedCopingIds] = useState<string[]>([]);
  const [copingCategory, setCopingCategory] = useState<'all' | CopingCategory | 'saved'>('all');
  const [highlightedCopingId, setHighlightedCopingId] = useState<string | null>(null);
  const [triedToast, setTriedToast] = useState<string | null>(null);

  // Tab 3: 哲学対話用状態
  const [selectedTopicId, setSelectedTopicId] = useState<string>(PHILOSOPHY_TOPICS[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<DialogChoice | null>(null);
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);

  // こころのお天気状態
  const [todayWeather, setTodayWeather] = useState<TodayCheckin | null>(null);
  const [weatherToast, setWeatherToast] = useState<string | null>(null);

  const weatherTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSavedCopingIds(getSavedCopingIds());
      setCustomCards(getCustomSortingCards());
      setCompletedTopicIds(getCompletedTopicIds());
      setTodayWeather(getTodayCheckin());
    }
  }, [isOpen]);

  const handleWeatherSelect = (weather: WeatherType, weatherLabel: string) => {
    sound.playAnimalHappy();
    const today = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()).replace(/\//g, '-');

    const newCheckin: TodayCheckin = {
      date: today,
      weather,
      weatherLabel,
    };
    saveTodayCheckin(newCheckin);
    setTodayWeather(newCheckin);
    setWeatherToast('お天気を記録したよ！ありがとう🐾');
    if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
    weatherTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setWeatherToast(null);
      }
    }, 3000);
  };

  if (!isOpen) return null;

  // --- Tab 1: パズル操作 ---
  const allCards = INITIAL_SORTING_CARDS;
  const currentCard = allCards[currentCardIndex];
  const isAllSorted = currentCardIndex >= allCards.length;

  const handleSort = (target: 'self' | 'others') => {
    if (!currentCard) return;
    const isCorrect = currentCard.category === target;
    if (isCorrect) {
      sound.playAnimalHappy();
    } else {
      sound.playPop();
    }

    setLastFeedback({
      isCorrect,
      explanation: currentCard.explanation,
      card: currentCard,
    });

    setSortedCards(prev => ({ ...prev, [currentCard.id]: target }));
    setCurrentCardIndex(prev => prev + 1);

    if (currentCardIndex + 1 >= allCards.length) {
      fireConfetti({ count: 30 });
    }
  };

  const handleResetPuzzle = () => {
    sound.playPop();
    setSortedCards({});
    setCurrentCardIndex(0);
    setLastFeedback(null);
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardText.trim()) return;
    sound.playAnimalHappy();
    const updated = saveCustomSortingCard({
      text: newCardText.trim(),
      category: newCardCategory,
    });
    setCustomCards(updated);
    setNewCardText('');
  };

  const handleDeleteCustomCard = (id: string) => {
    sound.playPop();
    const updated = deleteCustomSortingCard(id);
    setCustomCards(updated);
  };

  // --- Tab 2: コーピング操作 ---
  const handleToggleSave = (id: string) => {
    sound.playPop();
    const next = toggleSavedCopingId(id);
    setSavedCopingIds(next);
  };

  const handleGacha = () => {
    sound.playAnimalHappy();
    fireConfetti({ count: 20 });
    const randomIndex = Math.floor(Math.random() * COPING_RECIPES.length);
    const item = COPING_RECIPES[randomIndex];
    setHighlightedCopingId(item.id);
    setCopingCategory('all');
  };

  const handleTryCoping = (title: string) => {
    sound.playAnimalHappy();
    setTriedToast(`「${title}」を試したね！えらい！自分を大切にできたよ🐾`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setTriedToast(null);
      }
    }, 3500);
  };

  const filteredCopings = COPING_RECIPES.filter(item => {
    if (copingCategory === 'saved') {
      return savedCopingIds.includes(item.id);
    }
    if (copingCategory === 'all') return true;
    return item.category === copingCategory;
  });

  // --- Tab 3: 哲学対話操作 ---
  const currentTopic = PHILOSOPHY_TOPICS.find(t => t.id === selectedTopicId) || PHILOSOPHY_TOPICS[0];
  const currentStep = currentTopic.steps[currentStepIndex];
  const isTopicFinished = currentStepIndex >= currentTopic.steps.length;

  const handleSelectTopic = (id: string) => {
    sound.playPop();
    setSelectedTopicId(id);
    setCurrentStepIndex(0);
    setSelectedChoice(null);
  };

  const handleSelectChoice = (choice: DialogChoice) => {
    sound.playAnimalHappy();
    setSelectedChoice(choice);
  };

  const handleNextStep = () => {
    sound.playPop();
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    setSelectedChoice(null);

    if (nextIdx >= currentTopic.steps.length) {
      fireConfetti({ count: 35 });
      const nextCompleted = markTopicCompleted(currentTopic.id);
      setCompletedTopicIds(nextCompleted);
    }
  };

  const handleRestartTopic = () => {
    sound.playPop();
    setCurrentStepIndex(0);
    setSelectedChoice(null);
  };

  return (
    <div className={styles.overlay} onClick={onClose} data-testid="mental-care-modal">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>💚</div>
            <div>
              <h2 className={styles.headerTitle}>🐾 こころの相談室・マインドカルテ</h2>
              <p className={styles.headerSubtitle}>
                モヤモヤしたときの気持ちの整理・ストレス解消・自分を守る心のレッスン
              </p>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
            title="閉じる"
            data-testid="mental-care-close-btn"
          >
            ✕
          </button>
        </div>

        {/* こころのお天気チェックインバー */}
        <div className={styles.weatherCheckinBar} data-testid="weather-checkin-bar">
          <span className={styles.weatherCheckinLabel}>
            🌤️ いまの心のお天気は？:
          </span>
          <div className={styles.weatherButtonGroup}>
            {[
              { type: 'sunny' as WeatherType, icon: '☀️', label: 'はれ' },
              { type: 'cloudy' as WeatherType, icon: '⛅', label: 'くもり' },
              { type: 'rainy' as WeatherType, icon: '🌧️', label: 'あめ' },
              { type: 'storm' as WeatherType, icon: '⛈️', label: 'あらし' },
            ].map(w => {
              const isSelected = todayWeather?.weather === w.type;
              return (
                <button
                  key={w.type}
                  type="button"
                  className={`${styles.weatherBtn} ${isSelected ? styles.weatherBtnSelected : ''}`}
                  onClick={() => handleWeatherSelect(w.type, w.label)}
                  title={`いまの気持ち: ${w.label}`}
                  data-testid={`weather-btn-${w.type}`}
                >
                  <span>{w.icon}</span>
                  <span>{w.label}</span>
                </button>
              );
            })}
          </div>
          {weatherToast && (
            <span className={styles.weatherToastText} data-testid="weather-toast">
              {weatherToast}
            </span>
          )}
        </div>

        {/* タブバー */}
        <div className={styles.tabBar} role="tablist">
          <button
            className={`${styles.tabBtn} ${activeTab === 'puzzle' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              sound.playPop();
              setActiveTab('puzzle');
            }}
            data-testid="tab-puzzle"
          >
            🧩 モヤモヤ仕分けパズル
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'coping' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              sound.playPop();
              setActiveTab('coping');
            }}
            data-testid="tab-coping"
          >
            🧰 お守りコーピング図鑑
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'philosophy' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              sound.playPop();
              setActiveTab('philosophy');
            }}
            data-testid="tab-philosophy"
          >
            🦉 哲学対話ノート
          </button>
        </div>

        {/* ボディコンテンツ */}
        <div className={styles.body}>
          {/* =========================================================
              タブ1: モヤモヤ仕分けパズル
             ========================================================= */}
          {activeTab === 'puzzle' && (
            <div>
              <div className={styles.puzzleIntro}>
                <strong>💡 課題の分離（じぶんとまわりの境界線）</strong>
                <br />
                世の中には「じぶんで変えられること」と「相手や周りのこと（変えられないこと）」があります。
                相手の態度や大人の機嫌は、相手の宿題。あなたが全部背負わなくて大丈夫！カードを仕分けて心を整理しよう。
              </div>

              {/* 仕分け前ステージ */}
              {!isAllSorted ? (
                <div className={styles.activeCardStage}>
                  <div style={{ fontSize: '32px' }}>{currentCard.icon}</div>
                  <div className={styles.activeCardTitle}>{currentCard.text}</div>
                  <div className={styles.activeCardHint}>ヒント: {currentCard.hint}</div>

                  <div className={styles.sortActionBtns}>
                    <button
                      className={styles.btnSortSelf}
                      onClick={() => handleSort('self')}
                      data-testid="btn-sort-self"
                    >
                      🙋‍♀️ じぶんの箱へ（変えられる！）
                    </button>
                    <button
                      className={styles.btnSortOthers}
                      onClick={() => handleSort('others')}
                      data-testid="btn-sort-others"
                    >
                      🌍 まわりの箱へ（変えられない）
                    </button>
                  </div>

                  {lastFeedback && (
                    <div className={styles.feedbackBanner}>
                      <strong>
                        {lastFeedback.isCorrect ? '✨ その通り！' : '💡 なるほど、こう考えると心が軽くなるよ！'}
                      </strong>
                      <div style={{ marginTop: '4px' }}>{lastFeedback.explanation}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.cardBox} style={{ textAlign: 'center', background: '#f0fff4' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#22543d' }}>
                    全8問の仕分け完了！頭の中がスッキリ整理できたね！
                  </h3>
                  <p style={{ fontSize: '13px', color: '#276749', marginBottom: '14px' }}>
                    まわりの箱に入ったものは、あなたが背負わなくていい「相手の課題」です。
                    自分の箱に入った小さな一歩（休む、話す、好きなことをする）を大切にしようね。
                  </p>
                  <button
                    className={styles.btnSortSelf}
                    onClick={handleResetPuzzle}
                    style={{ fontSize: '13px', padding: '8px 18px' }}
                  >
                    🔄 もう一度仕分けてみる
                  </button>
                </div>
              )}

              {/* 仕分け済みアリーナ */}
              <div className={styles.sortingArena}>
                {/* じぶんの箱 */}
                <div className={styles.boxSelf}>
                  <div className={styles.boxHeader}>
                    <span style={{ fontSize: '20px' }}>🙋‍♀️</span>
                    <span className={styles.boxTitleSelf}>じぶんの箱（変えられること）</span>
                  </div>
                  <div className={styles.boxDesc}>
                    自分の行動、休む勇気、好きな過ごし方など、自分で決められること
                  </div>
                  <div className={styles.boxList}>
                    {allCards
                      .filter(c => sortedCards[c.id] === 'self')
                      .map(c => (
                        <div key={c.id} className={styles.sortedChip} style={{ borderLeft: '4px solid #48bb78' }}>
                          <span>{c.icon} {c.text}</span>
                        </div>
                      ))}
                    {customCards
                      .filter(c => c.category === 'self')
                      .map(c => (
                        <div key={c.id} className={styles.sortedChip} style={{ borderLeft: '4px solid #48bb78' }}>
                          <span>✏️ {c.text}</span>
                          <button
                            onClick={() => handleDeleteCustomCard(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* まわりの箱 */}
                <div className={styles.boxOthers}>
                  <div className={styles.boxHeader}>
                    <span style={{ fontSize: '20px' }}>🌍</span>
                    <span className={styles.boxTitleOthers}>まわりの箱（変えられないこと）</span>
                  </div>
                  <div className={styles.boxDesc}>
                    先生の態度、他人の機嫌、学校のルールなど、自分の力では変えられないこと
                  </div>
                  <div className={styles.boxList}>
                    {allCards
                      .filter(c => sortedCards[c.id] === 'others')
                      .map(c => (
                        <div key={c.id} className={styles.sortedChip} style={{ borderLeft: '4px solid #ecc94b' }}>
                          <span>{c.icon} {c.text}</span>
                        </div>
                      ))}
                    {customCards
                      .filter(c => c.category === 'others')
                      .map(c => (
                        <div key={c.id} className={styles.sortedChip} style={{ borderLeft: '4px solid #ecc94b' }}>
                          <span>✏️ {c.text}</span>
                          <button
                            onClick={() => handleDeleteCustomCard(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* じぶんのモヤモヤも仕分けてみる自由追加フォーム */}
              <div className={styles.customAddGroup}>
                <div className={styles.customAddTitle}>
                  ✍️ あなたの今のモヤモヤも箱に入れて整理してみよう
                </div>
                <form className={styles.customAddForm} onSubmit={handleAddCustomCard}>
                  <input
                    type="text"
                    className={styles.customInput}
                    placeholder="例：先生が男子ばかり見て話す、友達が返事をしてくれなかった"
                    value={newCardText}
                    onChange={e => setNewCardText(e.target.value)}
                    id="custom-mind-text"
                    name="customMindText"
                  />
                  <select
                    className={styles.customSelect}
                    value={newCardCategory}
                    onChange={e => setNewCardCategory(e.target.value as 'self' | 'others')}
                    id="custom-mind-category"
                    name="customMindCategory"
                  >
                    <option value="others">🌍 まわりの箱（相手の課題・手放す）</option>
                    <option value="self">🙋‍♀️ じぶんの箱（自分で選べる行動）</option>
                  </select>
                  <button type="submit" className={styles.btnCustomAdd} data-testid="btn-add-custom-sort">
                    仕分け箱へ入れる ❯
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* =========================================================
              タブ2: お守りコーピング図鑑
             ========================================================= */}
          {activeTab === 'coping' && (
            <div>
              {triedToast && (
                <div className={styles.feedbackBanner} style={{ marginBottom: '16px', background: '#feebc8', borderColor: '#ed8936' }}>
                  {triedToast}
                </div>
              )}

              <div className={styles.copingHeaderBar}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>
                    🧰 こころのレスキューBOX（{COPING_RECIPES.length}のストレス解消法）
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#718096' }}>
                    モヤモヤやイライラを感じたときにすぐできる、お守りのような小さな行動集です。
                  </p>
                </div>
                <button className={styles.gachaBtn} onClick={handleGacha} data-testid="btn-coping-gacha">
                  <span>🎲</span>
                  <span>ランダムでお守りを引く！</span>
                </button>
              </div>

              {/* カテゴリバー */}
              <div className={styles.copingCategoryBar}>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'all' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('all')}
                >
                  すべて ({COPING_RECIPES.length})
                </button>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'saved' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('saved')}
                  data-testid="filter-saved-coping"
                >
                  ⭐ マイお守り ({savedCopingIds.length})
                </button>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'sense' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('sense')}
                >
                  🧊 五感でリセット
                </button>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'body' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('body')}
                >
                  🏃‍♀️ からだ・運動
                </button>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'rest' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('rest')}
                >
                  🛌 ひとやすみ
                </button>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'express' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('express')}
                >
                  ✏️ 外に出す・表現
                </button>
                <button
                  className={`${styles.copingCatChip} ${copingCategory === 'connect' ? styles.copingCatChipActive : ''}`}
                  onClick={() => setCopingCategory('connect')}
                >
                  🗣️ つながり・相談
                </button>
              </div>

              {/* カードグリッド */}
              <div className={styles.copingGrid}>
                {filteredCopings.map(item => {
                  const isSaved = savedCopingIds.includes(item.id);
                  const isHighlighted = highlightedCopingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`${styles.copingCard} ${isSaved ? styles.copingCardSaved : ''}`}
                      style={isHighlighted ? { outline: '3px solid #ed64a6', transform: 'scale(1.02)' } : undefined}
                      data-testid={`coping-card-${item.id}`}
                    >
                      <div className={styles.copingCardHeader}>
                        <div className={styles.copingCardIcon}>{item.icon}</div>
                        <button
                          className={styles.copingBookmarkBtn}
                          onClick={() => handleToggleSave(item.id)}
                          title={isSaved ? 'マイお守りから外す' : 'マイお守りに登録する'}
                          aria-label={isSaved ? 'マイお守りから外す' : 'マイお守りに登録する'}
                          data-testid={`save-coping-${item.id}`}
                        >
                          {isSaved ? '⭐' : '☆'}
                        </button>
                      </div>

                      <h4 className={styles.copingCardTitle}>{item.title}</h4>
                      <p className={styles.copingCardAction}>{item.action}</p>

                      <div className={styles.copingCardWhy}>
                        <strong>💡 なぜ効くの？:</strong> {item.whyItWorks}
                      </div>

                      <div className={styles.copingCardFooter}>
                        <span className={styles.copingDuration}>⏱ 約{item.duration}</span>
                        <button
                          className={styles.btnTryCoping}
                          onClick={() => handleTryCoping(item.title)}
                        >
                          ✨ やってみた！
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              タブ3: 哲学対話ノート
             ========================================================= */}
          {activeTab === 'philosophy' && (
            <div>
              <div className={styles.topicSelectGrid}>
                {PHILOSOPHY_TOPICS.map(topic => {
                  const isSelected = topic.id === selectedTopicId;
                  const isCompleted = completedTopicIds.includes(topic.id);

                  return (
                    <div
                      key={topic.id}
                      className={`${styles.topicCard} ${isSelected ? styles.topicCardActive : ''}`}
                      onClick={() => handleSelectTopic(topic.id)}
                      data-testid={`topic-card-${topic.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '24px' }}>{topic.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#3182ce' }}>
                          {topic.categoryTag} {isCompleted && '✅ 読了'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#1a202c', lineHeight: 1.4 }}>
                        {topic.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>{topic.subtitle}</p>
                    </div>
                  );
                })}
              </div>

              {/* 対話進行エリア */}
              <div className={styles.dialogChatArea}>
                {!isTopicFinished ? (
                  <div>
                    {/* キャラクタースピーチ */}
                    <div className={styles.charSpeechBubble}>
                      <div className={styles.charAvatar}>{currentStep.characterAvatar}</div>
                      <div className={styles.charMessageCard}>
                        <div className={styles.charName}>{currentStep.characterName} の問いかけ</div>
                        <div className={styles.charQuestion}>
                          【ステップ {currentStep.step} / {currentTopic.steps.length}】
                          <br />
                          {currentStep.question}
                        </div>
                      </div>
                    </div>

                    {/* 選択肢リスト */}
                    <div className={styles.choiceList}>
                      {currentStep.choices.map((choice, idx) => (
                        <button
                          key={idx}
                          className={styles.choiceBtn}
                          onClick={() => handleSelectChoice(choice)}
                          data-testid={`choice-btn-${idx}`}
                        >
                          💬 {choice.text}
                        </button>
                      ))}
                    </div>

                    {/* 選択後のキャラクターリアクション＆洞察 */}
                    {selectedChoice && (
                      <div className={styles.reactionCard} data-testid="reaction-card">
                        <div className={styles.reactionText}>
                          {currentStep.characterAvatar} {currentStep.characterName}：「{selectedChoice.reaction}」
                        </div>
                        <div className={styles.insightText}>{selectedChoice.insight}</div>
                        <button
                          className={styles.btnNextStep}
                          onClick={handleNextStep}
                          data-testid="btn-next-step"
                        >
                          {currentStepIndex + 1 < currentTopic.steps.length
                            ? 'つぎの深い問いへ ❯'
                            : 'こころの処方箋を受け取る ❯'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 完了後のこころの処方箋 */
                  <div className={styles.prescriptionCard} data-testid="prescription-card">
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📜</div>
                    <div className={styles.prescriptionTitle}>
                      🐾 こころの処方箋（フクロウ博士＆ネコ看護師より）
                    </div>
                    <div className={styles.prescriptionQuote}>
                      「{currentTopic.summaryQuote}」
                    </div>
                    <p style={{ fontSize: '12px', color: '#4a5568', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 16px auto' }}>
                      正解のない問いについて深く考え、自分の気持ちを言葉にできましたね。
                      どんな大人の態度に出会っても、あなたの純粋な努力や心の美しさは変わりません。
                      つらいときはいつでもここへ戻ってきて、お守りを取り出してくださいね。
                    </p>
                    <button
                      className={styles.btnNextStep}
                      onClick={handleRestartTopic}
                      style={{ background: '#6b46c1' }}
                    >
                      🔄 もう一度この対話を振り返る
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <div className={styles.footerNote}>
            🍀 ここに記録した内容はあなただけの秘密です。安心して心を休めてね。
          </div>
          <button className={styles.btnCloseBottom} onClick={onClose}>
            とじる
          </button>
        </div>
      </div>
    </div>
  );
};

