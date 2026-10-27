export interface PageContent {
  pageNumber: number;
  title: string;
  subTitle?: string;
  sections: {
    sectionTitle?: string;
    bodyText: string;
    figures?: {
      id: string;
      caption: string;
      svg: string;
    }[];
    questions?: {
      qNum: string;
      prompt: string;
      choices?: string[];
    }[];
  }[];
}

export const STAGE1_PAGE_CONTENTS: Record<number, PageContent> = {
  1: {
    pageNumber: 1,
    title: '2024年度 安田学園中学校 入学試験【理科】',
    subTitle: '問題用紙（表紙）',
    sections: [
      {
        bodyText: `【受験上の注意】
1. 試験開始の合図があるまで、この問題用紙を開いてはいけません。
2. 試験時間は 30 分です。
3. 問題用紙は 1 ページから 7 ページまであります。
4. 解答はすべて別紙の「解答用紙」に記入しなさい。
5. 解答用紙には、受験番号・氏名をはっきりと記入しなさい。
6. 試験終了後、問題用紙と解答用紙の両方を提出しなさい。`,
      },
    ],
  },
  2: {
    pageNumber: 2,
    title: '大問【1】 植物の根と茎・葉脈の観察',
    sections: [
      {
        sectionTitle: 'リード文',
        bodyText: `植物A（ホウセンカ）と植物B（ツユクサ）を育て、根の広がり方、茎の断面、葉脈の並び方を観察しました。
図1は植物Aの根のスケッチ、図2は植物Aの茎の断面の顕微鏡図です。`,
        figures: [
          {
            id: 'fig-root',
            caption: '図1 植物A（ホウセンカ）の根のスケッチ',
            svg: `
              <svg viewBox="0 0 160 160" width="150" height="150">
                <rect width="160" height="160" fill="#ffffff" rx="6"/>
                <line x1="15" y1="32" x2="145" y2="32" stroke="#78716c" stroke-width="2" stroke-dasharray="4 2"/>
                <text x="142" y="26" font-size="9" fill="#78716c" text-anchor="end">地表</text>
                <rect x="76" y="10" width="8" height="22" fill="#16a34a" rx="2"/>
                <path d="M80 32 L80 145" stroke="#854d0e" stroke-width="7" stroke-linecap="round"/>
                <path d="M80 50 Q55 65 35 75" stroke="#a16207" stroke-width="2.5" fill="none"/>
                <path d="M80 70 Q105 85 130 95" stroke="#a16207" stroke-width="2.5" fill="none"/>
                <path d="M80 90 Q60 105 40 118" stroke="#a16207" stroke-width="2" fill="none"/>
                <path d="M80 112 Q98 122 120 132" stroke="#a16207" stroke-width="2" fill="none"/>
                <line x1="84" y1="88" x2="110" y2="72" stroke="#2563eb" stroke-width="1.5"/>
                <circle cx="120" cy="66" r="9" fill="#2563eb"/>
                <text x="120" y="70" font-size="11" fill="white" font-weight="bold" text-anchor="middle">㋐</text>
                <line x1="45" y1="72" x2="25" y2="58" stroke="#2563eb" stroke-width="1.5"/>
                <circle cx="17" cy="52" r="9" fill="#2563eb"/>
                <text x="17" y="56" font-size="11" fill="white" font-weight="bold" text-anchor="middle">㋑</text>
              </svg>
            `,
          },
          {
            id: 'fig-stem',
            caption: '図2 植物A（ホウセンカ）の茎の断面',
            svg: `
              <svg viewBox="0 0 180 160" width="160" height="150">
                <rect width="180" height="160" fill="#ffffff" rx="6"/>
                <circle cx="90" cy="80" r="62" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
                <ellipse cx="90" cy="36" rx="7" ry="10" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="123" cy="50" rx="9" ry="9" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="134" cy="82" rx="10" ry="7" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="120" cy="114" rx="9" ry="9" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="90" cy="124" rx="7" ry="10" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="60" cy="114" rx="9" ry="9" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="46" cy="82" rx="10" ry="7" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="57" cy="50" rx="9" ry="9" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
                <path d="M121 44 A 9 9 0 0 1 131 54 Z" fill="#3b82f6"/>
                <path d="M115 50 A 9 9 0 0 0 125 60 Z" fill="#ef4444"/>
                <line x1="128" y1="46" x2="153" y2="35" stroke="#2563eb" stroke-width="1.5"/>
                <circle cx="162" cy="30" r="9" fill="#2563eb"/>
                <text x="162" y="34" font-size="11" fill="white" font-weight="bold" text-anchor="middle">㋒</text>
                <line x1="118" y1="56" x2="102" y2="70" stroke="#2563eb" stroke-width="1.5"/>
                <circle cx="95" cy="76" r="9" fill="#2563eb"/>
                <text x="95" y="80" font-size="11" fill="white" font-weight="bold" text-anchor="middle">㋓</text>
                <line x1="131" y1="60" x2="153" y2="74" stroke="#2563eb" stroke-width="1.5"/>
                <circle cx="162" cy="80" r="9" fill="#2563eb"/>
                <text x="162" y="84" font-size="11" fill="white" font-weight="bold" text-anchor="middle">㋔</text>
              </svg>
            `,
          },
        ],
        questions: [
          {
            qNum: '問1',
            prompt: '図1・図2中の㋐〜㋒に当てはまる語句を答えなさい。\n㋐：中心の太い根\n㋑：太い根から枝分かれする細い根\n㋒：茎の断面の外側にある管\n㋓：茎の断面の内側にある管\n㋔：㋒と㋓が束になった構造',
          },
          {
            qNum: '問2',
            prompt: '植物B（単子葉類）の葉脈に見られる特徴について、植物Aの網状脈との違いがわかるように説明しなさい。',
          },
          {
            qNum: '問3',
            prompt: '次の植物のうち、植物Aと同じ双子葉類に分類されるものをすべて選びなさい。\n① ホウセンカ　② ツユクサ　③ アブラナ　④ ススキ',
          },
          {
            qNum: '問4',
            prompt: '問1の組織㋒（師管）と組織㋓（道管）がそれぞれ果たしているはたらきを簡潔に説明しなさい。',
          },
          {
            qNum: '問5',
            prompt: '根の先端付近に密集している、細かい毛のような構造の名称を答えなさい。',
          },
          {
            qNum: '問6',
            prompt: '問5の構造があることで、植物にとって吸水面でどのような利点があるか説明しなさい。',
          },
        ],
      },
    ],
  },
  3: {
    pageNumber: 3,
    title: '大問【2】 気体の発生実験と性質（前半）',
    sections: [
      {
        sectionTitle: '実験と性質',
        bodyText: `実験室で試験管に卵の殻（主成分: 炭酸カルシウム）を入れ、うすい塩酸を加えたところ、激しく泡を出して気体が発生しました。この気体を水上置換法で集め、性質を調べました。`,
        figures: [
          {
            id: 'fig-gas',
            caption: '図1 二酸化炭素の発生実験と水上置換法',
            svg: `
              <svg viewBox="0 0 240 140" width="220" height="130">
                <rect width="240" height="140" fill="#ffffff" rx="6"/>
                <rect x="40" y="30" width="22" height="70" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
                <ellipse cx="51" cy="90" rx="8" ry="4" fill="#fde68a" stroke="#d97706"/>
                <text x="51" y="115" font-size="9" fill="#475569" text-anchor="middle">卵の殻＋うすい塩酸</text>
                <path d="M51 30 L51 18 Q51 12 60 12 L140 12 Q150 12 150 20 L150 100" fill="none" stroke="#64748b" stroke-width="3"/>
                <rect x="120" y="80" width="90" height="40" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
                <rect x="140" y="50" width="30" height="60" rx="2" fill="#bae6fd" fill-opacity="0.5" stroke="#0284c7" stroke-width="1.5"/>
                <circle cx="155" cy="70" r="3" fill="#ffffff" stroke="#0284c7"/>
                <circle cx="152" cy="80" r="2.5" fill="#ffffff" stroke="#0284c7"/>
                <text x="165" y="132" font-size="9" fill="#0369a1" text-anchor="middle">水上置換法</text>
              </svg>
            `,
          },
        ],
        questions: [
          {
            qNum: '問1',
            prompt: '発生した気体（二酸化炭素）の性質として当てはまるものをすべて選びなさい。\nア: 助燃性がある\nイ: 石灰水を白く濁らせる\nウ: 空気より軽い\nエ: 固体をドライアイスと呼ぶ',
          },
          {
            qNum: '問2',
            prompt: '二酸化炭素を発生させる薬品の組み合わせとして正しいものを選びなさい。\nア: うすい塩酸＋卵の殻\nイ: 二酸化マンガン＋オキシドール\nウ: 亜鉛＋うすい塩酸\nエ: 食塩＋水',
          },
          {
            qNum: '問3',
            prompt: '地球から宇宙へ放出される熱を吸収し、地表を温める効果をもつ気体の総称を答えなさい。',
          },
          {
            qNum: '問4',
            prompt: '二酸化炭素以外で、強い温室効果をもつ気体を1つ選びなさい。\nア: 酸素　イ: 窒素　ウ: メタン　エ: アルゴン',
          },
        ],
      },
    ],
  },
  4: {
    pageNumber: 4,
    title: '大問【2】 地球環境と炭素循環（後半）',
    sections: [
      {
        sectionTitle: '炭素の循環と海洋酸性化',
        bodyText: `大気中の二酸化炭素は、森林の光合成や海洋への溶解によって吸収されます。近年、人間活動による化石燃料の消費により、大気中の二酸化炭素濃度が急上昇しています。`,
        figures: [
          {
            id: 'fig-carbon',
            caption: '図2 地球規模の炭素年間収支（単位: 億トン）',
            svg: `
              <svg viewBox="0 0 260 140" width="240" height="130">
                <rect width="260" height="140" fill="#ffffff" rx="6"/>
                <rect x="80" y="12" width="100" height="28" rx="6" fill="#f1f5f9" stroke="#64748b"/>
                <text x="130" y="30" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">大気中CO2</text>
                <rect x="15" y="85" width="65" height="30" rx="4" fill="#fee2e2" stroke="#dc2626"/>
                <text x="47" y="104" font-size="9" fill="#991b1b" text-anchor="middle">化石燃料</text>
                <path d="M47 85 L47 48 L76 48" fill="none" stroke="#dc2626" stroke-width="2"/>
                <text x="50" y="65" font-size="9" font-weight="bold" fill="#dc2626">＋109億t</text>
                <rect x="98" y="85" width="65" height="30" rx="4" fill="#dcfce7" stroke="#16a34a"/>
                <text x="130" y="104" font-size="9" fill="#166534" text-anchor="middle">森林・陸上</text>
                <path d="M125 40 L125 82" fill="none" stroke="#16a34a" stroke-width="2"/>
                <text x="130" y="65" font-size="9" font-weight="bold" fill="#16a34a">−34億t</text>
                <rect x="180" y="85" width="65" height="30" rx="4" fill="#e0f2fe" stroke="#0284c7"/>
                <text x="212" y="104" font-size="9" fill="#075985" text-anchor="middle">海洋</text>
                <path d="M175 48 L212 48 L212 82" fill="none" stroke="#0284c7" stroke-width="2"/>
                <text x="205" y="65" font-size="9" font-weight="bold" fill="#0284c7">−25億t</text>
              </svg>
            `,
          },
        ],
        questions: [
          {
            qNum: '問5',
            prompt: '近年、植物の光合成量が増加している理由を、大気の気体組成の変化から説明しなさい。',
          },
          {
            qNum: '問6',
            prompt: '1年間の化石燃料からの排出量が109億トン、陸上生態系による吸収が34億トン、海洋による吸収が25億トンのとき、大気中に増加する炭素量（億トン）を求めなさい。',
          },
          {
            qNum: '問7',
            prompt: '海洋に大量の二酸化炭素が溶け込むことで起こる「海洋酸性化」について、海水の性質の変化として正しいものを選びなさい。\nア: アルカリ性が強まる　イ: 中性になる　ウ: 変化しない　エ: 塩分が急増する　オ: 現在よりも酸性になる',
          },
        ],
      },
    ],
  },
  5: {
    pageNumber: 5,
    title: '大問【3】 水中の浮力と水圧（前半）',
    sections: [
      {
        sectionTitle: '浮力の実験',
        bodyText: `底面積100cm2、高さ10cmの直方体の物体（体積1000cm3）を水の中に沈め、ばねばかりで下向きにかかる力や浮力を測定しました。`,
        figures: [
          {
            id: 'fig-buoyancy',
            caption: '図1・図2 水中の直方体と受ける浮力',
            svg: `
              <svg viewBox="0 0 240 160" width="220" height="150">
                <rect width="240" height="160" fill="#ffffff" rx="6"/>
                <g transform="translate(10, 10)">
                  <rect x="35" y="10" width="16" height="40" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>
                  <text x="43" y="28" font-size="7" fill="#dc2626" text-anchor="middle">1000g</text>
                  <line x1="43" y1="50" x2="43" y2="70" stroke="#334155" stroke-width="1.5"/>
                  <rect x="23" y="70" width="40" height="45" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>
                  <text x="43" y="96" font-size="8" fill="#1e293b" text-anchor="middle">1000cm³</text>
                  <text x="43" y="132" font-size="9" font-weight="bold" fill="#475569" text-anchor="middle">図1 空中</text>
                </g>
                <g transform="translate(125, 10)">
                  <rect x="15" y="60" width="75" height="65" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
                  <rect x="44" y="10" width="16" height="40" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>
                  <text x="52" y="28" font-size="7" fill="#dc2626" text-anchor="middle">0g</text>
                  <line x1="52" y1="50" x2="52" y2="75" stroke="#334155" stroke-width="1.5"/>
                  <rect x="32" y="75" width="40" height="45" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>
                  <text x="52" y="100" font-size="8" fill="#1e293b" text-anchor="middle">浮力1000g</text>
                  <text x="52" y="142" font-size="9" font-weight="bold" fill="#475569" text-anchor="middle">図2 水中（全没）</text>
                </g>
              </svg>
            `,
          },
        ],
        questions: [
          {
            qNum: '問1',
            prompt: 'この物体が水中に完全に沈んだとき、物体が受ける浮力の大きさ（g）を求めなさい。ただし水1cm3の重さを1gとします。',
          },
          {
            qNum: '問2',
            prompt: '水中の物体が受ける浮力について正しい説明をすべて選びなさい。\n① 水槽の水位は物体の体積分だけ上昇する\n② 深く沈めるほど浮力は大きくなる\n③ 左右から受ける水圧の差が浮力になる\n④ 物体の下面が受ける上向きの水圧と、上面が受ける下向きの水圧の差が浮力の原因である',
          },
        ],
      },
    ],
  },
  6: {
    pageNumber: 6,
    title: '大問【3】 ガリレオ温度計の原理（後半）',
    sections: [
      {
        sectionTitle: '液体の密度変化と温度の測定',
        bodyText: `密閉された円筒形のガラス容器の中に透明な液体と、それぞれ重さの異なる複数のガラス球が入っています。液体の温度が変わると液体の密度が変化し、ガラス球が浮き沈みします。`,
        figures: [
          {
            id: 'fig-thermometer',
            caption: '図3・図4 ガリレオ温度計の構造と浮子の浮き沈み',
            svg: `
              <svg viewBox="0 0 200 170" width="180" height="155">
                <rect width="200" height="170" fill="#ffffff" rx="6"/>
                <rect x="65" y="10" width="70" height="145" rx="10" fill="#f0f9ff" stroke="#0284c7" stroke-width="2"/>
                <rect x="68" y="25" width="64" height="126" fill="#e0f2fe" fill-opacity="0.4"/>
                <circle cx="100" cy="45" r="14" fill="#fb7185" fill-opacity="0.8" stroke="#e11d48"/>
                <rect x="94" y="59" width="12" height="7" fill="#fde047" stroke="#ca8a04"/>
                <text x="100" y="65" font-size="6" fill="#713f12" text-anchor="middle" font-weight="bold">24℃</text>
                <circle cx="100" cy="88" r="14" fill="#38bdf8" fill-opacity="0.8" stroke="#0284c7"/>
                <rect x="94" y="102" width="12" height="7" fill="#fde047" stroke="#ca8a04"/>
                <text x="100" y="108" font-size="6" fill="#713f12" text-anchor="middle" font-weight="bold">22℃</text>
                <circle cx="100" cy="130" r="14" fill="#4ade80" fill-opacity="0.8" stroke="#16a34a"/>
                <rect x="94" y="144" width="12" height="6" fill="#fde047" stroke="#ca8a04"/>
                <text x="100" y="149" font-size="6" fill="#713f12" text-anchor="middle" font-weight="bold">20℃</text>
              </svg>
            `,
          },
        ],
        questions: [
          {
            qNum: '問3',
            prompt: '温度が下がると液体の密度が大きくなり、ガラス球は浮きやすくなります。下線部①〜④のうち誤っている番号を1つ選び、その部分を正しい表現に訂正しなさい。',
          },
        ],
      },
    ],
  },
  7: {
    pageNumber: 7,
    title: '試験終了・見直しページ',
    sections: [
      {
        bodyText: `問題は以上です。
右側の「解答用紙」に記入漏れがないか確認し、完了したら右下の［解答を提出して採点する］ボタンを押してください。`,
      },
    ],
  },
};

