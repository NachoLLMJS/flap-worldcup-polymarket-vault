import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PrivyProvider, useConnectWallet, useCreateWallet, usePrivy, useWallets} from '@privy-io/react-auth';
import {createWalletClient, custom, parseEther} from 'viem';
import {bsc} from 'viem/chains';
import './styles/globals.css';
import './styles.css';
import './i18n';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;
const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID as string | undefined;
const VAULT_ADDRESS = import.meta.env.VITE_FLAP_VAULT_ADDRESS as `0x${string}` | undefined;
const BETTING_VAULT_ADDRESS = import.meta.env.VITE_BETTING_VAULT_ADDRESS as `0x${string}` | undefined;
const BSC_CHAIN_ID = bsc.id;
const FEE_WALLET = '0x8e49F0C611F3AE5D651A2D92169C63Cd5a579e2e';
const protocolFeeBps = 100;

const bettingAbi = [
  {
    type: 'function',
    name: 'placeBet',
    stateMutability: 'payable',
    inputs: [
      {name: 'marketId', type: 'uint256'},
      {name: 'teamId', type: 'uint256'},
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawBet',
    stateMutability: 'nonpayable',
    inputs: [
      {name: 'marketId', type: 'uint256'},
      {name: 'teamId', type: 'uint256'},
      {name: 'amount', type: 'uint256'},
    ],
    outputs: [],
  },
] as const;

type Outcome = {teamId: number; name: string; zh: string; flag: string};
type MarketFixture = {
  marketId: number;
  viewerMatchId: number;
  title: string;
  zhTitle: string;
  shrine: string;
  date: string;
  close: string;
  type: 'Match Winner' | 'Group Winner' | 'Tournament Winner';
  outcomes: Outcome[];
};

type Pick = {market: MarketFixture; outcome: Outcome};

const marketFixtures: MarketFixture[] = [
  {
    "marketId": 1,
    "viewerMatchId": 1,
    "title": "2026 FIFA World Cup Winner",
    "zhTitle": "世界杯冠军",
    "shrine": "冠军金龙长盘",
    "date": "WorldCupViewer Match 1",
    "close": "Settles through getWorldCupWinner()",
    "type": "Tournament Winner",
    "outcomes": [
      {
        "teamId": 29,
        "name": "Spain",
        "zh": "西班牙",
        "flag": "🇪🇸"
      },
      {
        "teamId": 33,
        "name": "France",
        "zh": "法国",
        "flag": "🇫🇷"
      },
      {
        "teamId": 45,
        "name": "England",
        "zh": "英格兰",
        "flag": "🏴"
      },
      {
        "teamId": 37,
        "name": "Argentina",
        "zh": "阿根廷",
        "flag": "🇦🇷"
      },
      {
        "teamId": 9,
        "name": "Brazil",
        "zh": "巴西",
        "flag": "🇧🇷"
      },
      {
        "teamId": 41,
        "name": "Portugal",
        "zh": "葡萄牙",
        "flag": "🇵🇹"
      },
      {
        "teamId": 17,
        "name": "Germany",
        "zh": "德国",
        "flag": "🇩🇪"
      },
      {
        "teamId": 21,
        "name": "Netherlands",
        "zh": "荷兰",
        "flag": "🇳🇱"
      },
      {
        "teamId": 36,
        "name": "Norway",
        "zh": "挪威",
        "flag": "🇳🇴"
      },
      {
        "teamId": 25,
        "name": "Belgium",
        "zh": "比利时",
        "flag": "🇧🇪"
      },
      {
        "teamId": 13,
        "name": "USA",
        "zh": "美国",
        "flag": "🇺🇸"
      },
      {
        "teamId": 10,
        "name": "Morocco",
        "zh": "摩洛哥",
        "flag": "🇲🇦"
      },
      {
        "teamId": 44,
        "name": "Colombia",
        "zh": "哥伦比亚",
        "flag": "🇨🇴"
      },
      {
        "teamId": 22,
        "name": "Japan",
        "zh": "日本",
        "flag": "🇯🇵"
      },
      {
        "teamId": 32,
        "name": "Uruguay",
        "zh": "乌拉圭",
        "flag": "🇺🇾"
      },
      {
        "teamId": 46,
        "name": "Croatia",
        "zh": "克罗地亚",
        "flag": "🇭🇷"
      },
      {
        "teamId": 1,
        "name": "Mexico",
        "zh": "墨西哥",
        "flag": "🇲🇽"
      },
      {
        "teamId": 8,
        "name": "Switzerland",
        "zh": "瑞士",
        "flag": "🇨🇭"
      },
      {
        "teamId": 20,
        "name": "Ecuador",
        "zh": "厄瓜多尔",
        "flag": "🇪🇨"
      },
      {
        "teamId": 34,
        "name": "Senegal",
        "zh": "塞内加尔",
        "flag": "🇸🇳"
      },
      {
        "teamId": 15,
        "name": "Australia",
        "zh": "澳大利亚",
        "flag": "🇦🇺"
      },
      {
        "teamId": 5,
        "name": "Canada",
        "zh": "加拿大",
        "flag": "🇨🇦"
      },
      {
        "teamId": 12,
        "name": "Scotland",
        "zh": "苏格兰",
        "flag": "🏴"
      },
      {
        "teamId": 3,
        "name": "South Korea",
        "zh": "韩国",
        "flag": "🇰🇷"
      },
      {
        "teamId": 14,
        "name": "Paraguay",
        "zh": "巴拉圭",
        "flag": "🇵🇾"
      },
      {
        "teamId": 19,
        "name": "Ivory Coast",
        "zh": "科特迪瓦",
        "flag": "🇨🇮"
      },
      {
        "teamId": 26,
        "name": "Egypt",
        "zh": "埃及",
        "flag": "🇪🇬"
      },
      {
        "teamId": 27,
        "name": "Iran",
        "zh": "伊朗",
        "flag": "🇮🇷"
      },
      {
        "teamId": 47,
        "name": "Ghana",
        "zh": "加纳",
        "flag": "🇬🇭"
      },
      {
        "teamId": 38,
        "name": "Algeria",
        "zh": "阿尔及利亚",
        "flag": "🇩🇿"
      },
      {
        "teamId": 24,
        "name": "Tunisia",
        "zh": "突尼斯",
        "flag": "🇹🇳"
      },
      {
        "teamId": 39,
        "name": "Austria",
        "zh": "奥地利",
        "flag": "🇦🇹"
      },
      {
        "teamId": 28,
        "name": "New Zealand",
        "zh": "新西兰",
        "flag": "🇳🇿"
      },
      {
        "teamId": 11,
        "name": "Haiti",
        "zh": "海地",
        "flag": "🇭🇹"
      },
      {
        "teamId": 40,
        "name": "Jordan",
        "zh": "约旦",
        "flag": "🇯🇴"
      },
      {
        "teamId": 18,
        "name": "Curaçao",
        "zh": "库拉索",
        "flag": "🇨🇼"
      },
      {
        "teamId": 43,
        "name": "Uzbekistan",
        "zh": "乌兹别克斯坦",
        "flag": "🇺🇿"
      },
      {
        "teamId": 2,
        "name": "South Africa",
        "zh": "南非",
        "flag": "🇿🇦"
      },
      {
        "teamId": 30,
        "name": "Cape Verde",
        "zh": "佛得角",
        "flag": "🇨🇻"
      },
      {
        "teamId": 7,
        "name": "Qatar",
        "zh": "卡塔尔",
        "flag": "🇶🇦"
      },
      {
        "teamId": 31,
        "name": "Saudi Arabia",
        "zh": "沙特",
        "flag": "🇸🇦"
      },
      {
        "teamId": 49,
        "name": "Others",
        "zh": "其他",
        "flag": "🌍"
      }
    ]
  },
  {
    "marketId": 2,
    "viewerMatchId": 2,
    "title": "Group A Winner",
    "zhTitle": "A组冠军",
    "shrine": "Group A 龙门盘",
    "date": "WorldCupViewer Match 2",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 1,
        "name": "Mexico",
        "zh": "墨西哥",
        "flag": "🇲🇽"
      },
      {
        "teamId": 2,
        "name": "South Africa",
        "zh": "南非",
        "flag": "🇿🇦"
      },
      {
        "teamId": 3,
        "name": "South Korea",
        "zh": "韩国",
        "flag": "🇰🇷"
      },
      {
        "teamId": 4,
        "name": "Czechia",
        "zh": "捷克",
        "flag": "🇨🇿"
      }
    ]
  },
  {
    "marketId": 3,
    "viewerMatchId": 3,
    "title": "Group B Winner",
    "zhTitle": "B组冠军",
    "shrine": "Group B 龙门盘",
    "date": "WorldCupViewer Match 3",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 5,
        "name": "Canada",
        "zh": "加拿大",
        "flag": "🇨🇦"
      },
      {
        "teamId": 6,
        "name": "Bosnia and Herzegovina",
        "zh": "波黑",
        "flag": "🇧🇦"
      },
      {
        "teamId": 7,
        "name": "Qatar",
        "zh": "卡塔尔",
        "flag": "🇶🇦"
      },
      {
        "teamId": 8,
        "name": "Switzerland",
        "zh": "瑞士",
        "flag": "🇨🇭"
      }
    ]
  },
  {
    "marketId": 4,
    "viewerMatchId": 4,
    "title": "Group C Winner",
    "zhTitle": "C组冠军",
    "shrine": "Group C 龙门盘",
    "date": "WorldCupViewer Match 4",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 9,
        "name": "Brazil",
        "zh": "巴西",
        "flag": "🇧🇷"
      },
      {
        "teamId": 10,
        "name": "Morocco",
        "zh": "摩洛哥",
        "flag": "🇲🇦"
      },
      {
        "teamId": 11,
        "name": "Haiti",
        "zh": "海地",
        "flag": "🇭🇹"
      },
      {
        "teamId": 12,
        "name": "Scotland",
        "zh": "苏格兰",
        "flag": "🏴"
      }
    ]
  },
  {
    "marketId": 5,
    "viewerMatchId": 5,
    "title": "Group D Winner",
    "zhTitle": "D组冠军",
    "shrine": "Group D 龙门盘",
    "date": "WorldCupViewer Match 5",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 13,
        "name": "USA",
        "zh": "美国",
        "flag": "🇺🇸"
      },
      {
        "teamId": 14,
        "name": "Paraguay",
        "zh": "巴拉圭",
        "flag": "🇵🇾"
      },
      {
        "teamId": 15,
        "name": "Australia",
        "zh": "澳大利亚",
        "flag": "🇦🇺"
      },
      {
        "teamId": 16,
        "name": "Türkiye",
        "zh": "土耳其",
        "flag": "🇹🇷"
      }
    ]
  },
  {
    "marketId": 6,
    "viewerMatchId": 6,
    "title": "Group E Winner",
    "zhTitle": "E组冠军",
    "shrine": "Group E 龙门盘",
    "date": "WorldCupViewer Match 6",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 17,
        "name": "Germany",
        "zh": "德国",
        "flag": "🇩🇪"
      },
      {
        "teamId": 18,
        "name": "Curaçao",
        "zh": "库拉索",
        "flag": "🇨🇼"
      },
      {
        "teamId": 19,
        "name": "Ivory Coast",
        "zh": "科特迪瓦",
        "flag": "🇨🇮"
      },
      {
        "teamId": 20,
        "name": "Ecuador",
        "zh": "厄瓜多尔",
        "flag": "🇪🇨"
      }
    ]
  },
  {
    "marketId": 7,
    "viewerMatchId": 7,
    "title": "Group F Winner",
    "zhTitle": "F组冠军",
    "shrine": "Group F 龙门盘",
    "date": "WorldCupViewer Match 7",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 21,
        "name": "Netherlands",
        "zh": "荷兰",
        "flag": "🇳🇱"
      },
      {
        "teamId": 22,
        "name": "Japan",
        "zh": "日本",
        "flag": "🇯🇵"
      },
      {
        "teamId": 23,
        "name": "Sweden",
        "zh": "瑞典",
        "flag": "🇸🇪"
      },
      {
        "teamId": 24,
        "name": "Tunisia",
        "zh": "突尼斯",
        "flag": "🇹🇳"
      }
    ]
  },
  {
    "marketId": 8,
    "viewerMatchId": 8,
    "title": "Group G Winner",
    "zhTitle": "G组冠军",
    "shrine": "Group G 龙门盘",
    "date": "WorldCupViewer Match 8",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 25,
        "name": "Belgium",
        "zh": "比利时",
        "flag": "🇧🇪"
      },
      {
        "teamId": 26,
        "name": "Egypt",
        "zh": "埃及",
        "flag": "🇪🇬"
      },
      {
        "teamId": 27,
        "name": "Iran",
        "zh": "伊朗",
        "flag": "🇮🇷"
      },
      {
        "teamId": 28,
        "name": "New Zealand",
        "zh": "新西兰",
        "flag": "🇳🇿"
      }
    ]
  },
  {
    "marketId": 9,
    "viewerMatchId": 9,
    "title": "Group H Winner",
    "zhTitle": "H组冠军",
    "shrine": "Group H 龙门盘",
    "date": "WorldCupViewer Match 9",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 29,
        "name": "Spain",
        "zh": "西班牙",
        "flag": "🇪🇸"
      },
      {
        "teamId": 30,
        "name": "Cape Verde",
        "zh": "佛得角",
        "flag": "🇨🇻"
      },
      {
        "teamId": 31,
        "name": "Saudi Arabia",
        "zh": "沙特",
        "flag": "🇸🇦"
      },
      {
        "teamId": 32,
        "name": "Uruguay",
        "zh": "乌拉圭",
        "flag": "🇺🇾"
      }
    ]
  },
  {
    "marketId": 10,
    "viewerMatchId": 10,
    "title": "Group I Winner",
    "zhTitle": "I组冠军",
    "shrine": "Group I 龙门盘",
    "date": "WorldCupViewer Match 10",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 33,
        "name": "France",
        "zh": "法国",
        "flag": "🇫🇷"
      },
      {
        "teamId": 34,
        "name": "Senegal",
        "zh": "塞内加尔",
        "flag": "🇸🇳"
      },
      {
        "teamId": 35,
        "name": "Iraq",
        "zh": "伊拉克",
        "flag": "🇮🇶"
      },
      {
        "teamId": 36,
        "name": "Norway",
        "zh": "挪威",
        "flag": "🇳🇴"
      }
    ]
  },
  {
    "marketId": 11,
    "viewerMatchId": 11,
    "title": "Group J Winner",
    "zhTitle": "J组冠军",
    "shrine": "Group J 龙门盘",
    "date": "WorldCupViewer Match 11",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 37,
        "name": "Argentina",
        "zh": "阿根廷",
        "flag": "🇦🇷"
      },
      {
        "teamId": 38,
        "name": "Algeria",
        "zh": "阿尔及利亚",
        "flag": "🇩🇿"
      },
      {
        "teamId": 39,
        "name": "Austria",
        "zh": "奥地利",
        "flag": "🇦🇹"
      },
      {
        "teamId": 40,
        "name": "Jordan",
        "zh": "约旦",
        "flag": "🇯🇴"
      }
    ]
  },
  {
    "marketId": 12,
    "viewerMatchId": 12,
    "title": "Group K Winner",
    "zhTitle": "K组冠军",
    "shrine": "Group K 龙门盘",
    "date": "WorldCupViewer Match 12",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 41,
        "name": "Portugal",
        "zh": "葡萄牙",
        "flag": "🇵🇹"
      },
      {
        "teamId": 42,
        "name": "DR Congo",
        "zh": "刚果（金）",
        "flag": "🇨🇩"
      },
      {
        "teamId": 43,
        "name": "Uzbekistan",
        "zh": "乌兹别克斯坦",
        "flag": "🇺🇿"
      },
      {
        "teamId": 44,
        "name": "Colombia",
        "zh": "哥伦比亚",
        "flag": "🇨🇴"
      }
    ]
  },
  {
    "marketId": 13,
    "viewerMatchId": 13,
    "title": "Group L Winner",
    "zhTitle": "L组冠军",
    "shrine": "Group L 龙门盘",
    "date": "WorldCupViewer Match 13",
    "close": "Live group winner via WorldCupViewer",
    "type": "Group Winner",
    "outcomes": [
      {
        "teamId": 45,
        "name": "England",
        "zh": "英格兰",
        "flag": "🏴"
      },
      {
        "teamId": 46,
        "name": "Croatia",
        "zh": "克罗地亚",
        "flag": "🇭🇷"
      },
      {
        "teamId": 47,
        "name": "Ghana",
        "zh": "加纳",
        "flag": "🇬🇭"
      },
      {
        "teamId": 48,
        "name": "Panama",
        "zh": "巴拿马",
        "flag": "🇵🇦"
      }
    ]
  },
  {
    "marketId": 14,
    "viewerMatchId": 14,
    "title": "Mexico vs South Africa",
    "zhTitle": "墨西哥 对 南非",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 14",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 1,
        "name": "Mexico",
        "zh": "墨西哥",
        "flag": "🇲🇽"
      },
      {
        "teamId": 2,
        "name": "South Africa",
        "zh": "南非",
        "flag": "🇿🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 15,
    "viewerMatchId": 15,
    "title": "South Korea vs Czechia",
    "zhTitle": "韩国 对 捷克",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 15",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 3,
        "name": "South Korea",
        "zh": "韩国",
        "flag": "🇰🇷"
      },
      {
        "teamId": 4,
        "name": "Czechia",
        "zh": "捷克",
        "flag": "🇨🇿"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 16,
    "viewerMatchId": 16,
    "title": "Canada vs Bosnia and Herzegovina",
    "zhTitle": "加拿大 对 波黑",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 16",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 5,
        "name": "Canada",
        "zh": "加拿大",
        "flag": "🇨🇦"
      },
      {
        "teamId": 6,
        "name": "Bosnia and Herzegovina",
        "zh": "波黑",
        "flag": "🇧🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 17,
    "viewerMatchId": 17,
    "title": "USA vs Paraguay",
    "zhTitle": "美国 对 巴拉圭",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 17",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 13,
        "name": "USA",
        "zh": "美国",
        "flag": "🇺🇸"
      },
      {
        "teamId": 14,
        "name": "Paraguay",
        "zh": "巴拉圭",
        "flag": "🇵🇾"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 18,
    "viewerMatchId": 18,
    "title": "Qatar vs Switzerland",
    "zhTitle": "卡塔尔 对 瑞士",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 18",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 7,
        "name": "Qatar",
        "zh": "卡塔尔",
        "flag": "🇶🇦"
      },
      {
        "teamId": 8,
        "name": "Switzerland",
        "zh": "瑞士",
        "flag": "🇨🇭"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 19,
    "viewerMatchId": 19,
    "title": "Brazil vs Morocco",
    "zhTitle": "巴西 对 摩洛哥",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 19",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 9,
        "name": "Brazil",
        "zh": "巴西",
        "flag": "🇧🇷"
      },
      {
        "teamId": 10,
        "name": "Morocco",
        "zh": "摩洛哥",
        "flag": "🇲🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 20,
    "viewerMatchId": 20,
    "title": "Haiti vs Scotland",
    "zhTitle": "海地 对 苏格兰",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 20",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 11,
        "name": "Haiti",
        "zh": "海地",
        "flag": "🇭🇹"
      },
      {
        "teamId": 12,
        "name": "Scotland",
        "zh": "苏格兰",
        "flag": "🏴"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 21,
    "viewerMatchId": 21,
    "title": "Australia vs Türkiye",
    "zhTitle": "澳大利亚 对 土耳其",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 21",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 15,
        "name": "Australia",
        "zh": "澳大利亚",
        "flag": "🇦🇺"
      },
      {
        "teamId": 16,
        "name": "Türkiye",
        "zh": "土耳其",
        "flag": "🇹🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 22,
    "viewerMatchId": 22,
    "title": "Germany vs Curaçao",
    "zhTitle": "德国 对 库拉索",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 22",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 17,
        "name": "Germany",
        "zh": "德国",
        "flag": "🇩🇪"
      },
      {
        "teamId": 18,
        "name": "Curaçao",
        "zh": "库拉索",
        "flag": "🇨🇼"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 23,
    "viewerMatchId": 23,
    "title": "Netherlands vs Japan",
    "zhTitle": "荷兰 对 日本",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 23",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 21,
        "name": "Netherlands",
        "zh": "荷兰",
        "flag": "🇳🇱"
      },
      {
        "teamId": 22,
        "name": "Japan",
        "zh": "日本",
        "flag": "🇯🇵"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 24,
    "viewerMatchId": 24,
    "title": "Ivory Coast vs Ecuador",
    "zhTitle": "科特迪瓦 对 厄瓜多尔",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 24",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 19,
        "name": "Ivory Coast",
        "zh": "科特迪瓦",
        "flag": "🇨🇮"
      },
      {
        "teamId": 20,
        "name": "Ecuador",
        "zh": "厄瓜多尔",
        "flag": "🇪🇨"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 25,
    "viewerMatchId": 25,
    "title": "Sweden vs Tunisia",
    "zhTitle": "瑞典 对 突尼斯",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 25",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 23,
        "name": "Sweden",
        "zh": "瑞典",
        "flag": "🇸🇪"
      },
      {
        "teamId": 24,
        "name": "Tunisia",
        "zh": "突尼斯",
        "flag": "🇹🇳"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 26,
    "viewerMatchId": 26,
    "title": "Spain vs Cape Verde",
    "zhTitle": "西班牙 对 佛得角",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 26",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 29,
        "name": "Spain",
        "zh": "西班牙",
        "flag": "🇪🇸"
      },
      {
        "teamId": 30,
        "name": "Cape Verde",
        "zh": "佛得角",
        "flag": "🇨🇻"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 27,
    "viewerMatchId": 27,
    "title": "Belgium vs Egypt",
    "zhTitle": "比利时 对 埃及",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 27",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 25,
        "name": "Belgium",
        "zh": "比利时",
        "flag": "🇧🇪"
      },
      {
        "teamId": 26,
        "name": "Egypt",
        "zh": "埃及",
        "flag": "🇪🇬"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 28,
    "viewerMatchId": 28,
    "title": "Saudi Arabia vs Uruguay",
    "zhTitle": "沙特 对 乌拉圭",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 28",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 31,
        "name": "Saudi Arabia",
        "zh": "沙特",
        "flag": "🇸🇦"
      },
      {
        "teamId": 32,
        "name": "Uruguay",
        "zh": "乌拉圭",
        "flag": "🇺🇾"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 29,
    "viewerMatchId": 29,
    "title": "Iran vs New Zealand",
    "zhTitle": "伊朗 对 新西兰",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 29",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 27,
        "name": "Iran",
        "zh": "伊朗",
        "flag": "🇮🇷"
      },
      {
        "teamId": 28,
        "name": "New Zealand",
        "zh": "新西兰",
        "flag": "🇳🇿"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 30,
    "viewerMatchId": 30,
    "title": "France vs Senegal",
    "zhTitle": "法国 对 塞内加尔",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 30",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 33,
        "name": "France",
        "zh": "法国",
        "flag": "🇫🇷"
      },
      {
        "teamId": 34,
        "name": "Senegal",
        "zh": "塞内加尔",
        "flag": "🇸🇳"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 31,
    "viewerMatchId": 31,
    "title": "Iraq vs Norway",
    "zhTitle": "伊拉克 对 挪威",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 31",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 35,
        "name": "Iraq",
        "zh": "伊拉克",
        "flag": "🇮🇶"
      },
      {
        "teamId": 36,
        "name": "Norway",
        "zh": "挪威",
        "flag": "🇳🇴"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 32,
    "viewerMatchId": 32,
    "title": "Argentina vs Algeria",
    "zhTitle": "阿根廷 对 阿尔及利亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 32",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 37,
        "name": "Argentina",
        "zh": "阿根廷",
        "flag": "🇦🇷"
      },
      {
        "teamId": 38,
        "name": "Algeria",
        "zh": "阿尔及利亚",
        "flag": "🇩🇿"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 33,
    "viewerMatchId": 33,
    "title": "Austria vs Jordan",
    "zhTitle": "奥地利 对 约旦",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 33",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 39,
        "name": "Austria",
        "zh": "奥地利",
        "flag": "🇦🇹"
      },
      {
        "teamId": 40,
        "name": "Jordan",
        "zh": "约旦",
        "flag": "🇯🇴"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 34,
    "viewerMatchId": 34,
    "title": "Portugal vs DR Congo",
    "zhTitle": "葡萄牙 对 刚果（金）",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 34",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 41,
        "name": "Portugal",
        "zh": "葡萄牙",
        "flag": "🇵🇹"
      },
      {
        "teamId": 42,
        "name": "DR Congo",
        "zh": "刚果（金）",
        "flag": "🇨🇩"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 35,
    "viewerMatchId": 35,
    "title": "England vs Croatia",
    "zhTitle": "英格兰 对 克罗地亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 35",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 45,
        "name": "England",
        "zh": "英格兰",
        "flag": "🏴"
      },
      {
        "teamId": 46,
        "name": "Croatia",
        "zh": "克罗地亚",
        "flag": "🇭🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 36,
    "viewerMatchId": 36,
    "title": "Ghana vs Panama",
    "zhTitle": "加纳 对 巴拿马",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 36",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 47,
        "name": "Ghana",
        "zh": "加纳",
        "flag": "🇬🇭"
      },
      {
        "teamId": 48,
        "name": "Panama",
        "zh": "巴拿马",
        "flag": "🇵🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 37,
    "viewerMatchId": 37,
    "title": "Uzbekistan vs Colombia",
    "zhTitle": "乌兹别克斯坦 对 哥伦比亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 37",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 43,
        "name": "Uzbekistan",
        "zh": "乌兹别克斯坦",
        "flag": "🇺🇿"
      },
      {
        "teamId": 44,
        "name": "Colombia",
        "zh": "哥伦比亚",
        "flag": "🇨🇴"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 38,
    "viewerMatchId": 38,
    "title": "Czechia vs South Africa",
    "zhTitle": "捷克 对 南非",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 38",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 4,
        "name": "Czechia",
        "zh": "捷克",
        "flag": "🇨🇿"
      },
      {
        "teamId": 2,
        "name": "South Africa",
        "zh": "南非",
        "flag": "🇿🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 39,
    "viewerMatchId": 39,
    "title": "Switzerland vs Bosnia and Herzegovina",
    "zhTitle": "瑞士 对 波黑",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 39",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 8,
        "name": "Switzerland",
        "zh": "瑞士",
        "flag": "🇨🇭"
      },
      {
        "teamId": 6,
        "name": "Bosnia and Herzegovina",
        "zh": "波黑",
        "flag": "🇧🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 40,
    "viewerMatchId": 40,
    "title": "Canada vs Qatar",
    "zhTitle": "加拿大 对 卡塔尔",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 40",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 5,
        "name": "Canada",
        "zh": "加拿大",
        "flag": "🇨🇦"
      },
      {
        "teamId": 7,
        "name": "Qatar",
        "zh": "卡塔尔",
        "flag": "🇶🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 41,
    "viewerMatchId": 41,
    "title": "Mexico vs South Korea",
    "zhTitle": "墨西哥 对 韩国",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 41",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 1,
        "name": "Mexico",
        "zh": "墨西哥",
        "flag": "🇲🇽"
      },
      {
        "teamId": 3,
        "name": "South Korea",
        "zh": "韩国",
        "flag": "🇰🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 42,
    "viewerMatchId": 42,
    "title": "USA vs Australia",
    "zhTitle": "美国 对 澳大利亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 42",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 13,
        "name": "USA",
        "zh": "美国",
        "flag": "🇺🇸"
      },
      {
        "teamId": 15,
        "name": "Australia",
        "zh": "澳大利亚",
        "flag": "🇦🇺"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 43,
    "viewerMatchId": 43,
    "title": "Scotland vs Morocco",
    "zhTitle": "苏格兰 对 摩洛哥",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 43",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 12,
        "name": "Scotland",
        "zh": "苏格兰",
        "flag": "🏴"
      },
      {
        "teamId": 10,
        "name": "Morocco",
        "zh": "摩洛哥",
        "flag": "🇲🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 44,
    "viewerMatchId": 44,
    "title": "Brazil vs Haiti",
    "zhTitle": "巴西 对 海地",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 44",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 9,
        "name": "Brazil",
        "zh": "巴西",
        "flag": "🇧🇷"
      },
      {
        "teamId": 11,
        "name": "Haiti",
        "zh": "海地",
        "flag": "🇭🇹"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 45,
    "viewerMatchId": 45,
    "title": "Türkiye vs Paraguay",
    "zhTitle": "土耳其 对 巴拉圭",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 45",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 16,
        "name": "Türkiye",
        "zh": "土耳其",
        "flag": "🇹🇷"
      },
      {
        "teamId": 14,
        "name": "Paraguay",
        "zh": "巴拉圭",
        "flag": "🇵🇾"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 46,
    "viewerMatchId": 46,
    "title": "Netherlands vs Sweden",
    "zhTitle": "荷兰 对 瑞典",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 46",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 21,
        "name": "Netherlands",
        "zh": "荷兰",
        "flag": "🇳🇱"
      },
      {
        "teamId": 23,
        "name": "Sweden",
        "zh": "瑞典",
        "flag": "🇸🇪"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 47,
    "viewerMatchId": 47,
    "title": "Germany vs Ivory Coast",
    "zhTitle": "德国 对 科特迪瓦",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 47",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 17,
        "name": "Germany",
        "zh": "德国",
        "flag": "🇩🇪"
      },
      {
        "teamId": 19,
        "name": "Ivory Coast",
        "zh": "科特迪瓦",
        "flag": "🇨🇮"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 48,
    "viewerMatchId": 48,
    "title": "Ecuador vs Curaçao",
    "zhTitle": "厄瓜多尔 对 库拉索",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 48",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 20,
        "name": "Ecuador",
        "zh": "厄瓜多尔",
        "flag": "🇪🇨"
      },
      {
        "teamId": 18,
        "name": "Curaçao",
        "zh": "库拉索",
        "flag": "🇨🇼"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 49,
    "viewerMatchId": 49,
    "title": "Tunisia vs Japan",
    "zhTitle": "突尼斯 对 日本",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 49",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 24,
        "name": "Tunisia",
        "zh": "突尼斯",
        "flag": "🇹🇳"
      },
      {
        "teamId": 22,
        "name": "Japan",
        "zh": "日本",
        "flag": "🇯🇵"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 50,
    "viewerMatchId": 50,
    "title": "Spain vs Saudi Arabia",
    "zhTitle": "西班牙 对 沙特",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 50",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 29,
        "name": "Spain",
        "zh": "西班牙",
        "flag": "🇪🇸"
      },
      {
        "teamId": 31,
        "name": "Saudi Arabia",
        "zh": "沙特",
        "flag": "🇸🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 51,
    "viewerMatchId": 51,
    "title": "Belgium vs Iran",
    "zhTitle": "比利时 对 伊朗",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 51",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 25,
        "name": "Belgium",
        "zh": "比利时",
        "flag": "🇧🇪"
      },
      {
        "teamId": 27,
        "name": "Iran",
        "zh": "伊朗",
        "flag": "🇮🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 52,
    "viewerMatchId": 52,
    "title": "Uruguay vs Cape Verde",
    "zhTitle": "乌拉圭 对 佛得角",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 52",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 32,
        "name": "Uruguay",
        "zh": "乌拉圭",
        "flag": "🇺🇾"
      },
      {
        "teamId": 30,
        "name": "Cape Verde",
        "zh": "佛得角",
        "flag": "🇨🇻"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 53,
    "viewerMatchId": 53,
    "title": "New Zealand vs Egypt",
    "zhTitle": "新西兰 对 埃及",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 53",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 28,
        "name": "New Zealand",
        "zh": "新西兰",
        "flag": "🇳🇿"
      },
      {
        "teamId": 26,
        "name": "Egypt",
        "zh": "埃及",
        "flag": "🇪🇬"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 54,
    "viewerMatchId": 54,
    "title": "Argentina vs Austria",
    "zhTitle": "阿根廷 对 奥地利",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 54",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 37,
        "name": "Argentina",
        "zh": "阿根廷",
        "flag": "🇦🇷"
      },
      {
        "teamId": 39,
        "name": "Austria",
        "zh": "奥地利",
        "flag": "🇦🇹"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 55,
    "viewerMatchId": 55,
    "title": "France vs Iraq",
    "zhTitle": "法国 对 伊拉克",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 55",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 33,
        "name": "France",
        "zh": "法国",
        "flag": "🇫🇷"
      },
      {
        "teamId": 35,
        "name": "Iraq",
        "zh": "伊拉克",
        "flag": "🇮🇶"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 56,
    "viewerMatchId": 56,
    "title": "Norway vs Senegal",
    "zhTitle": "挪威 对 塞内加尔",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 56",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 36,
        "name": "Norway",
        "zh": "挪威",
        "flag": "🇳🇴"
      },
      {
        "teamId": 34,
        "name": "Senegal",
        "zh": "塞内加尔",
        "flag": "🇸🇳"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 57,
    "viewerMatchId": 57,
    "title": "Jordan vs Algeria",
    "zhTitle": "约旦 对 阿尔及利亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 57",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 40,
        "name": "Jordan",
        "zh": "约旦",
        "flag": "🇯🇴"
      },
      {
        "teamId": 38,
        "name": "Algeria",
        "zh": "阿尔及利亚",
        "flag": "🇩🇿"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 58,
    "viewerMatchId": 58,
    "title": "Portugal vs Uzbekistan",
    "zhTitle": "葡萄牙 对 乌兹别克斯坦",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 58",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 41,
        "name": "Portugal",
        "zh": "葡萄牙",
        "flag": "🇵🇹"
      },
      {
        "teamId": 43,
        "name": "Uzbekistan",
        "zh": "乌兹别克斯坦",
        "flag": "🇺🇿"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 59,
    "viewerMatchId": 59,
    "title": "England vs Ghana",
    "zhTitle": "英格兰 对 加纳",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 59",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 45,
        "name": "England",
        "zh": "英格兰",
        "flag": "🏴"
      },
      {
        "teamId": 47,
        "name": "Ghana",
        "zh": "加纳",
        "flag": "🇬🇭"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 60,
    "viewerMatchId": 60,
    "title": "Panama vs Croatia",
    "zhTitle": "巴拿马 对 克罗地亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 60",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 48,
        "name": "Panama",
        "zh": "巴拿马",
        "flag": "🇵🇦"
      },
      {
        "teamId": 46,
        "name": "Croatia",
        "zh": "克罗地亚",
        "flag": "🇭🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 61,
    "viewerMatchId": 61,
    "title": "Colombia vs DR Congo",
    "zhTitle": "哥伦比亚 对 刚果（金）",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 61",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 44,
        "name": "Colombia",
        "zh": "哥伦比亚",
        "flag": "🇨🇴"
      },
      {
        "teamId": 42,
        "name": "DR Congo",
        "zh": "刚果（金）",
        "flag": "🇨🇩"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 62,
    "viewerMatchId": 62,
    "title": "Bosnia and Herzegovina vs Qatar",
    "zhTitle": "波黑 对 卡塔尔",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 62",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 6,
        "name": "Bosnia and Herzegovina",
        "zh": "波黑",
        "flag": "🇧🇦"
      },
      {
        "teamId": 7,
        "name": "Qatar",
        "zh": "卡塔尔",
        "flag": "🇶🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 63,
    "viewerMatchId": 63,
    "title": "Switzerland vs Canada",
    "zhTitle": "瑞士 对 加拿大",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 63",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 8,
        "name": "Switzerland",
        "zh": "瑞士",
        "flag": "🇨🇭"
      },
      {
        "teamId": 5,
        "name": "Canada",
        "zh": "加拿大",
        "flag": "🇨🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 64,
    "viewerMatchId": 64,
    "title": "Morocco vs Haiti",
    "zhTitle": "摩洛哥 对 海地",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 64",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 10,
        "name": "Morocco",
        "zh": "摩洛哥",
        "flag": "🇲🇦"
      },
      {
        "teamId": 11,
        "name": "Haiti",
        "zh": "海地",
        "flag": "🇭🇹"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 65,
    "viewerMatchId": 65,
    "title": "Scotland vs Brazil",
    "zhTitle": "苏格兰 对 巴西",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 65",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 12,
        "name": "Scotland",
        "zh": "苏格兰",
        "flag": "🏴"
      },
      {
        "teamId": 9,
        "name": "Brazil",
        "zh": "巴西",
        "flag": "🇧🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 66,
    "viewerMatchId": 66,
    "title": "Czechia vs Mexico",
    "zhTitle": "捷克 对 墨西哥",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 66",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 4,
        "name": "Czechia",
        "zh": "捷克",
        "flag": "🇨🇿"
      },
      {
        "teamId": 1,
        "name": "Mexico",
        "zh": "墨西哥",
        "flag": "🇲🇽"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 67,
    "viewerMatchId": 67,
    "title": "South Africa vs South Korea",
    "zhTitle": "南非 对 韩国",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 67",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 2,
        "name": "South Africa",
        "zh": "南非",
        "flag": "🇿🇦"
      },
      {
        "teamId": 3,
        "name": "South Korea",
        "zh": "韩国",
        "flag": "🇰🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 68,
    "viewerMatchId": 68,
    "title": "Curaçao vs Ivory Coast",
    "zhTitle": "库拉索 对 科特迪瓦",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 68",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 18,
        "name": "Curaçao",
        "zh": "库拉索",
        "flag": "🇨🇼"
      },
      {
        "teamId": 19,
        "name": "Ivory Coast",
        "zh": "科特迪瓦",
        "flag": "🇨🇮"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 69,
    "viewerMatchId": 69,
    "title": "Ecuador vs Germany",
    "zhTitle": "厄瓜多尔 对 德国",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 69",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 20,
        "name": "Ecuador",
        "zh": "厄瓜多尔",
        "flag": "🇪🇨"
      },
      {
        "teamId": 17,
        "name": "Germany",
        "zh": "德国",
        "flag": "🇩🇪"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 70,
    "viewerMatchId": 70,
    "title": "Japan vs Sweden",
    "zhTitle": "日本 对 瑞典",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 70",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 22,
        "name": "Japan",
        "zh": "日本",
        "flag": "🇯🇵"
      },
      {
        "teamId": 23,
        "name": "Sweden",
        "zh": "瑞典",
        "flag": "🇸🇪"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 71,
    "viewerMatchId": 71,
    "title": "Tunisia vs Netherlands",
    "zhTitle": "突尼斯 对 荷兰",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 71",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 24,
        "name": "Tunisia",
        "zh": "突尼斯",
        "flag": "🇹🇳"
      },
      {
        "teamId": 21,
        "name": "Netherlands",
        "zh": "荷兰",
        "flag": "🇳🇱"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 72,
    "viewerMatchId": 72,
    "title": "Türkiye vs USA",
    "zhTitle": "土耳其 对 美国",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 72",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 16,
        "name": "Türkiye",
        "zh": "土耳其",
        "flag": "🇹🇷"
      },
      {
        "teamId": 13,
        "name": "USA",
        "zh": "美国",
        "flag": "🇺🇸"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 73,
    "viewerMatchId": 73,
    "title": "Paraguay vs Australia",
    "zhTitle": "巴拉圭 对 澳大利亚",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 73",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 14,
        "name": "Paraguay",
        "zh": "巴拉圭",
        "flag": "🇵🇾"
      },
      {
        "teamId": 15,
        "name": "Australia",
        "zh": "澳大利亚",
        "flag": "🇦🇺"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 74,
    "viewerMatchId": 74,
    "title": "Senegal vs Iraq",
    "zhTitle": "塞内加尔 对 伊拉克",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 74",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 34,
        "name": "Senegal",
        "zh": "塞内加尔",
        "flag": "🇸🇳"
      },
      {
        "teamId": 35,
        "name": "Iraq",
        "zh": "伊拉克",
        "flag": "🇮🇶"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 75,
    "viewerMatchId": 75,
    "title": "Norway vs France",
    "zhTitle": "挪威 对 法国",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 75",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 36,
        "name": "Norway",
        "zh": "挪威",
        "flag": "🇳🇴"
      },
      {
        "teamId": 33,
        "name": "France",
        "zh": "法国",
        "flag": "🇫🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 76,
    "viewerMatchId": 76,
    "title": "Cape Verde vs Saudi Arabia",
    "zhTitle": "佛得角 对 沙特",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 76",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 30,
        "name": "Cape Verde",
        "zh": "佛得角",
        "flag": "🇨🇻"
      },
      {
        "teamId": 31,
        "name": "Saudi Arabia",
        "zh": "沙特",
        "flag": "🇸🇦"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 77,
    "viewerMatchId": 77,
    "title": "Uruguay vs Spain",
    "zhTitle": "乌拉圭 对 西班牙",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 77",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 32,
        "name": "Uruguay",
        "zh": "乌拉圭",
        "flag": "🇺🇾"
      },
      {
        "teamId": 29,
        "name": "Spain",
        "zh": "西班牙",
        "flag": "🇪🇸"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 78,
    "viewerMatchId": 78,
    "title": "Egypt vs Iran",
    "zhTitle": "埃及 对 伊朗",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 78",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 26,
        "name": "Egypt",
        "zh": "埃及",
        "flag": "🇪🇬"
      },
      {
        "teamId": 27,
        "name": "Iran",
        "zh": "伊朗",
        "flag": "🇮🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 79,
    "viewerMatchId": 79,
    "title": "New Zealand vs Belgium",
    "zhTitle": "新西兰 对 比利时",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 79",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 28,
        "name": "New Zealand",
        "zh": "新西兰",
        "flag": "🇳🇿"
      },
      {
        "teamId": 25,
        "name": "Belgium",
        "zh": "比利时",
        "flag": "🇧🇪"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 80,
    "viewerMatchId": 80,
    "title": "Croatia vs Ghana",
    "zhTitle": "克罗地亚 对 加纳",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 80",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 46,
        "name": "Croatia",
        "zh": "克罗地亚",
        "flag": "🇭🇷"
      },
      {
        "teamId": 47,
        "name": "Ghana",
        "zh": "加纳",
        "flag": "🇬🇭"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 81,
    "viewerMatchId": 81,
    "title": "Panama vs England",
    "zhTitle": "巴拿马 对 英格兰",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 81",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 48,
        "name": "Panama",
        "zh": "巴拿马",
        "flag": "🇵🇦"
      },
      {
        "teamId": 45,
        "name": "England",
        "zh": "英格兰",
        "flag": "🏴"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 82,
    "viewerMatchId": 82,
    "title": "Colombia vs Portugal",
    "zhTitle": "哥伦比亚 对 葡萄牙",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 82",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 44,
        "name": "Colombia",
        "zh": "哥伦比亚",
        "flag": "🇨🇴"
      },
      {
        "teamId": 41,
        "name": "Portugal",
        "zh": "葡萄牙",
        "flag": "🇵🇹"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 83,
    "viewerMatchId": 83,
    "title": "DR Congo vs Uzbekistan",
    "zhTitle": "刚果（金） 对 乌兹别克斯坦",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 83",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 42,
        "name": "DR Congo",
        "zh": "刚果（金）",
        "flag": "🇨🇩"
      },
      {
        "teamId": 43,
        "name": "Uzbekistan",
        "zh": "乌兹别克斯坦",
        "flag": "🇺🇿"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 84,
    "viewerMatchId": 84,
    "title": "Jordan vs Argentina",
    "zhTitle": "约旦 对 阿根廷",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 84",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 40,
        "name": "Jordan",
        "zh": "约旦",
        "flag": "🇯🇴"
      },
      {
        "teamId": 37,
        "name": "Argentina",
        "zh": "阿根廷",
        "flag": "🇦🇷"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  },
  {
    "marketId": 85,
    "viewerMatchId": 85,
    "title": "Algeria vs Austria",
    "zhTitle": "阿尔及利亚 对 奥地利",
    "shrine": "小组赛红灯笼盘",
    "date": "WorldCupViewer Match 85",
    "close": "Winner or draw via getMatchResult()",
    "type": "Match Winner",
    "outcomes": [
      {
        "teamId": 38,
        "name": "Algeria",
        "zh": "阿尔及利亚",
        "flag": "🇩🇿"
      },
      {
        "teamId": 39,
        "name": "Austria",
        "zh": "奥地利",
        "flag": "🇦🇹"
      },
      {
        "teamId": 50,
        "name": "Draw",
        "zh": "平局",
        "flag": "⚖️"
      }
    ]
  }
];

const vaultSchemaRows = [
  ['description()', 'Dynamic vault status + revenue held'],
  ['vaultUISchema()', 'Auto-renderable method catalog for Flap'],
  ['guardian()', 'Emergency authority address'],
  ['worldCupViewer()', 'BSC WorldCupViewer source'],
  ['refreshSettlement(matchId)', 'Reads winner/group/match results'],
  ['upsertMarket(...)', 'Curates World Cup market metadata'],
  ['recoverNative(...)', 'Guardian-only tax revenue recovery'],
];

function shortAddress(address?: string) {
  if (!address) return 'Not configured';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type BscWalletLike = {
  address?: string;
  type?: string;
  chainType?: string;
  walletClientType?: string;
  switchChain?: (chainId: number) => Promise<void>;
  getEthereumProvider?: () => Promise<unknown>;
};

type TwitterProfileLike = {
  username?: string | null;
  name?: string | null;
  profilePictureUrl?: string | null;
};

type UserWalletLike = {
  wallet?: {address?: string; chainType?: string; walletClientType?: string};
  twitter?: TwitterProfileLike;
  email?: {address?: string};
  google?: {email?: string};
  linkedAccounts?: Array<{
    type?: string;
    address?: string;
    chainType?: string;
    walletClientType?: string;
    username?: string | null;
    name?: string | null;
    profilePictureUrl?: string | null;
  }>;
};

function isBscCapableWallet(wallet: BscWalletLike) {
  // Privy names all EVM-compatible wallets "ethereum" at the SDK/API layer.
  // BSC is still the selected runtime chain through defaultChain/supportedChains + switchChain(56).
  return Boolean(wallet.address) && (
    wallet.type === 'ethereum' ||
    wallet.chainType === 'ethereum' ||
    typeof wallet.getEthereumProvider === 'function' ||
    typeof wallet.switchChain === 'function'
  );
}

function isPrivyEmbeddedWallet(wallet: BscWalletLike) {
  return wallet.walletClientType === 'privy' || wallet.walletClientType === 'privy-v2' || Boolean((wallet as {imported?: boolean}).imported);
}

function pickBscWallet(wallets: BscWalletLike[]) {
  return wallets.find((wallet) => isBscCapableWallet(wallet) && isPrivyEmbeddedWallet(wallet)) ?? wallets.find(isBscCapableWallet) ?? null;
}

function pickUserBscAddress(user?: UserWalletLike | null) {
  const primary = user?.wallet;
  if (primary?.address && primary.chainType !== 'solana') return primary.address;
  const linked = user?.linkedAccounts?.find((account) => account.type === 'wallet' && account.address && account.chainType !== 'solana');
  return linked?.address ?? null;
}

function walletDisplay(wallet: BscWalletLike | null, userWalletAddress?: string | null) {
  if (wallet?.address) return shortAddress(wallet.address);
  if (userWalletAddress) return `${shortAddress(userWalletAddress)} · reconnect`;
  return 'No BSC wallet yet';
}

function pickTwitterProfile(user?: UserWalletLike | null): TwitterProfileLike | null {
  if (user?.twitter?.username || user?.twitter?.name || user?.twitter?.profilePictureUrl) return user.twitter;
  const linkedTwitter = user?.linkedAccounts?.find((account) => account.type === 'twitter_oauth' || account.type === 'twitter');
  if (linkedTwitter?.username || linkedTwitter?.name || linkedTwitter?.profilePictureUrl) return linkedTwitter;
  return null;
}

function fallbackIdentity(user?: UserWalletLike | null) {
  return user?.email?.address ?? user?.google?.email ?? 'Privy connected';
}

function TwitterProfilePill({user}: {user?: UserWalletLike | null}) {
  const twitter = pickTwitterProfile(user);
  const username = twitter?.username?.replace(/^@/, '');
  const displayName = twitter?.name || (username ? `@${username}` : fallbackIdentity(user));
  const subline = username ? `@${username}` : 'Twitter not linked';
  const href = username ? `https://x.com/${username}` : undefined;
  const avatar = twitter?.profilePictureUrl;
  const content = (
    <>
      {avatar ? <img className="twitterAvatar" src={avatar} alt="" referrerPolicy="no-referrer" /> : <span className="twitterAvatar fallback">𝕏</span>}
      <span className="twitterCopy"><b>{displayName}</b><small>{subline}</small></span>
    </>
  );
  if (href) return <a className="twitterPill" href={href} target="_blank" rel="noreferrer">{content}</a>;
  return <span className="twitterPill muted">{content}</span>;
}

function ConfigNeededApp() {
  return <AppShell configReady={false} />;
}

function PrivyReadyApp() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      clientId={PRIVY_CLIENT_ID}
      config={{
        defaultChain: bsc,
        supportedChains: [bsc],
        appearance: {
          theme: 'dark',
          accentColor: '#ff3434',
          showWalletLoginFirst: false,
        },
        loginMethods: ['google', 'twitter', 'email', 'wallet'],
        embeddedWallets: {ethereum: {createOnLogin: 'users-without-wallets'}},
      }}
    >
      <AppShell configReady />
    </PrivyProvider>
  );
}

function ConnectWalletButton({configReady}: {configReady: boolean}) {
  if (!configReady) return <button className="btn primary connectButton" type="button" disabled>Privy needed</button>;
  return <ConnectedPrivyButton />;
}

function ConnectedPrivyButton() {
  const {ready, authenticated, login, logout, user} = usePrivy();
  const {wallets} = useWallets();
  const bscWallet = pickBscWallet(wallets as BscWalletLike[]);
  const userWalletAddress = pickUserBscAddress(user as UserWalletLike | null);
  if (!ready) return <button className="btn primary connectButton" type="button" disabled>Privy init…</button>;
  if (!authenticated) return <button className="btn primary connectButton" type="button" onClick={login}>Connect</button>;
  return (
    <div className="connectedCluster">
      <TwitterProfilePill user={user as UserWalletLike | null} />
      <span className="walletPill">BSC · {walletDisplay(bscWallet, userWalletAddress)}</span>
      <button className="btn ghost connectButton" type="button" onClick={logout}>Sign out</button>
    </div>
  );
}

function WalletPanel({configReady}: {configReady: boolean}) {
  if (!configReady) {
    return (
      <div className="panel strong walletPanel">
        <div className="statusDot warn" />
        <h3>Wallet setup required</h3>
        <p>Set <code>VITE_PRIVY_APP_ID</code> to enable login. Betting stays disabled until Privy and <code>VITE_BETTING_VAULT_ADDRESS</code> are configured.</p>
        <div className="walletRows">
          <div className="walletRow"><span>Chain</span><b>BSC · {BSC_CHAIN_ID}</b></div>
          <div className="walletRow"><span>Betting vault</span><b>{shortAddress(BETTING_VAULT_ADDRESS)}</b></div>
        </div>
      </div>
    );
  }
  return <PrivyWalletPanel />;
}

function PrivyWalletPanel() {
  const {ready, authenticated, login, user} = usePrivy();
  const {ready: walletsReady, wallets} = useWallets();
  const {createWallet} = useCreateWallet();
  const {connectWallet} = useConnectWallet();
  const [message, setMessage] = useState('BSC connection not checked yet.');
  const [busy, setBusy] = useState(false);
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const userWalletAddress = pickUserBscAddress(user as UserWalletLike | null);

  async function ensureBsc() {
    if (!bscWallet) return;
    setBusy(true);
    try {
      await bscWallet.switchChain?.(BSC_CHAIN_ID);
      setMessage('BSC ready · chain 56');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'BSC switch failed');
    } finally {
      setBusy(false);
    }
  }

  function reconnectWallet() {
    connectWallet({walletChainType: 'ethereum-only'});
    setMessage('Open Privy and connect the EVM/BSC wallet again.');
  }

  async function createEmbedded() {
    setBusy(true);
    try {
      await createWallet();
      setMessage('Embedded wallet requested.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="panel strong walletPanel"><h3>Loading Privy…</h3></div>;
  if (!authenticated) {
    return (
      <div className="panel strong walletPanel">
        <div className="statusDot warn" />
        <h3>Connect</h3>
        <p>Log in before signing any BSC bet. No stake moves until you press the red confirm button in the slip.</p>
        <button className="btn primary" type="button" onClick={login}>Open Privy modal</button>
      </div>
    );
  }

  return (
    <div className="panel strong walletPanel">
      <div className="statusDot ok" />
      <h3>Wallet ready</h3>
      <p>{user?.email?.address ?? user?.google?.email ?? 'Signed in user'} · BSC wallet flow for real market transactions.</p>
      <div className="walletRows">
        <div className="walletRow"><span>Privy</span><b>Connected</b></div>
        <div className="walletRow"><span>BSC wallet</span><b>{walletDisplay(bscWallet, userWalletAddress)}</b></div>
        <div className="walletRow"><span>Runtime chain</span><b>BSC · {BSC_CHAIN_ID}</b></div>
        <div className="walletRow"><span>Betting vault</span><b>{shortAddress(BETTING_VAULT_ADDRESS)}</b></div>
      </div>
      <div className="walletActions">
        {!bscWallet && !userWalletAddress && <button className="btn primary" type="button" disabled={!walletsReady || busy} onClick={createEmbedded}>Create BSC wallet</button>}
        {!bscWallet && userWalletAddress && <button className="btn primary" type="button" disabled={busy} onClick={reconnectWallet}>Reconnect BSC wallet</button>}
        <button className="btn" type="button" disabled={!bscWallet || busy} onClick={ensureBsc}>Ensure BSC</button>
      </div>
      <div className="notice">{message}</div>
    </div>
  );
}

function BettingSlip({pick, configReady}: {pick: Pick | null; configReady: boolean}) {
  if (!configReady) return <StaticSlip pick={pick} reason="Privy env missing" />;
  return <LiveBettingSlip pick={pick} />;
}

function StaticSlip({pick, reason}: {pick: Pick | null; reason: string}) {
  return (
    <aside className="panel slip" aria-label="Order ticket">
      <div className="slipHeader"><h3>Order ticket</h3><span className="badge">Waiting</span></div>
      <div className="slipBody">
        <div className="slipPick"><span>Selection</span><b>{pick ? `${pick.outcome.flag} ${pick.outcome.name}` : 'Choose a market'}</b><span>{reason}</span></div>
        <button className="btn primary" type="button" disabled>Connect to trade</button>
      </div>
    </aside>
  );
}

function LiveBettingSlip({pick}: {pick: Pick | null}) {
  const {authenticated, login} = usePrivy();
  const {ready: walletsReady, wallets} = useWallets();
  const bscWallet = useMemo(() => pickBscWallet(wallets as BscWalletLike[]), [wallets]);
  const [amount, setAmount] = useState('0.01');
  const [status, setStatus] = useState('Choose a market, then buy or sell from your open position before the market closes.');
  const [submitting, setSubmitting] = useState(false);
  const feePreview = Number.isFinite(Number(amount)) ? (Number(amount) * protocolFeeBps) / 10000 : 0;
  const netPreview = Number.isFinite(Number(amount)) ? Number(amount) - feePreview : 0;

  async function writeMarket(action: 'buy' | 'sell') {
    if (!authenticated) return login();
    if (!pick || !bscWallet || !BETTING_VAULT_ADDRESS) return;
    setSubmitting(true);
    try {
      await bscWallet.switchChain?.(BSC_CHAIN_ID);
      const provider = await bscWallet.getEthereumProvider?.();
      if (!provider) throw new Error('Wallet provider not ready yet');
      const client = createWalletClient({chain: bsc, transport: custom(provider)});
      const [account] = await client.getAddresses();
      const value = parseEther(amount);
      const hash = action === 'buy'
        ? await client.writeContract({
            account,
            address: BETTING_VAULT_ADDRESS,
            abi: bettingAbi,
            functionName: 'placeBet',
            args: [BigInt(pick.market.marketId), BigInt(pick.outcome.teamId)],
            value,
          })
        : await client.writeContract({
            account,
            address: BETTING_VAULT_ADDRESS,
            abi: bettingAbi,
            functionName: 'withdrawBet',
            args: [BigInt(pick.market.marketId), BigInt(pick.outcome.teamId), value],
          });
      setStatus(`${action === 'buy' ? 'Buy' : 'Sell'} sent: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${action} failed`);
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !pick || !walletsReady || !bscWallet || !BETTING_VAULT_ADDRESS || submitting;
  return (
    <aside className="panel slip" aria-label="Order ticket">
      <div className="slipHeader"><h3>Order ticket</h3><span className="badge live">BSC</span></div>
      <div className="slipBody">
        <div className="slipPick"><span>Selection</span><b>{pick ? `${pick.outcome.flag} ${pick.outcome.name}` : 'Choose an outcome'}</b><span>{pick?.market.title ?? 'No market selected'}</span></div>
        <label className="stakeInput"><span>Amount BNB</span><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></label>
        <div className="stakeRow">
          <div className="slipStat"><span>Buy stake after fee</span><b>{Math.max(netPreview, 0).toFixed(5)} BNB</b></div>
          <div className="slipStat"><span>Entry fee</span><b>{feePreview.toFixed(5)} BNB</b></div>
          <div className="slipStat wide"><span>Sell rule</span><b>Withdraw open stake before close</b></div>
        </div>
        {!authenticated ? <button className="btn primary" type="button" onClick={login}>Connect to trade</button> : <div className="tradeActions"><button className="btn primary" type="button" disabled={disabled} onClick={() => writeMarket('buy')}>{submitting ? 'Sending…' : 'Buy'}</button><button className="btn sell" type="button" disabled={disabled} onClick={() => writeMarket('sell')}>{submitting ? 'Sending…' : 'Sell / withdraw'}</button></div>}
        <div className="notice">{status}</div>
      </div>
    </aside>
  );
}

function AppShell({configReady}: {configReady: boolean}) {
  const [pick, setPick] = useState<Pick | null>(null);
  const liveReady = Boolean(configReady && BETTING_VAULT_ADDRESS);

  return (
    <>
      <nav className="nav">
        <a className="brand" href="#top"><span className="mark">PF</span><span>PolyFlap</span></a>
        <div className="navlinks"><a href="#markets">Markets</a><a href="#wallet">Wallet</a></div>
        <ConnectWalletButton configReady={configReady} />
      </nav>

      <main id="top" className="shell">
        <section className="hero">
          <div>
            <div className="pill redPill">World Cup prediction markets on Flap</div>
            <h1>PolyFlap</h1>
            <p className="lead">PolyFlap is a World Cup-only prediction market app for Flap. Pick an outcome, connect a BSC wallet through Privy, buy a position with BNB, and sell/withdraw your open stake before the market closes. Results are settled from Flap WorldCupViewer data.</p>
            <div className="heroActions"><a className="btn primary" href="#markets">View markets</a><a className="btn" href="#wallet">Connect wallet</a></div>
            <div className="facts">
              <div className="fact"><b>{liveReady ? 'Live' : 'Preview'}</b><span>betting vault</span></div>
              <div className="fact"><b>{marketFixtures.length}</b><span>markets</span></div>
              <div className="fact"><b>BSC</b><span>native BNB</span></div>
              <div className="fact"><b>Buy / Sell</b><span>pre-close exit</span></div>
            </div>
          </div>
          <WalletPanel configReady={configReady} />
        </section>

        <section id="markets">
          <div className="sectionHead"><h2>World Cup markets.</h2><p>85 markets from the current WorldCupViewer reference data: tournament winner, Group A-L winners, and every listed match winner. Settlement uses <code>getWorldCupWinner()</code>, <code>getGroupMatchWinners()</code>, or <code>getMatchResult()</code>.</p></div>
          <div className="marketLayout">
            <div className="marketBoard">
              {marketFixtures.map((market) => (
                <article className="marketCard" key={market.marketId}>
                  <div className="marketTop"><span>WorldCupViewer M{market.viewerMatchId}</span><span>{market.type}</span></div>
                  <div className="marketTitle"><h3>{market.title}</h3><p>{market.close}</p></div>
                  <div className="outcomeGrid">
                    {market.outcomes.map((outcome) => (
                      <button className={`betBtn ${pick?.market.marketId === market.marketId && pick.outcome.teamId === outcome.teamId ? 'selected' : ''}`} type="button" key={`${market.marketId}-${outcome.teamId}`} onClick={() => setPick({market, outcome})}>
                        <span className="outcomeMain"><span className="countryFlag">{outcome.flag}</span><span>{outcome.name}</span></span><small>teamId {outcome.teamId}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <BettingSlip pick={pick} configReady={configReady} />
          </div>
        </section>

        <section id="wallet">
          <div className="sectionHead"><h2>Wallet.</h2><p>Connect with Privy, use a BSC-capable wallet, and sign buy or sell transactions directly from the order ticket.</p></div>
          <WalletPanel configReady={configReady} />
        </section>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{PRIVY_APP_ID ? <PrivyReadyApp /> : <ConfigNeededApp />}</React.StrictMode>,
);
