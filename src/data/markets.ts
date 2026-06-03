import type { MarketFixture } from '../features/markets/types';

// Source of truth for the market floor (listing + search). On-chain timing/state
// is read live per-market in the detail view. Carved out of the legacy monolith.
// Authored as a plain literal then asserted to MarketFixture[] — TS widens the
// `type` field on a literal this large, so we narrow it back with a cast.
const rawFixtures = [
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

export const marketFixtures = rawFixtures as MarketFixture[];
