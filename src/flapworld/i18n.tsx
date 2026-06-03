import React from 'react';
import { TEAM } from './data';

/* ============================================================
   FlapWorld — bilingual strings (EN primary / 中文 secondary)
   ============================================================ */
const STRINGS = {
  en: {
    nav_home:'Home', nav_markets:'Markets', nav_portfolio:'Portfolio', nav_about:'About',
    connect:'Connect wallet', connected:'Connected', disconnect:'Disconnect',
    soon_badge:'Soon',

    // hero
    hero_kicker:'World Cup 2026 · BNB Chain (BSC)',
    hero_h1a:'PICK A SIDE.', hero_h1b:'BACK IT', hero_h1c:'WITH BNB.',
    hero_sub:'World Cup 2026 prediction markets on BNB Chain. Pick an outcome, buy with BNB, and sell before kickoff. Settled on-chain.',
    hero_cta1:'Explore markets', hero_cta2:'How it works',
    scroll_hint:'Scroll',

    // stats
    stat_live:'Live on BSC',

    // how it works
    how_kicker:'How it works',
    how_h:'Four taps from a hunch to a position.',
    how_1t:'Pick', how_1d:'Choose a match, group or the outright winner — then tap an outcome.',
    how_2t:'Buy with BNB', how_2d:'Stake any amount of BNB. A flat 1% fee, the rest goes into the pool.',
    how_3t:'Sell before close', how_3d:'Change your mind? Withdraw your net stake any time before the market locks.',
    how_4t:'Settled on-chain', how_4d:'Results read straight from Flap’s WorldCupViewer contract on BSC. No middleman.',

    // closing cta
    close_kicker:'85 markets are open',
    close_h:'The whistle is coming.',
    close_sub:'Browse every match, group and the outright board. Find your edge before kickoff.',
    close_cta:'Enter the markets floor',

    // markets
    mk_title:'Markets', mk_floor:'markets floor',
    tab_all:'All', tab_matches:'Matches', tab_groups:'Groups', tab_tournament:'Tournament',
    tab_matches_sub:'Match Winner', tab_groups_sub:'Group Winner', tab_tournament_sub:'Tournament Winner',
    search_ph:'Search team or match…',
    sort_label:'Sort', sort_close:'Closing soonest', sort_pool:'Biggest pool', sort_az:'A–Z',
    showing:'Showing', of:'of',
    empty_h:'No markets match your filters',
    empty_sub:'Try a different team, category or clear your search.',
    clear:'Clear filters',
    pool:'Pool', closes:'Closes', closed_at:'Closed', live:'LIVE',
    home_o:'Home', draw_o:'Draw', away_o:'Away', others_o:'Others',
    winner:'Winner', to_win:'to win',

    // statuses
    st_open:'Open', st_soon:'Closing soon', st_closed:'Locked', st_resolved:'Resolved', st_pending:'Pending',

    // order ticket
    ticket:'Order ticket', your_pick:'Your pick', no_pick:'No selection',
    no_pick_sub:'Tap an outcome on any market to load it here.',
    amount:'Amount', balance:'Balance', max:'Max',
    breakdown:'Breakdown', fee_line:'Platform fee (1%, non-refundable)',
    net_stake:'Net into pool', est_win:'Est. potential win', profit:'Est. profit',
    illustrative:'Illustrative — final payout is set by on-chain pools at close.',
    buy:'Buy position', sell:'Sell / withdraw',
    sell_note:'Selling before close returns your net stake only — the 1% entry fee is not refunded.',
    connect_to_trade:'Connect to trade',
    connect_sub:'Connect a BNB Chain wallet to buy or sell positions.',
    market_locked:'Market locked — trading closed',
    market_resolved:'Market resolved',
    buying:'Confirming…', bought:'Position bought', sold:'Withdrawn',
    quick:'Quick add',

    // portfolio
    pf_title:'Portfolio', pf_kicker:'Your book',
    pf_connect_h:'Connect to see your portfolio', pf_connect_sub:'Your positions, P&L and on-chain activity live here.',
    pf_disconnect:'Disconnect',
    pf_value:'Portfolio value', pf_pnl:'Total P&L', pf_unrealized:'Unrealized', pf_realized:'Realized',
    pf_staked:'Total staked', pf_winrate:'Win rate', pf_fees:'Fees paid', pf_volume:'Volume',
    pf_open:'Open', pf_history:'History', pf_activity:'Activity',
    pf_open_pos:'Open positions', pf_settled:'Settled',
    pf_no_open:'No open positions', pf_no_open_sub:'Pick an outcome on the markets floor to open one.',
    pf_no_hist:'No settled positions yet', pf_no_act:'No activity yet',
    pf_explore:'Explore markets',
    pf_stake:'Stake', pf_value_now:'Value', pf_entry:'Entry', pf_payout:'Payout', pf_net:'Net',
    pf_won:'Won', pf_lost:'Lost', pf_withdrawn:'Withdrawn',
    pf_withdraw:'Withdraw', pf_withdrawing:'Withdrawing…',
    pf_record:'Record', pf_alltime:'All-time P&L', pf_since:'Since',
    pf_share:'Share card', pf_copied:'Link copied',
    pf_rank_rookie:'Rookie', pf_rank_contender:'Contender', pf_rank_sharp:'Sharp', pf_rank_legend:'Legend',
    act_buy:'Bought', act_sell:'Withdrew', act_settle_won:'Won', act_settle_lost:'Settled', act_connect:'Wallet connected',
    pf_ago_now:'just now', pf_ago_m:'m ago', pf_ago_h:'h ago', pf_ago_d:'d ago',
    pf_tx:'tx',
  },
  zh: {
    nav_home:'首页', nav_markets:'市场', nav_portfolio:'持仓', nav_about:'关于',
    connect:'连接钱包', connected:'已连接', disconnect:'断开',
    soon_badge:'即将',

    hero_kicker:'2026 世界杯 · BNB Chain (BSC)',
    hero_h1a:'选边站。', hero_h1b:'用 BNB', hero_h1c:'下注。',
    hero_sub:'BNB 链上的 2026 世界杯预测市场。选择结果，用 BNB 买入，开赛前卖出。链上结算。',
    hero_cta1:'浏览市场', hero_cta2:'玩法说明',
    scroll_hint:'下滑',

    stat_live:'BSC 实时',

    how_kicker:'玩法说明',
    how_h:'从直觉到持仓，只需四步。',
    how_1t:'选择', how_1d:'选一场比赛、小组或夺冠盘口，点击某个结果。',
    how_2t:'用 BNB 买入', how_2d:'投入任意数量 BNB。固定 1% 手续费，其余进入奖池。',
    how_3t:'开赛前卖出', how_3d:'改变主意？市场锁定前随时取回你的净投入。',
    how_4t:'链上结算', how_4d:'结果直接读取 BSC 上 Flap 的 WorldCupViewer 合约，无中间方。',

    close_kicker:'85 个市场进行中',
    close_h:'哨声将至。',
    close_sub:'浏览所有比赛、小组与夺冠盘口。开赛前找到你的优势。',
    close_cta:'进入交易大厅',

    mk_title:'市场', mk_floor:'交易大厅',
    tab_all:'全部', tab_matches:'比赛', tab_groups:'小组', tab_tournament:'夺冠',
    tab_matches_sub:'胜负盘', tab_groups_sub:'小组头名', tab_tournament_sub:'夺冠盘口',
    search_ph:'搜索球队或比赛…',
    sort_label:'排序', sort_close:'最快截止', sort_pool:'最大奖池', sort_az:'按字母',
    showing:'显示', of:'/',
    empty_h:'没有符合条件的市场',
    empty_sub:'换一支球队、类别，或清除搜索。',
    clear:'清除筛选',
    pool:'奖池', closes:'截止', closed_at:'已截止', live:'进行中',
    home_o:'主队', draw_o:'平局', away_o:'客队', others_o:'其他',
    winner:'胜者', to_win:'可赢',

    st_open:'开放', st_soon:'即将截止', st_closed:'已锁定', st_resolved:'已结算', st_pending:'待结算',

    ticket:'下单', your_pick:'你的选择', no_pick:'未选择',
    no_pick_sub:'点击任意市场的结果即可加载到这里。',
    amount:'金额', balance:'余额', max:'最大',
    breakdown:'明细', fee_line:'平台费（1%，不退还）',
    net_stake:'进入奖池', est_win:'预计可赢', profit:'预计盈利',
    illustrative:'仅供参考 — 最终赔付由截止时的链上奖池决定。',
    buy:'买入持仓', sell:'卖出 / 取回',
    sell_note:'开赛前卖出仅退回净投入 — 1% 入场费不退还。',
    connect_to_trade:'连接以交易',
    connect_sub:'连接 BNB 链钱包以买卖持仓。',
    market_locked:'市场已锁定 — 停止交易',
    market_resolved:'市场已结算',
    buying:'确认中…', bought:'已买入', sold:'已取回',
    quick:'快捷',

    // portfolio
    pf_title:'我的持仓', pf_kicker:'你的账本',
    pf_connect_h:'连接以查看持仓', pf_connect_sub:'你的持仓、盈亏与链上活动都在这里。',
    pf_disconnect:'断开',
    pf_value:'组合价值', pf_pnl:'总盈亏', pf_unrealized:'未实现', pf_realized:'已实现',
    pf_staked:'总投入', pf_winrate:'胜率', pf_fees:'手续费', pf_volume:'交易量',
    pf_open:'持仓', pf_history:'历史', pf_activity:'活动',
    pf_open_pos:'当前持仓', pf_settled:'已结算',
    pf_no_open:'暂无持仓', pf_no_open_sub:'在交易大厅选择一个结果即可建仓。',
    pf_no_hist:'还没有已结算的持仓', pf_no_act:'暂无活动',
    pf_explore:'浏览市场',
    pf_stake:'投入', pf_value_now:'现值', pf_entry:'入场', pf_payout:'赔付', pf_net:'净额',
    pf_won:'赢', pf_lost:'输', pf_withdrawn:'已取回',
    pf_withdraw:'取回', pf_withdrawing:'取回中…',
    pf_record:'战绩', pf_alltime:'历史盈亏', pf_since:'始于',
    pf_share:'分享卡片', pf_copied:'链接已复制',
    pf_rank_rookie:'新手', pf_rank_contender:'挑战者', pf_rank_sharp:'高手', pf_rank_legend:'传奇',
    act_buy:'买入', act_sell:'取回', act_settle_won:'赢', act_settle_lost:'结算', act_connect:'钱包已连接',
    pf_ago_now:'刚刚', pf_ago_m:'分钟前', pf_ago_h:'小时前', pf_ago_d:'天前',
    pf_tx:'交易',
  }
};

const LangContext = React.createContext({ lang:'en', t:(k)=>k, setLang:()=>{} });

function LangProvider({ children }){
  const [lang, setLang] = React.useState(() => localStorage.getItem('fw_lang') || 'en');
  React.useEffect(() => {
    localStorage.setItem('fw_lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';
  }, [lang]);
  const t = React.useCallback((k) => (STRINGS[lang] && STRINGS[lang][k]) || STRINGS.en[k] || k, [lang]);
  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
const useT = () => React.useContext(LangContext);

/* market title in the active language */
function marketTitle(m, lang){ return lang === 'zh' ? m.titleZh : m.titleEn; }
/* team name in the active language */
function teamName(code, lang){ const t = TEAM(code); return lang === 'zh' ? t.zh : t.en; }

export { STRINGS, LangContext, LangProvider, useT, marketTitle, teamName };
