/* ==========================================================
   admin-notify.js — 推播通知管理 v2
   ========================================================== */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     CONSTANTS & DEMO DATA
  ══════════════════════════════════════════════ */
  const CLAIM_URL      = 'https://mgm.shinda.com.tw/';
  const WITHDRAWAL_URL = 'https://mgm.shinda.com.tw/withdrawal';
  const RECORDS_URL    = 'https://mgm.shinda.com.tw/records';
  const MGM_URL        = 'https://mgm.shinda.com.tw/';
  const DEMO_EXPIRE = '2026/07/31';
  const LOG_KEY     = 'mgm_notify_log';
  const TPL_KEY     = 'mgm_notify_templates';
  const TAGS_KEY    = 'mgm_tags';
  const UTAGS_KEY   = 'mgm_user_tags';
  const GROUPS_KEY  = 'mgm_groups';
  const TAG_COLORS  = ['#6366f1','#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6b7280'];

  const MEMBERS = [
    //                                                                                                           lastReferralDate   pendingReward  rewardExpireDate  hasReviewCase  hasCollectionCase  doNotDisturb  joinDate      hasResponsible  lastContactDate  isBlacklisted  suitableProducts                    hasNegotiationCase
    { id:'U250310001', name:'王大明',  mobile:'0912-345-678', line:true,  lineJoinDate:'2025-03-10', identities:['新客'],       cases:3, lastReferralDate:'2026-04-15', pendingReward:8000,  rewardExpireDate:'2026-07-20', hasReviewCase:false, hasCollectionCase:true,  doNotDisturb:false, joinDate:'2025-03-10', hasResponsible:true,  lastContactDate:'2026-06-10', isBlacklisted:false, suitableProducts:['信用貸款'],              hasNegotiationCase:false },
    { id:'U240105002', name:'李小芬',  mobile:'0923-456-789', line:true,  lineJoinDate:'2024-01-05', identities:['會員'],       cases:1, lastReferralDate:'2026-05-20', pendingReward:0,     rewardExpireDate:null,         hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2024-01-05', hasResponsible:true,  lastContactDate:'2026-06-20', isBlacklisted:false, suitableProducts:['房屋貸款'],              hasNegotiationCase:false },
    { id:'U230620003', name:'張志偉',  mobile:'0934-567-890', line:false, lineJoinDate:null,         identities:['會員'],       cases:5, lastReferralDate:'2025-12-01', pendingReward:15000, rewardExpireDate:'2026-07-05', hasReviewCase:true,  hasCollectionCase:false, doNotDisturb:false, joinDate:'2023-06-20', hasResponsible:true,  lastContactDate:'2026-04-01', isBlacklisted:false, suitableProducts:['信用貸款','房屋貸款'],   hasNegotiationCase:true  },
    { id:'U250115004', name:'陳美玲',  mobile:'0945-678-901', line:true,  lineJoinDate:'2025-01-15', identities:['會員','新客'],cases:2, lastReferralDate:'2026-06-10', pendingReward:5000,  rewardExpireDate:'2026-08-01', hasReviewCase:false, hasCollectionCase:false, doNotDisturb:true,  joinDate:'2025-01-15', hasResponsible:false, lastContactDate:'2026-05-15', isBlacklisted:false, suitableProducts:['信用貸款'],              hasNegotiationCase:false },
    { id:'U240328005', name:'林建宏',  mobile:'0956-789-012', line:true,  lineJoinDate:'2024-03-28', identities:['新客'],       cases:4, lastReferralDate:'2026-03-01', pendingReward:12000, rewardExpireDate:'2026-06-30', hasReviewCase:false, hasCollectionCase:true,  doNotDisturb:false, joinDate:'2024-03-28', hasResponsible:true,  lastContactDate:'2026-03-10', isBlacklisted:false, suitableProducts:['車貸'],                  hasNegotiationCase:false },
    { id:'U250220006', name:'黃淑惠',  mobile:'0967-890-123', line:true,  lineJoinDate:'2025-02-22', identities:['訪客'],       cases:0, lastReferralDate:null,         pendingReward:0,     rewardExpireDate:null,         hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-02-20', hasResponsible:false, lastContactDate:null,         isBlacklisted:false, suitableProducts:[],                        hasNegotiationCase:false },
    { id:'U250401007', name:'吳俊男',  mobile:'0978-901-234', line:true,  lineJoinDate:'2025-04-01', identities:['員工'],       cases:2, lastReferralDate:'2026-06-05', pendingReward:6000,  rewardExpireDate:'2026-08-15', hasReviewCase:true,  hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-04-01', hasResponsible:true,  lastContactDate:'2026-06-01', isBlacklisted:false, suitableProducts:['企業貸款'],              hasNegotiationCase:true  },
    { id:'U240603008', name:'劉雅婷',  mobile:'0989-012-345', line:true,  lineJoinDate:'2024-06-03', identities:['員工'],       cases:3, lastReferralDate:'2026-01-15', pendingReward:9000,  rewardExpireDate:'2026-07-01', hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2024-06-03', hasResponsible:true,  lastContactDate:'2026-01-20', isBlacklisted:false, suitableProducts:['信用貸款'],              hasNegotiationCase:false },
    { id:'U250508009', name:'蔡政廷',  mobile:'0900-123-456', line:true,  lineJoinDate:'2025-05-10', identities:['訪客'],       cases:0, lastReferralDate:null,         pendingReward:0,     rewardExpireDate:null,         hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-05-08', hasResponsible:false, lastContactDate:null,         isBlacklisted:false, suitableProducts:[],                        hasNegotiationCase:false },
    { id:'U240715010', name:'楊秀英',  mobile:'0911-234-567', line:true,  lineJoinDate:'2024-07-15', identities:['離職員工'],   cases:6, lastReferralDate:'2025-09-01', pendingReward:25000, rewardExpireDate:'2026-07-10', hasReviewCase:false, hasCollectionCase:true,  doNotDisturb:false, joinDate:'2024-07-15', hasResponsible:true,  lastContactDate:'2025-10-01', isBlacklisted:false, suitableProducts:['房屋貸款'],              hasNegotiationCase:false },
    { id:'U250601011', name:'鄭建志',  mobile:'0922-345-678', line:true,  lineJoinDate:'2025-06-01', identities:['會員'],       cases:1, lastReferralDate:null,         pendingReward:0,     rewardExpireDate:null,         hasReviewCase:true,  hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-01', hasResponsible:true,  lastContactDate:'2026-05-01', isBlacklisted:false, suitableProducts:['信用貸款'],              hasNegotiationCase:true  },
    { id:'U250602012', name:'許雅文',  mobile:'0933-456-789', line:true,  lineJoinDate:'2025-06-02', identities:['新客'],       cases:2, lastReferralDate:'2026-06-15', pendingReward:4000,  rewardExpireDate:'2026-08-20', hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-02', hasResponsible:true,  lastContactDate:'2026-06-12', isBlacklisted:false, suitableProducts:['房屋貸款'],              hasNegotiationCase:false },
    { id:'U250603013', name:'賴俊宇',  mobile:'0944-567-890', line:true,  lineJoinDate:'2025-06-03', identities:['訪客'],       cases:0, lastReferralDate:null,         pendingReward:0,     rewardExpireDate:null,         hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-03', hasResponsible:false, lastContactDate:null,         isBlacklisted:true,  suitableProducts:[],                        hasNegotiationCase:false },
    { id:'U250604014', name:'蕭美惠',  mobile:'0955-678-901', line:true,  lineJoinDate:'2025-06-04', identities:['員工'],       cases:4, lastReferralDate:'2026-05-25', pendingReward:18000, rewardExpireDate:'2026-07-08', hasReviewCase:false, hasCollectionCase:true,  doNotDisturb:false, joinDate:'2025-06-04', hasResponsible:true,  lastContactDate:'2026-05-20', isBlacklisted:false, suitableProducts:['信用貸款','車貸'],       hasNegotiationCase:false },
    { id:'U250605015', name:'周建豪',  mobile:'0966-789-012', line:true,  lineJoinDate:'2025-06-05', identities:['會員','新客'],cases:3, lastReferralDate:'2026-06-18', pendingReward:7500,  rewardExpireDate:'2026-08-30', hasReviewCase:true,  hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-05', hasResponsible:true,  lastContactDate:'2026-06-15', isBlacklisted:false, suitableProducts:['房屋貸款'],              hasNegotiationCase:true  },
    { id:'U250606016', name:'謝宛如',  mobile:'0977-890-123', line:true,  lineJoinDate:'2025-06-06', identities:['新客'],       cases:1, lastReferralDate:'2026-02-10', pendingReward:0,     rewardExpireDate:null,         hasReviewCase:false, hasCollectionCase:false, doNotDisturb:true,  joinDate:'2025-06-06', hasResponsible:false, lastContactDate:'2026-04-20', isBlacklisted:true,  suitableProducts:[],                        hasNegotiationCase:false },
    { id:'U250607017', name:'曾國浩',  mobile:'0988-901-234', line:true,  lineJoinDate:'2025-06-07', identities:['訪客'],       cases:0, lastReferralDate:null,         pendingReward:0,     rewardExpireDate:null,         hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-07', hasResponsible:false, lastContactDate:null,         isBlacklisted:false, suitableProducts:[],                        hasNegotiationCase:false },
    { id:'U250608018', name:'黃志明',  mobile:'0999-012-345', line:true,  lineJoinDate:'2025-06-08', identities:['員工'],       cases:2, lastReferralDate:'2026-06-20', pendingReward:5000,  rewardExpireDate:'2026-09-01', hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-08', hasResponsible:true,  lastContactDate:'2026-06-18', isBlacklisted:false, suitableProducts:['企業貸款'],              hasNegotiationCase:false },
    { id:'U250609019', name:'林淑美',  mobile:'0910-123-456', line:true,  lineJoinDate:'2025-06-09', identities:['會員'],       cases:3, lastReferralDate:'2026-03-20', pendingReward:11000, rewardExpireDate:'2026-06-28', hasReviewCase:false, hasCollectionCase:true,  doNotDisturb:false, joinDate:'2025-06-09', hasResponsible:true,  lastContactDate:'2026-03-25', isBlacklisted:false, suitableProducts:['信用貸款','房屋貸款'],   hasNegotiationCase:false },
    { id:'U250610020', name:'陳正義',  mobile:'0921-234-567', line:false, lineJoinDate:null,         identities:['會員'],       cases:1, lastReferralDate:null,         pendingReward:0,     rewardExpireDate:null,         hasReviewCase:true,  hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-10', hasResponsible:true,  lastContactDate:'2026-05-20', isBlacklisted:false, suitableProducts:['信用貸款'],              hasNegotiationCase:true  },
    { id:'U250611021', name:'張雅鈴',  mobile:'0932-345-678', line:true,  lineJoinDate:'2025-06-11', identities:['離職員工'],   cases:2, lastReferralDate:'2025-11-15', pendingReward:8000,  rewardExpireDate:'2026-07-15', hasReviewCase:false, hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-11', hasResponsible:false, lastContactDate:'2025-12-10', isBlacklisted:false, suitableProducts:['房屋貸款'],              hasNegotiationCase:false },
    { id:'U250612022', name:'李建鵬',  mobile:'0943-456-789', line:true,  lineJoinDate:'2025-06-12', identities:['新客'],       cases:4, lastReferralDate:'2026-04-05', pendingReward:14000, rewardExpireDate:'2026-07-25', hasReviewCase:true,  hasCollectionCase:false, doNotDisturb:false, joinDate:'2025-06-12', hasResponsible:true,  lastContactDate:'2026-04-10', isBlacklisted:false, suitableProducts:['車貸'],                  hasNegotiationCase:false },
  ];

  const DEFAULT_TAGS = [
    { id:'tag-vip',      name:'VIP',       color:'#8b5cf6' },
    { id:'tag-new',      name:'新加入',    color:'#10b981' },
    { id:'tag-active',   name:'活躍推薦人', color:'#3b82f6' },
    { id:'tag-inactive', name:'長期未推薦', color:'#f59e0b' },
  ];

  const DEFAULT_GROUPS = [
    {
      id:'grp-001', name:'VIP 客戶群',
      memberIds:['U250310001','U240105002','U250115004','U240328005','U240715010'],
      createdAt:'2026-05-01',
      history:[
        { actor:'Admin', time:'2026-05-01 10:30', action:'建立群組', note:'' },
        { actor:'Admin', time:'2026-05-15 14:20', action:'從標籤「VIP」同步', note:'月度活動前更新名單' },
      ],
    },
    {
      id:'grp-002', name:'6月活動邀請',
      memberIds:['U250310001','U250601011','U250602012','U250604014','U250605015','U250608018'],
      createdAt:'2026-06-01',
      history:[
        { actor:'Admin', time:'2026-06-01 09:00', action:'建立群組', note:'6月活動通知' },
      ],
    },
    {
      id:'grp-003', name:'新進員工',
      memberIds:['U250401007','U240603008','U250604014','U250608018'],
      createdAt:'2026-04-01',
      history:[
        { actor:'Admin', time:'2026-04-01 08:00', action:'建立群組', note:'' },
      ],
    },
  ];

  const DEFAULT_TEMPLATES = [
    { id:'tpl-payout', name:'核款通知', triggerLabel:'推薦案獎金核款 = 同意時', iconCls:'tpl-icon--payout', icon:'fa-solid fa-circle-check',
      sms:'親愛的{姓名}，您的推薦獎金已核款！請於 {效期} 前登入 {URL} 選擇提領方式，逾期視同放棄，請盡速處理。',
      lineType:'text', lineText:'{姓名} 您好！\n您的推薦獎金已核款。\n\n請於 {效期} 前至以下連結\n選擇提領方式\n\n逾期視同放棄，請盡速處理。',
      lineImageCard:{ imageUrl:'', title:'推薦獎金核款通知', body:'您的推薦獎金已核款，請盡速登入平台選擇提領方式。', buttonLabel:'立即前往', buttonUrl:CLAIM_URL },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    { id:'tpl-transferred', name:'已撥款通知', triggerLabel:'提領資料狀態 = 已撥款時', iconCls:'tpl-icon--transfer', icon:'fa-solid fa-money-bill-transfer',
      sms:'親愛的{姓名}，您申請的推薦獎金已完成撥款，請確認帳戶入帳。感謝您推薦理財通，歡迎多多使用！',
      lineType:'text', lineText:'{姓名} 您好！\n您的推薦獎金已撥款至您的帳戶。\n\n感謝您推薦理財通，歡迎繼續支持！',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    { id:'tpl-n11', name:'N11 | 匯款失敗通知', triggerLabel:'提領管理 = 人員標記匯款失敗時', iconCls:'tpl-icon--failed', icon:'fa-solid fa-circle-xmark',
      sms:'親愛的{姓名}，您申請的推薦獎金（案號 {案號}）匯款失敗，請確認銀行帳戶資訊或聯繫理財通專員補件。請於 {效期} 前完成補件，逾期獎金將視為失效。',
      lineType:'text', lineText:'{姓名} 您好\n\n您的推薦獎金（ {提領單號}）未完成入帳。\n請於 {效期} 前至以下連結補件',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    { id:'tpl-n12', name:'N12 | 現場提領失敗通知', triggerLabel:'提領管理（現場提領）= 人員標記提領失敗時', iconCls:'tpl-icon--failed', icon:'fa-solid fa-circle-xmark',
      sms:'親愛的{姓名}，您的推薦獎金現場提領申請（案號 {案號}）未完成。請攜帶本人身分證件重新前往門市，或聯繫理財通專員。請於 {效期} 前完成提領，逾期獎金將視為失效。',
      lineType:'text', lineText:'{姓名} 您好\n\n您的現場提領申請（{提領單號}）未能完成。\n請攜帶本人有效身分證件重新前往指定門市辦理\n{URL}\n\n⏰ 提領期限：{效期}\n逾期獎金將自動失效。',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    { id:'tpl-n13', name:'N13 | 當月失效案件通知（管理者）', triggerLabel:'每月最後一日 = 系統自動執行', iconCls:'tpl-icon--admin', icon:'fa-solid fa-building-user',
      sms:'【理財通系統】本月共 {筆數} 筆推薦獎金因逾期未提領已自動失效，請至後台查看詳情並進行後續處理。',
      lineType:'text', lineText:'系統通知\n\n本月提領失效統計\n共 {筆數} 筆推薦獎金已逾期失效。\n\n請至後台「推薦案件管理」查看。\n{URL}',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
  ];

  /* ══════════════════════════════════════════════
     SYSTEM NOTIFY EVENTS — N01–N13 catalogue
  ══════════════════════════════════════════════ */
  const CUSTOM_EVENTS_KEY = 'mgm_custom_events';

  // Extra templates for N03–N10 (not in DEFAULT_TEMPLATES)
  const SYS_EXTRA_TEMPLATES = [
    {
      id:'tpl-n03', name:'N03 | 現場領取完成確認', triggerLabel:'現場簽收完成時', iconCls:'tpl-icon--store', icon:'fa-solid fa-store',
      sms:'親愛的{姓名}，您的推薦獎金現場領取已完成，感謝您推薦理財通，歡迎多多使用！',
      lineType:'text', lineText:'{姓名} 您好！\n\n您的推薦獎金已完成現場領取。\n感謝您的推薦與支持！\n\n查看歷史紀錄：{URL}',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n04', name:'N04 | 可提領逾期前提醒（7天）', triggerLabel:'距提領截止日剩 7 天', iconCls:'tpl-icon--remind', icon:'fa-solid fa-bell',
      sms:'',
      lineType:'text', lineText:'{姓名} 您好！\n\n提醒您！NT${可提領金額} 將於 7 天後到期。\n逾期視同放棄。\n\n立即選擇提領方式',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n05', name:'N05 | 可提領逾期前提醒（3天）', triggerLabel:'距提領截止日剩 3 天', iconCls:'tpl-icon--urgent', icon:'fa-solid fa-triangle-exclamation',
      sms:'',
      lineType:'text', lineText:'{姓名} 您好！\n\n獎金即將失效！NT${可提領金額} 將於 3 天後到期，逾期視同放棄！\n\n立即選擇提領方式',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n06', name:'N06 | 現場領取前一日提醒', triggerLabel:'預約日期前一日 18:00', iconCls:'tpl-icon--calendar', icon:'fa-solid fa-calendar-check',
      sms:'',
      lineType:'text', lineText:'提醒您明日({預約日期})於 {門市名稱} 領取推薦獎金。\n請攜帶本人有效身分證件前往。\n\n查看預約詳情：{URL}',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n07', name:'N07 | 當日現場領取作業提醒', triggerLabel:'每日 09:00（有預約時）', iconCls:'tpl-icon--admin', icon:'fa-solid fa-clipboard-list',
      sms:'',
      lineType:'text', lineText:'今日({今日日期})共【{預約筆數}】筆現場預約。\n查看預約紀錄：{URL}',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n08', name:'N08 | 每月待撥款作業提醒', triggerLabel:'每月 24 日 09:00', iconCls:'tpl-icon--admin', icon:'fa-solid fa-file-invoice-dollar',
      sms:'',
      lineType:'text', lineText:'{月份}尚有【{待撥款筆數}】筆(NT${待撥款總金額})待匯款。\n\n請於月底前完成並標記。\n查看待匯款紀錄：{URL}',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n09', name:'N09 | 超量案件進入待審提醒', triggerLabel:'案件進入超量待審列時', iconCls:'tpl-icon--urgent', icon:'fa-solid fa-triangle-exclamation',
      sms:'',
      lineType:'text', lineText:'{推薦人姓名} 觸發提領月上限(NT${月上限金額})。\n\n已進入超量待審佇列，請盡速審核。',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
    {
      id:'tpl-n10', name:'N10 | 逾期失效通知', triggerLabel:'提領截止日次日 00:30', iconCls:'tpl-icon--failed', icon:'fa-solid fa-hourglass-end',
      sms:'',
      lineType:'text', lineText:'{姓名} 您好。\n\n遺憾通知：您有【{失效筆數}】筆(共 NT${失效金額})推薦獎金因逾期未提領已失效。\n\n查看歷史紀錄：{URL}',
      lineImageCard:{ imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' },
      lineLocation:{ name:'', address:'', lat:'', lng:'' },
    },
  ];

  const SYSTEM_NOTIFY_EVENTS = [
    { id:'N01', name:'核款通知',                    recipients:'推薦人（會員／員工）', channels:['LINE','SMS'], triggerMethod:'系統自動', triggerTiming:'每月 26 日 09:00',                                       tplId:'tpl-payout',      icon:'fa-solid fa-circle-check',         iconCls:'tpl-icon--payout'   },
    { id:'N02', name:'已撥款通知',                  recipients:'推薦人（會員／員工）', channels:['LINE','SMS'], triggerMethod:'系統自動', triggerTiming:'提領狀態改為「已撥款」時',                                tplId:'tpl-transferred', icon:'fa-solid fa-money-bill-transfer',   iconCls:'tpl-icon--transfer' },
    { id:'N03', name:'現場領取完成確認',            recipients:'推薦人（會員／員工）', channels:['LINE','SMS'], triggerMethod:'系統自動', triggerTiming:'現場簽收完成時',                                          tplId:'tpl-n03',         icon:'fa-solid fa-store',                iconCls:'tpl-icon--store'    },
    { id:'N04', name:'可提領逾期前提醒（7天）',    recipients:'推薦人（會員／員工）', channels:['LINE'],       triggerMethod:'排程掃描', triggerTiming:'距提領截止日（120天計算）剩 7 天',                        tplId:'tpl-n04',         icon:'fa-solid fa-bell',                 iconCls:'tpl-icon--remind'   },
    { id:'N05', name:'可提領逾期前提醒（3天）',    recipients:'推薦人（會員／員工）', channels:['LINE'],       triggerMethod:'排程掃描', triggerTiming:'距提領截止日（120天計算）剩 3 天',                        tplId:'tpl-n05',         icon:'fa-solid fa-triangle-exclamation', iconCls:'tpl-icon--urgent'   },
    { id:'N06', name:'現場領取前一日提醒',          recipients:'推薦人（會員／員工）', channels:['LINE'],       triggerMethod:'排程掃描', triggerTiming:'預約日期前一日 18:00',                                    tplId:'tpl-n06',         icon:'fa-solid fa-calendar-check',       iconCls:'tpl-icon--calendar' },
    { id:'N07', name:'當日現場領取作業提醒',        recipients:'行政人員',            channels:['LINE'],       triggerMethod:'日排程',   triggerTiming:'每日 09:00（有預約時）',                                 tplId:'tpl-n07',         icon:'fa-solid fa-clipboard-list',       iconCls:'tpl-icon--admin'    },
    { id:'N08', name:'每月待撥款作業提醒',          recipients:'會計人員',            channels:['LINE'],       triggerMethod:'月排程',   triggerTiming:'每月 24 日 09:00',                                        tplId:'tpl-n08',         icon:'fa-solid fa-file-invoice-dollar',  iconCls:'tpl-icon--admin'    },
    { id:'N09', name:'超量案件進入待審提醒',        recipients:'管理者／風控人員',    channels:['LINE'],       triggerMethod:'即時觸發', triggerTiming:'案件進入超量待審列時',                                    tplId:'tpl-n09',         icon:'fa-solid fa-triangle-exclamation', iconCls:'tpl-icon--urgent'   },
    { id:'N10', name:'逾期失效通知',                recipients:'推薦人（會員／員工）', channels:['LINE'],       triggerMethod:'排程掃描', triggerTiming:'提領截止日次日 00:30',                                    tplId:'tpl-n10',         icon:'fa-solid fa-hourglass-end',        iconCls:'tpl-icon--failed'   },
    { id:'N11', name:'匯款失敗通知',                recipients:'推薦人（會員／員工）', channels:['LINE','SMS'], triggerMethod:'即時觸發', triggerTiming:'提領功能管理 = 人員標記匯款失敗時',                       tplId:'tpl-n11',         icon:'fa-solid fa-circle-xmark',         iconCls:'tpl-icon--failed'   },
    { id:'N12', name:'現場提領失敗通知',            recipients:'推薦人（會員／員工）', channels:['LINE','SMS'], triggerMethod:'即時觸發', triggerTiming:'提領功能管理（現場提領）= 人員標記提領失敗',              tplId:'tpl-n12',         icon:'fa-solid fa-circle-xmark',         iconCls:'tpl-icon--failed'   },
    { id:'N13', name:'當月失效案件通知（管理者）', recipients:'管理者／風控人員',    channels:['LINE','SMS'], triggerMethod:'排程掃描', triggerTiming:'每月最後一日 = 系統自動執行',                             tplId:'tpl-n13',         icon:'fa-solid fa-building-user',        iconCls:'tpl-icon--admin'    },
  ];

  const DEMO_LOG = [
    { time:'2026/5/30 下午 2:18', actor:'Admin User', recipientDetails:[
        { name:'王大明', id:'U250310001', mobile:'0912-345-678', line:true },
        { name:'林建宏', id:'U240328005', mobile:'0956-789-012', line:true },
        { name:'劉雅婷', id:'U240603008', mobile:'0989-012-345', line:true },
      ], recipientCount:3, channels:['SMS','LINE'], tplName:'核款通知',
      smsText:'親愛的{姓名}，您的推薦獎金已核款！', lineText:'{姓名} 您好！\n您的推薦獎金已核款。',
    },
    { time:'2026/5/20 上午 10:05', actor:'Admin User', recipientDetails:[
        { name:'陳美玲', id:'U250115004', mobile:'0945-678-901', line:true },
      ], recipientCount:1, channels:['SMS'], tplName:'已撥款通知',
      smsText:'親愛的{姓名}，您申請的推薦獎金已完成撥款。', lineText:'',
    },
  ];

  /* ══════════════════════════════════════════════
     STORAGE
  ══════════════════════════════════════════════ */
  function loadJson(key, def) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch { return def; } }
  function saveJson(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

  function loadTemplates() {
    const saved = loadJson(TPL_KEY, {});
    return DEFAULT_TEMPLATES.map((t) => ({
      ...t,
      sms:          saved[t.id + '_sms']          ?? t.sms,
      lineType:     saved[t.id + '_lineType']     ?? t.lineType,
      lineText:     saved[t.id + '_lineText']     ?? t.lineText,
      lineImageCard:saved[t.id + '_lineImageCard']?? t.lineImageCard,
      lineLocation: saved[t.id + '_lineLocation'] ?? t.lineLocation,
    }));
  }
  function saveTplField(id, field, val) {
    const saved = loadJson(TPL_KEY, {});
    saved[id + '_' + field] = val;
    saveJson(TPL_KEY, saved);
  }

  /* ══════════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════ */
  let tags     = loadJson(TAGS_KEY, null) ?? [...DEFAULT_TAGS];
  let userTags = loadJson(UTAGS_KEY, {});
  let tagPage  = 0;
  const TAGS_PER_PAGE = 10;
  let groupListPage = 0;
  const GROUPS_PER_PAGE = 10;
  let groups   = loadJson(GROUPS_KEY, null) ?? DEFAULT_GROUPS.map((g) => ({ ...g, history: g.history.map((h) => ({ ...h })) }));
  const templates = loadTemplates();

  // Send state
  let sendGroups    = new Set();
  let sendTags      = new Set();
  let sendPersons   = new Set();
  let channels      = { line: false, sms: false };
  let activeMsgCh   = 'line';
  let lineType      = 'text';
  let currentTplId  = '';

  // Members tab
  let memberSearch       = '';   // kept for compat
  let memberSearchId     = '';
  let memberSearchName   = '';
  let memberSearchMobile = '';
  let memberIdFilter     = '';   // DEPRECATED
  let memberIdFilters    = [];   // multi-select identity; empty = 全部
  let memberTagFilters   = [];   // multi-select tags
  let memberLineFilter   = '';   // '' | 'yes' | 'no'
  let memberLineJoinFrom = '';
  let memberLineJoinTo   = '';
  let memberGroupFilters = [];   // multi-select groups
  let _activeMfDd = null;        // 當前開啟的篩選下拉 (掛在 body)
  let memberPage     = 1;
  const PAGE_SIZE    = 12;
  let memberSelectedIds = new Set();   // batch selection

  // Groups tab
  let activeGroupId = null;
  let groupMemberSearch = '';
  let groupsView = 'list';   // 'list' | 'detail'
  let groupListSearch = '';

  // Tags tab
  let editingTagId    = null;
  let activeTagDropdown = null;

  // Log tab
  let logPage = 1;
  const LOG_PAGE_SIZE = 15;
  let logFilter = { member: '', dateFrom: '', dateTo: '', actor: '', channel: '', keyword: '' };

  // Modal temp picks
  let pickGroupsSelected  = new Set();
  let pickTagsSelected    = new Set();
  let pickMembersSelected = new Set();
  let batchTagsSelected   = new Set();
  let batchGroupsSelected = new Set();
  let pickMembersFilter   = '';
  let syncTagsSelected    = new Set();
  let grpAddSelected      = new Set();
  let pendingRemoveMemberId = null;
  let selectedGroupMemberIds = new Set();
  let cfEditingGroupId = null;

  /* ══════════════════════════════════════════════
     UTILITIES
  ══════════════════════════════════════════════ */
  function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function nowStr() {
    const d = new Date();
    return d.toLocaleString('zh-TW', { hour12: false }).replace(/\//g,'-');
  }
  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:80px;right:24px;background:${color};color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;box-shadow:0 8px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:8px;`;
    t.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function previewText(raw, name) {
    return (raw || '').replace(/\{姓名\}/g, name).replace(/\{URL\}/g, CLAIM_URL).replace(/\{效期\}/g, DEMO_EXPIRE).replace(/\{案號\}/g, 'M2026052301').replace(/\{筆數\}/g, '3').replace(/\{提領URL\}/g, WITHDRAWAL_URL).replace(/\{紀錄URL\}/g, RECORDS_URL).replace(/\{MGMURL\}/g, MGM_URL);
  }
  function insertAtCursor(ta, text) {
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + text + ta.value.substring(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.dispatchEvent(new Event('input'));
    ta.focus();
  }
  function hexRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function getUserTagIds(uid) { return userTags[uid] || []; }
  function getTagById(id) { return tags.find((t) => t.id === id); }
  function getMemberById(id) { return MEMBERS.find((m) => m.id === id); }
  function getGroupById(id) { return groups.find((g) => g.id === id); }
  function getMemberGroups(uid) { return groups.filter((g) => g.memberIds.includes(uid)); }

  function identityBadge(id) {
    return `<span class="idbadge ib-${esc(id)}">${esc(id)}</span>`;
  }
  function tagChipHtml(tag, removable = false, uid = '') {
    if (!tag) return '';
    const bg   = hexRgba(tag.color, 0.12);
    const col  = tag.color;
    const bdr  = hexRgba(tag.color, 0.3);
    const rm   = removable ? `<span class="u-tag-chip" style="font-size:9px;" data-action="remove-user-tag" data-uid="${uid}" data-tagid="${tag.id}">×</span>` : '';
    return `<span class="u-tag-chip" style="background:${bg};color:${col};border:1px solid ${bdr};" ${removable ? `data-action="remove-user-tag" data-uid="${uid}" data-tagid="${tag.id}" title="點擊移除"` : ''}>
      ${esc(tag.name)}${removable ? '<span class="remove-tag">×</span>' : ''}
    </span>`;
  }

  /* ══════════════════════════════════════════════
     MODAL HELPERS
  ══════════════════════════════════════════════ */
  function openModal(id) { document.getElementById(id).hidden = false; }
  function closeModal(id) { document.getElementById(id).hidden = true; }
  function bindModalClose() {
    document.querySelectorAll('[data-close]').forEach((el) => {
      el.addEventListener('click', () => closeModal(el.dataset.close));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.m-ov:not([hidden])').forEach((m) => { m.hidden = true; });
      }
    });
  }

  /* ══════════════════════════════════════════════
     SEND MODULE
  ══════════════════════════════════════════════ */
  function resolveRecipients() {
    const ids = new Set();
    sendGroups.forEach((gid) => {
      const g = getGroupById(gid);
      if (g) g.memberIds.forEach((id) => ids.add(id));
    });
    sendTags.forEach((tid) => {
      MEMBERS.forEach((m) => {
        if (getUserTagIds(m.id).includes(tid)) ids.add(m.id);
      });
    });
    sendPersons.forEach((id) => ids.add(id));
    return [...ids];
  }

  function renderSendChips() {
    const groupsSection = document.getElementById('rcpt-groups-section');
    const tagsSection   = document.getElementById('rcpt-tags-section');
    const personsSection= document.getElementById('rcpt-persons-section');
    const emptyEl       = document.getElementById('rcpt-chips-empty');

    const hasAny = sendGroups.size || sendTags.size || sendPersons.size;
    emptyEl.style.display = hasAny ? 'none' : '';

    // Groups
    groupsSection.style.display = sendGroups.size ? '' : 'none';
    document.getElementById('rcpt-groups-chips').innerHTML = [...sendGroups].map((gid) => {
      const g = getGroupById(gid);
      return g
        ? `<span class="rchip rchip--group">
             <i class="fa-solid fa-layer-group" style="font-size:10px;"></i>
             ${esc(g.name)} (${g.memberIds.length}人)
             <span class="rchip-x" data-remove-group="${gid}">×</span>
           </span>`
        : '';
    }).join('');

    // Tags
    tagsSection.style.display = sendTags.size ? '' : 'none';
    document.getElementById('rcpt-tags-chips').innerHTML = [...sendTags].map((tid) => {
      const t = getTagById(tid);
      const cnt = MEMBERS.filter((m) => getUserTagIds(m.id).includes(tid)).length;
      return t
        ? `<span class="rchip rchip--tag">
             <span style="width:7px;height:7px;border-radius:50%;background:${t.color};display:inline-block;"></span>
             ${esc(t.name)} (${cnt}人)
             <span class="rchip-x" data-remove-tag="${tid}">×</span>
           </span>`
        : '';
    }).join('');

    // Individuals
    personsSection.style.display = sendPersons.size ? '' : 'none';
    document.getElementById('rcpt-persons-chips').innerHTML = [...sendPersons].map((pid) => {
      const m = getMemberById(pid);
      return m
        ? `<span class="rchip rchip--person">
             <i class="fa-solid fa-user" style="font-size:10px;"></i>
             ${esc(m.name)}
             <span class="rchip-x" data-remove-person="${pid}">×</span>
           </span>`
        : '';
    }).join('');

    // Bind remove buttons
    document.querySelectorAll('[data-remove-group]').forEach((el) =>
      el.addEventListener('click', (e) => { e.stopPropagation(); sendGroups.delete(el.dataset.removeGroup); updateSendTotal(); renderSendChips(); })
    );
    document.querySelectorAll('[data-remove-tag]').forEach((el) =>
      el.addEventListener('click', (e) => { e.stopPropagation(); sendTags.delete(el.dataset.removeTag); updateSendTotal(); renderSendChips(); })
    );
    document.querySelectorAll('[data-remove-person]').forEach((el) =>
      el.addEventListener('click', (e) => { e.stopPropagation(); sendPersons.delete(el.dataset.removePerson); updateSendTotal(); renderSendChips(); })
    );
  }

  function updateSendTotal() {
    const ids   = resolveRecipients();
    const count = ids.length;
    document.getElementById('send-total-label').textContent = `共 ${count} 人`;
    document.getElementById('send-resolved-count').textContent = count;
    // no-line count
    if (channels.line) {
      const noLine = ids.filter((id) => { const m = getMemberById(id); return m && !m.line; }).length;
      document.getElementById('no-line-count').textContent = noLine;
      const warn = document.getElementById('no-line-warn');
      warn.style.display = noLine > 0 ? 'block' : 'none';
    } else {
      document.getElementById('no-line-warn').style.display = 'none';
    }
    const btn = document.getElementById('btn-send-notify');
    btn.disabled = count === 0 || (!channels.line && !channels.sms);
  }

  function syncChannelUI() {
    const lineOpt = document.getElementById('ch-line-opt');
    const smsOpt  = document.getElementById('ch-sms-opt');
    lineOpt.classList.toggle('is-on', channels.line);
    smsOpt.classList.toggle('is-on',  channels.sms);
    document.getElementById('ch-line').checked = channels.line;
    document.getElementById('ch-sms').checked  = channels.sms;

    const lineTab = document.getElementById('msgtab-line');
    const smsTab  = document.getElementById('msgtab-sms');
    lineTab.style.display = channels.line ? '' : 'none';
    smsTab.style.display  = channels.sms  ? '' : 'none';

    const placeholder = document.getElementById('compose-placeholder');
    if (!channels.line && !channels.sms) {
      placeholder.style.display = '';
      document.getElementById('line-compose-area').style.display = 'none';
      document.getElementById('sms-compose-area').style.display  = 'none';
    } else {
      placeholder.style.display = 'none';
      if (!channels.line && activeMsgCh === 'line') activeMsgCh = 'sms';
      if (!channels.sms  && activeMsgCh === 'sms')  activeMsgCh = 'line';
      syncMsgArea();
    }
    updateSendTotal();
  }

  function syncMsgArea() {
    document.querySelectorAll('.msg-tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.ch === activeMsgCh)
    );
    document.getElementById('line-compose-area').style.display = activeMsgCh === 'line' ? '' : 'none';
    document.getElementById('sms-compose-area').style.display  = activeMsgCh === 'sms'  ? '' : 'none';
    if (activeMsgCh === 'sms') syncSmsCount();
    if (activeMsgCh === 'line') syncLineCompose();
  }

  function syncSmsCount() {
    const ta  = document.getElementById('msg-sms-text');
    const len = (ta?.value || '').length;
    const el  = document.getElementById('sms-char-count');
    el.textContent = `${len} 字`;
    el.classList.toggle('warn', len > 60);
    const warn2 = document.getElementById('sms-2nd-warn');
    document.getElementById('sms-char-total').textContent = len;
    warn2.classList.toggle('show', len > 60);
    // preview
    const prev = document.getElementById('sms-preview');
    if (prev) prev.textContent = previewText(ta?.value || '', '王大明') || '（尚未輸入訊息）';
  }

  function syncLineCompose() {
    document.querySelectorAll('.line-type-btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.ltype === lineType)
    );
    document.getElementById('ltype-text').style.display     = lineType === 'text'     ? '' : 'none';
    document.getElementById('ltype-image').style.display    = lineType === 'image'    ? '' : 'none';
    document.getElementById('ltype-location').style.display = lineType === 'location' ? '' : 'none';
  }

  function syncLineTextPreview() {
    const ta  = document.getElementById('msg-line-text');
    const el  = document.getElementById('line-text-preview');
    const len = (ta?.value || '').length;
    document.getElementById('line-char-count').textContent = `${len} 字`;
    if (el) el.textContent = previewText(ta?.value || '', '王大明') || '（尚未輸入）';
  }

  function syncImageCardPreview() {
    const title = document.getElementById('li-title')?.value || '';
    const body  = document.getElementById('li-body')?.value  || '';
    const btnL  = document.getElementById('li-btn-label')?.value || '立即查看';
    const imgUrl= document.getElementById('li-img-url')?.value || '';
    const preview = document.getElementById('li-img-preview');
    if (preview) {
      if (imgUrl) {
        preview.innerHTML = `<img src="${esc(imgUrl)}" style="width:100%;height:110px;object-fit:cover;" onerror="this.style.display='none'" />`;
      } else {
        preview.innerHTML = '<i class="fa-regular fa-image"></i>';
      }
    }
    const tp = document.getElementById('li-title-preview');
    const bp = document.getElementById('li-body-preview');
    const btnp = document.getElementById('li-btn-preview');
    if (tp) tp.textContent = title || '（標題）';
    if (bp) bp.textContent = body  || '（說明文字）';
    if (btnp) btnp.textContent = btnL || '立即查看';
  }

  function syncLocationPreview() {
    const name = document.getElementById('ll-name')?.value || '';
    const addr = document.getElementById('ll-addr')?.value || '';
    const np = document.getElementById('ll-name-preview');
    const ap = document.getElementById('ll-addr-preview');
    if (np) np.textContent = name || '（地點名稱）';
    if (ap) ap.textContent = addr || '（地址）';
  }

  function applyTemplate(tplId) {
    let tpl = loadAllSysTemplates().find((t) => t.id === tplId);
    if (!tpl && tplId) {
      const ce = loadCustomEvents().find((e) => e.id === tplId);
      if (ce) tpl = { sms: ce.smsText || '', lineType: ce.lineType || 'text', lineText: ce.lineText || '', lineImageCard: ce.lineImageCard || { imageUrl:'', title:'', body:'', buttonLabel:'', buttonUrl:'' }, lineLocation: { name:'', address:'', lat:'', lng:'' } };
    }
    const lineText = document.getElementById('msg-line-text');
    const smsText  = document.getElementById('msg-sms-text');
    if (tpl) {
      if (smsText)  smsText.value  = tpl.sms;
      if (lineText) lineText.value = tpl.lineText;
      lineType = tpl.lineType || 'text';
      if (tpl.lineImageCard) {
        const ic = tpl.lineImageCard;
        if (document.getElementById('li-img-url'))   document.getElementById('li-img-url').value   = ic.imageUrl   || '';
        if (document.getElementById('li-title'))     document.getElementById('li-title').value     = ic.title      || '';
        if (document.getElementById('li-body'))      document.getElementById('li-body').value      = ic.body       || '';
        if (document.getElementById('li-btn-label')) document.getElementById('li-btn-label').value = ic.buttonLabel|| '';
        if (document.getElementById('li-btn-url'))   document.getElementById('li-btn-url').value   = ic.buttonUrl  || '';
      }
      if (tpl.lineLocation) {
        const lc = tpl.lineLocation;
        if (document.getElementById('ll-name')) document.getElementById('ll-name').value = lc.name    || '';
        if (document.getElementById('ll-addr')) document.getElementById('ll-addr').value = lc.address || '';
        if (document.getElementById('ll-lat'))  document.getElementById('ll-lat').value  = lc.lat     || '';
        if (document.getElementById('ll-lng'))  document.getElementById('ll-lng').value  = lc.lng     || '';
      }
    } else {
      if (smsText)  smsText.value  = '';
      if (lineText) lineText.value = '';
      lineType = 'text';
    }
    syncLineCompose();
    syncSmsCount();
    syncLineTextPreview();
    syncImageCardPreview();
    syncLocationPreview();
  }

  function buildSendPayload() {
    if (activeMsgCh === 'sms' || channels.sms) {
      return { smsText: document.getElementById('msg-sms-text')?.value || '' };
    }
    return null;
  }

  function getSendSummaryHtml(rcptIds) {
    const groupChips  = [...sendGroups].map((gid) => {
      const g = getGroupById(gid);
      return g ? `<span class="rchip rchip--group"><i class="fa-solid fa-layer-group" style="font-size:10px;"></i> ${esc(g.name)}</span>` : '';
    }).join('');
    const tagChips    = [...sendTags].map((tid) => {
      const t = getTagById(tid);
      return t ? `<span class="rchip rchip--tag"><span style="width:6px;height:6px;border-radius:50%;background:${t.color};display:inline-block;"></span> ${esc(t.name)}</span>` : '';
    }).join('');
    const personChips = [...sendPersons].map((pid) => {
      const m = getMemberById(pid);
      return m ? `<span class="rchip rchip--person"><i class="fa-solid fa-user" style="font-size:10px;"></i> ${esc(m.name)}</span>` : '';
    }).join('');

    const channelBadges = [channels.line ? '<span class="log-ch-badge log-ch-badge--line"><i class="fa-brands fa-line"></i> LINE</span>' : '',
      channels.sms  ? '<span class="log-ch-badge log-ch-badge--sms"><i class="fa-solid fa-comment-sms"></i> SMS</span>'   : ''].filter(Boolean).join(' ');

    let msgPreview = '';
    if (channels.sms) {
      const t = document.getElementById('msg-sms-text')?.value || '';
      if (t) msgPreview += `<div class="sc-label" style="margin-top:10px;">SMS 訊息</div><div class="sc-preview">${esc(previewText(t,'王大明'))}</div>`;
    }
    if (channels.line && lineType === 'text') {
      const t = document.getElementById('msg-line-text')?.value || '';
      if (t) msgPreview += `<div class="sc-label" style="margin-top:10px;">LINE 訊息</div><div class="sc-preview">${esc(previewText(t,'王大明'))}</div>`;
    }
    if (channels.line && lineType === 'image') {
      msgPreview += `<div class="sc-label" style="margin-top:10px;">LINE 影像卡片</div><div class="sc-preview">標題：${esc(document.getElementById('li-title')?.value||'')}\n說明：${esc(document.getElementById('li-body')?.value||'')}</div>`;
    }
    if (channels.line && lineType === 'location') {
      msgPreview += `<div class="sc-label" style="margin-top:10px;">LINE 地點卡片</div><div class="sc-preview">${esc(document.getElementById('ll-name')?.value||'')}  ${esc(document.getElementById('ll-addr')?.value||'')}</div>`;
    }

    return `
      <div class="sc-section">
        <div class="sc-label">發送對象來源</div>
        <div class="sc-chips">${groupChips}${tagChips}${personChips}</div>
        <div class="sc-total"><i class="fa-solid fa-users" style="color:#10b981;margin-right:6px;"></i>去重合計 <strong>${rcptIds.length}</strong> 人</div>
      </div>
      <div class="sc-section">
        <div class="sc-label">推播管道</div>
        <div>${channelBadges}</div>
      </div>
      <div class="sc-section">
        <div class="sc-label">訊息預覽（以王大明為範例）</div>
        ${msgPreview || '<div style="color:#c0c4cc;font-size:12px;">（尚無內容）</div>'}
      </div>`;
  }

  function handleSendClick() {
    const rcptIds = resolveRecipients();
    if (!rcptIds.length) { toast('請先選擇推播對象', '#ef4444'); return; }
    if (!channels.line && !channels.sms) { toast('請先選擇推播管道', '#ef4444'); return; }
    const hasSmsContent  = channels.sms  && (document.getElementById('msg-sms-text')?.value || '').trim();
    const hasLineContent = channels.line && (
      (lineType === 'text'     && (document.getElementById('msg-line-text')?.value  || '').trim()) ||
      (lineType === 'image'    && (document.getElementById('li-title')?.value        || '').trim()) ||
      (lineType === 'location' && (document.getElementById('ll-name')?.value         || '').trim())
    );
    if (!hasSmsContent && !hasLineContent) { toast('請先輸入訊息內容', '#ef4444'); return; }
    document.getElementById('send-confirm-body').innerHTML = getSendSummaryHtml(rcptIds);
    openModal('modal-send-confirm');
  }

  function confirmSend() {
    const rcptIds = resolveRecipients();
    const rcptDetails = rcptIds.map((id) => getMemberById(id)).filter(Boolean)
      .map((m) => ({ name: m.name, id: m.id, mobile: m.mobile, line: m.line }));
    const chList = [];
    if (channels.line) chList.push('LINE');
    if (channels.sms)  chList.push('SMS');
    const tplName = (() => {
      if (!currentTplId) return '自訂';
      const sysEv = SYSTEM_NOTIFY_EVENTS.find((ev) => ev.tplId === currentTplId);
      if (sysEv) return sysEv.name;
      const ce = loadCustomEvents().find((e) => e.id === currentTplId);
      if (ce) return ce.name;
      return loadAllSysTemplates().find((t) => t.id === currentTplId)?.name || '自訂';
    })();
    const entry = {
      time: nowStr(), actor: 'Admin User',
      recipientDetails: rcptDetails, recipientCount: rcptIds.length,
      channels: chList, tplName,
      smsText:  document.getElementById('msg-sms-text')?.value  || '',
      lineText: document.getElementById('msg-line-text')?.value || '',
      lineType, lineImageCard: {
        imageUrl:    document.getElementById('li-img-url')?.value   || '',
        title:       document.getElementById('li-title')?.value     || '',
        body:        document.getElementById('li-body')?.value      || '',
        buttonLabel: document.getElementById('li-btn-label')?.value || '',
        buttonUrl:   document.getElementById('li-btn-url')?.value   || '',
      },
      lineLocation: {
        name:    document.getElementById('ll-name')?.value || '',
        address: document.getElementById('ll-addr')?.value || '',
        lat:     document.getElementById('ll-lat')?.value  || '',
        lng:     document.getElementById('ll-lng')?.value  || '',
      },
    };
    const log = loadJson(LOG_KEY, []);
    log.unshift(entry);
    if (log.length > 200) log.length = 200;
    saveJson(LOG_KEY, log);
    closeModal('modal-send-confirm');
    toast(`推播已發送！${rcptIds.length} 人 × ${chList.join(' + ')}`);
    // clear
    sendGroups.clear(); sendTags.clear(); sendPersons.clear();
    renderSendChips(); updateSendTotal();
  }

  /* ── Pick modals ── */
  function openPickGroups() {
    pickGroupsSelected = new Set(sendGroups);
    renderPickGroupsList();
    openModal('modal-pick-groups');
  }
  function renderPickGroupsList() {
    const q = (document.getElementById('pick-groups-search')?.value || '').toLowerCase();
    const list = document.getElementById('pick-groups-list');
    const filtered = groups.filter((g) => !q || g.name.toLowerCase().includes(q));
    if (!filtered.length) { list.innerHTML = '<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">無群組</div>'; return; }
    list.innerHTML = filtered.map((g) => {
      const sel = pickGroupsSelected.has(g.id);
      return `<div class="pick-item${sel?' is-picked':''}" data-gpick="${g.id}">
        <input class="pick-cb" type="checkbox" ${sel?'checked':''} data-gpick="${g.id}" />
        <div class="pick-info">
          <div class="pick-name">${esc(g.name)}</div>
          <div class="pick-meta">建立 ${g.createdAt}</div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-gpick]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.gpick;
        if (pickGroupsSelected.has(id)) pickGroupsSelected.delete(id); else pickGroupsSelected.add(id);
        renderPickGroupsList();
        updatePickGroupsFooter();
      });
    });
    updatePickGroupsFooter();
  }

  function updatePickGroupsFooter() {
    const resolvedIds = new Set();
    pickGroupsSelected.forEach((gid) => {
      const g = getGroupById(gid);
      if (g) g.memberIds.forEach((id) => resolvedIds.add(id));
    });
    sendTags.forEach((tid) => {
      MEMBERS.forEach((m) => { if (getUserTagIds(m.id).includes(tid)) resolvedIds.add(m.id); });
    });
    sendPersons.forEach((id) => resolvedIds.add(id));
    const selEl = document.getElementById('pick-groups-sel-count');
    if (!selEl) return;
    if (!pickGroupsSelected.size) {
      selEl.textContent = '';
    } else {
      selEl.innerHTML = `已選 ${pickGroupsSelected.size} 個・<strong style="color:#6366f1;">符合 ${resolvedIds.size} 人</strong>`;
    }
  }

  function openPickTags() {
    pickTagsSelected = new Set(sendTags);
    renderPickTagsList();
    openModal('modal-pick-tags');
  }
  function renderPickTagsList() {
    const list = document.getElementById('pick-tags-list');
    if (!tags.length) { list.innerHTML = '<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">尚無標籤</div>'; return; }
    list.innerHTML = tags.map((t) => {
      const sel = pickTagsSelected.has(t.id);
      return `<div class="pick-item${sel?' is-picked':''}" data-tpick="${t.id}">
        <input class="pick-cb" type="checkbox" ${sel?'checked':''} data-tpick="${t.id}" />
        <div class="pick-info">
          <div class="pick-name">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.color};margin-right:6px;vertical-align:middle;"></span>${esc(t.name)}
          </div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-tpick]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.tpick;
        if (pickTagsSelected.has(id)) pickTagsSelected.delete(id); else pickTagsSelected.add(id);
        renderPickTagsList();
        updatePickTagsFooter();
      });
    });
    updatePickTagsFooter();
  }

  function updatePickTagsFooter() {
    const resolvedIds = new Set();
    sendGroups.forEach((gid) => {
      const g = getGroupById(gid);
      if (g) g.memberIds.forEach((id) => resolvedIds.add(id));
    });
    pickTagsSelected.forEach((tid) => {
      MEMBERS.forEach((m) => { if (getUserTagIds(m.id).includes(tid)) resolvedIds.add(m.id); });
    });
    sendPersons.forEach((id) => resolvedIds.add(id));
    const selEl = document.getElementById('pick-tags-sel-count');
    if (!selEl) return;
    if (!pickTagsSelected.size) {
      selEl.textContent = '';
    } else {
      selEl.innerHTML = `已選 ${pickTagsSelected.size} 個・<strong style="color:#6366f1;">符合 ${resolvedIds.size} 人</strong>`;
    }
  }

  function openPickMembers() {
    pickMembersSelected = new Set(sendPersons);
    pickMembersFilter   = '';
    document.getElementById('pick-members-search').value = '';
    document.querySelectorAll('[data-pm-filter]').forEach((b) => b.classList.toggle('active', b.dataset.pmFilter === ''));
    renderPickMembersList();
    openModal('modal-pick-members');
  }
  function renderPickMembersList() {
    const q = (document.getElementById('pick-members-search')?.value || '').toLowerCase();
    const filtered = MEMBERS.filter((m) => {
      if (pickMembersFilter && !m.identities.includes(pickMembersFilter)) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.mobile.replace(/-/g,'').includes(q.replace(/-/g,''))) return false;
      return true;
    });
    const list = document.getElementById('pick-members-list');
    if (!filtered.length) { list.innerHTML = '<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">無符合條件的人員</div>'; return; }
    list.innerHTML = filtered.map((m) => {
      const sel = pickMembersSelected.has(m.id);
      return `<div class="pick-item-m${sel?' is-picked':''}" data-mpick="${m.id}">
        <input class="pick-cb-m" type="checkbox" ${sel?'checked':''} data-mpick="${m.id}" />
        <div class="pick-m-info">
          <div class="pick-m-main">
            <span class="pick-m-name">${esc(m.name)}</span>
            <span class="pick-m-id">${m.id}</span>
          </div>
          <div class="pick-m-meta">
            <span class="pick-m-phone">${m.mobile}</span>
            ${m.identities.map((i)=>identityBadge(i)).join('')}
            ${m.line ? '<span class="gm-line-yes" style="font-size:10px;"><i class="fa-brands fa-line"></i> LINE</span>' : ''}
          </div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-mpick]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.mpick;
        if (pickMembersSelected.has(id)) pickMembersSelected.delete(id); else pickMembersSelected.add(id);
        renderPickMembersList();
        document.getElementById('pick-members-sel-count').textContent = pickMembersSelected.size ? `已選 ${pickMembersSelected.size} 人` : '';
      });
    });
    document.getElementById('pick-members-sel-count').textContent = pickMembersSelected.size ? `已選 ${pickMembersSelected.size} 人` : '';
  }

  /* ══════════════════════════════════════════════
     MEMBERS MODULE
  ══════════════════════════════════════════════ */
  function getMembersFiltered() {
    const qId     = memberSearchId.trim().toLowerCase();
    const qName   = memberSearchName.trim().toLowerCase();
    const qMobile = memberSearchMobile.trim().replace(/-/g, '');
    return MEMBERS.filter((m) => {
      if (memberIdFilters.length && !m.identities.some((id) => memberIdFilters.includes(id))) return false;
      if (memberTagFilters.length && !memberTagFilters.some((tid) => getUserTagIds(m.id).includes(tid))) return false;
      if (memberGroupFilters.length && !memberGroupFilters.some((gid) => getMemberGroups(m.id).some((g) => g.id === gid))) return false;
      if (memberLineFilter === 'yes' && !m.line) return false;
      if (memberLineFilter === 'no'  &&  m.line) return false;
      if ((memberLineJoinFrom || memberLineJoinTo) && !m.lineJoinDate) return false;
      if (memberLineJoinFrom && m.lineJoinDate && m.lineJoinDate < memberLineJoinFrom) return false;
      if (memberLineJoinTo   && m.lineJoinDate && m.lineJoinDate > memberLineJoinTo)   return false;
      if (qId     && !m.id.toLowerCase().includes(qId)) return false;
      if (qName   && !m.name.toLowerCase().includes(qName)) return false;
      if (qMobile && !m.mobile.replace(/-/g, '').includes(qMobile)) return false;
      return true;
    });
  }

  function renderMembersTab() {
    renderMemberTagFilterRow();
    renderMemberGroupFilterRow();
    renderMemberTable();
  }

  function renderMemberTagFilterRow() {
    const row = document.getElementById('member-tag-filter-row');
    if (!row) return;

    const chips = memberTagFilters.map((tid) => {
      const t = getTagById(tid);
      if (!t) return '';
      return `<span class="mf-tag-chip" style="background:${hexRgba(t.color,0.12)};color:${t.color};border:1px solid ${hexRgba(t.color,0.3)};">
        <span class="mf-tag-dot" style="background:${t.color};"></span>
        ${esc(t.name)}
        <span class="mf-tag-remove" data-remove-tag="${tid}" title="移除">×</span>
      </span>`;
    }).join('');

    const clearBtn = memberTagFilters.length > 1
      ? `<button class="mf-clear-all" id="mf-clear-all-btn">清除全部</button>` : '';

    row.innerHTML = `<span class="nm-chip-row-label">標籤</span>${chips}<span id="m-tag-add-anchor" style="position:relative;"></span>${clearBtn}`;

    row.querySelectorAll('[data-remove-tag]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        memberTagFilters = memberTagFilters.filter((x) => x !== el.dataset.removeTag);
        memberPage = 1; renderMemberTagFilterRow(); renderMemberTable();
      });
    });

    row.querySelector('#mf-clear-all-btn')?.addEventListener('click', () => {
      memberTagFilters = []; memberPage = 1; renderMemberTagFilterRow(); renderMemberTable();
    });

    // Add-tag button
    const anchor = document.getElementById('m-tag-add-anchor');
    if (!anchor) return;
    anchor.innerHTML = `<button class="mf-add-btn" type="button"><i class="fa-solid fa-plus"></i>${memberTagFilters.length ? '' : ' 標籤篩選'}</button>`;
    anchor.querySelector('.mf-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openMemberTagDropdown(anchor);
    });
  }

  function openMemberTagDropdown(anchor) {
    if (_tcbCloseHandler) { document.removeEventListener('click', _tcbCloseHandler); _tcbCloseHandler = null; }

    // 若已有開啟的 dropdown（掛在 body 上），則關閉
    if (_activeMfDd) { _activeMfDd.remove(); _activeMfDd = null; return; }

    const dd = document.createElement('div');
    dd.className = 'tcb-dropdown';
    dd.style.cssText = 'position:fixed;z-index:9999;';
    dd.innerHTML = `
      <div class="tcb-search-row">
        <i class="fa-solid fa-magnifying-glass" style="color:#c0c4cc;font-size:11px;"></i>
        <input class="tcb-search-input" placeholder="搜尋標籤名稱…" autocomplete="off" />
      </div>
      <div class="tcb-list"></div>`;

    // 用 fixed 定位：對齊按鈕下方
    const positionDd = () => {
      const r = anchor.getBoundingClientRect();
      dd.style.top  = (r.bottom + 4) + 'px';
      dd.style.left = r.left + 'px';
    };
    positionDd();
    document.body.appendChild(dd);
    _activeMfDd = dd;

    const renderDdList = (q = '') => {
      const list = q ? tags.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())) : tags;
      const listEl = dd.querySelector('.tcb-list');
      if (!list.length) { listEl.innerHTML = '<div class="tcb-empty">無符合標籤</div>'; return; }
      listEl.innerHTML = list.map((t) => {
        const cnt = MEMBERS.filter((m) => getUserTagIds(m.id).includes(t.id)).length;
        const checked = memberTagFilters.includes(t.id);
        return `<div class="tcb-item mf-dd-item${checked ? ' active' : ''}" data-tcbv="${t.id}">
          <input type="checkbox" class="tcb-cb" ${checked ? 'checked' : ''} tabindex="-1" />
          <span class="tcb-dot" style="background:${t.color};"></span>
          <span class="tcb-item-name">${esc(t.name)}</span>
          <span class="tcb-item-cnt">${cnt} 人</span>
        </div>`;
      }).join('');
      listEl.querySelectorAll('.mf-dd-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const tid = item.dataset.tcbv;
          memberTagFilters = memberTagFilters.includes(tid)
            ? memberTagFilters.filter((x) => x !== tid)
            : [...memberTagFilters, tid];
          memberPage = 1; renderMemberTagFilterRow(); renderMemberTable();
          renderDdList(dd.querySelector('.tcb-search-input')?.value || '');
        });
      });
    };

    renderDdList();
    const si = dd.querySelector('.tcb-search-input');
    si?.addEventListener('input', (e) => renderDdList(e.target.value));
    requestAnimationFrame(() => si?.focus());

    const closeDd = () => {
      dd.remove();
      _activeMfDd = null;
      document.removeEventListener('click', _tcbCloseHandler);
      _tcbCloseHandler = null;
    };
    _tcbCloseHandler = (e) => {
      if (!anchor.contains(e.target) && !dd.contains(e.target)) closeDd();
    };
    setTimeout(() => document.addEventListener('click', _tcbCloseHandler), 0);
  }

  function renderMemberGroupFilterRow() {
    const row = document.getElementById('member-group-filter-row');
    if (!row) return;

    const chips = memberGroupFilters.map((gid) => {
      const g = getGroupById(gid);
      if (!g) return '';
      return `<span class="mf-tag-chip" style="background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;">
        <i class="fa-solid fa-layer-group" style="font-size:9px;margin-right:3px;"></i>
        ${esc(g.name)}
        <span class="mf-tag-remove" data-remove-grp-filter="${gid}" title="移除">×</span>
      </span>`;
    }).join('');

    const clearBtn = memberGroupFilters.length > 1
      ? `<button class="mf-clear-all" id="mf-grp-clear-all-btn">清除全部</button>` : '';

    row.innerHTML = `<span class="nm-chip-row-label">群組</span>${chips}<span id="m-grp-add-anchor" style="position:relative;"></span>${clearBtn}`;

    row.querySelectorAll('[data-remove-grp-filter]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        memberGroupFilters = memberGroupFilters.filter((x) => x !== el.dataset.removeGrpFilter);
        memberPage = 1; renderMemberGroupFilterRow(); renderMemberTable();
      });
    });

    row.querySelector('#mf-grp-clear-all-btn')?.addEventListener('click', () => {
      memberGroupFilters = []; memberPage = 1; renderMemberGroupFilterRow(); renderMemberTable();
    });

    const anchor = document.getElementById('m-grp-add-anchor');
    if (!anchor) return;
    anchor.innerHTML = `<button class="mf-add-btn" type="button"><i class="fa-solid fa-plus"></i>${memberGroupFilters.length ? '' : ' 群組篩選'}</button>`;
    anchor.querySelector('.mf-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openMemberGroupDropdown(anchor);
    });
  }

  function openMemberGroupDropdown(anchor) {
    if (_activeMfDd) { _activeMfDd.remove(); _activeMfDd = null; }

    const dd = document.createElement('div');
    dd.className = 'tcb-dropdown';
    dd.style.cssText = 'position:fixed;z-index:9999;';
    dd.innerHTML = `
      <div class="tcb-search-row">
        <i class="fa-solid fa-magnifying-glass" style="color:#c0c4cc;font-size:11px;"></i>
        <input class="tcb-search-input" placeholder="搜尋群組名稱…" autocomplete="off" />
      </div>
      <div class="tcb-list"></div>`;

    const positionDd = () => {
      const r = anchor.getBoundingClientRect();
      dd.style.top  = (r.bottom + 4) + 'px';
      dd.style.left = r.left + 'px';
    };
    positionDd();
    document.body.appendChild(dd);
    _activeMfDd = dd;

    const renderDdList = (q = '') => {
      const list = q ? groups.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())) : groups;
      const listEl = dd.querySelector('.tcb-list');
      if (!list.length) { listEl.innerHTML = '<div class="tcb-empty">無符合群組</div>'; return; }
      listEl.innerHTML = list.map((g) => {
        const checked = memberGroupFilters.includes(g.id);
        return `<div class="tcb-item mf-dd-item${checked ? ' active' : ''}" data-tcbgv="${g.id}">
          <input type="checkbox" class="tcb-cb" ${checked ? 'checked' : ''} tabindex="-1" />
          <span class="tcb-item-name">${esc(g.name)}</span>
          <span class="tcb-item-cnt">${g.memberIds.length} 人</span>
        </div>`;
      }).join('');
      listEl.querySelectorAll('.mf-dd-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const gid = item.dataset.tcbgv;
          memberGroupFilters = memberGroupFilters.includes(gid)
            ? memberGroupFilters.filter((x) => x !== gid)
            : [...memberGroupFilters, gid];
          memberPage = 1; renderMemberGroupFilterRow(); renderMemberTable();
          renderDdList(dd.querySelector('.tcb-search-input')?.value || '');
        });
      });
    };

    renderDdList();
    const si = dd.querySelector('.tcb-search-input');
    si?.addEventListener('input', (e) => renderDdList(e.target.value));
    requestAnimationFrame(() => si?.focus());

    let grpCloseHandler;
    const closeDd = () => {
      dd.remove();
      _activeMfDd = null;
      document.removeEventListener('click', grpCloseHandler);
    };
    grpCloseHandler = (e) => {
      if (!anchor.contains(e.target) && !dd.contains(e.target)) closeDd();
    };
    setTimeout(() => document.addEventListener('click', grpCloseHandler), 0);
  }

  function renderMemberTable() {
    const filtered = getMembersFiltered();
    const total    = filtered.length;
    const pages    = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (memberPage > pages) memberPage = pages;
    const slice = filtered.slice((memberPage - 1) * PAGE_SIZE, memberPage * PAGE_SIZE);

    const totalAll = MEMBERS.length;
    document.getElementById('member-count-label').textContent =
      total === totalAll ? `共 ${total} 人` : `篩選結果：${total} 人（共 ${totalAll} 人）`;

    const tbody = document.getElementById('member-tbody');
    tbody.innerHTML = slice.map((m) => {
      const tagHtml = getUserTagIds(m.id).map((tid) => {
        const t = getTagById(tid);
        return t ? `<span class="tag-chip-sm" style="background:${hexRgba(t.color,0.12)};color:${t.color};border:1px solid ${hexRgba(t.color,0.3)};">${esc(t.name)}</span>` : '';
      }).join('');
      const grpChips = getMemberGroups(m.id).map((g) => `<span style="font-size:11px;color:#4f46e5;background:#eef2ff;padding:2px 7px;border-radius:8px;border:1px solid #c7d2fe;white-space:nowrap;">${esc(g.name)}</span>`).join('');
      const isVisitor = m.identities.includes('訪客');
      const lineHtml = m.line
        ? (isVisitor
            ? `<span class="line-yes line-visitor" title="訪客：已加入好友，尚未使用分享功能"><i class="fa-brands fa-line"></i> 好友</span>`
            : `<span class="line-yes"><i class="fa-brands fa-line"></i> 已加入</span>`)
        : `<span class="line-no">—</span>`;
      return `<tr>
        <td class="td-cb"><input type="checkbox" class="member-row-cb" data-member-cb="${m.id}" ${memberSelectedIds.has(m.id) ? 'checked' : ''} /></td>
        <td>
          <div class="m-name-cell">
            <div><span class="m-name">${esc(m.name)}</span><span class="m-id">${m.id}</span></div>
          </div>
        </td>
        <td style="white-space:nowrap;font-size:12px;">${m.mobile}</td>
        <td><div class="identities-cell">${m.identities.map(identityBadge).join('')}</div></td>
        <td>${lineHtml}</td>
        <td style="font-size:11px;color:#6b7280;white-space:nowrap;">${m.lineJoinDate || '—'}</td>
        <td><div class="tag-chips-cell">${tagHtml || '<span style="color:#c0c4cc;font-size:12px;">—</span>'}</div></td>
        <td>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
            ${grpChips}
            <button class="btn-icon" style="width:22px;height:22px;font-size:10px;color:#6366f1;border-color:#c7d2fe;background:#f5f3ff;" data-attach-groups="${m.id}" title="貼群組"><i class="fa-solid fa-plus"></i></button>
          </div>
        </td>
        <td>
          <button class="btn-s" data-edit-member="${m.id}">編輯</button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit-member]').forEach((btn) =>
      btn.addEventListener('click', () => openMemberEdit(btn.dataset.editMember))
    );
    tbody.querySelectorAll('[data-attach-groups]').forEach((btn) =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); openAttachGroups(btn.dataset.attachGroups); })
    );
    tbody.querySelectorAll('[data-member-cb]').forEach((cb) => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        if (cb.checked) memberSelectedIds.add(cb.dataset.memberCb);
        else memberSelectedIds.delete(cb.dataset.memberCb);
        updateMemberBatchBar();
      });
    });
    syncSelectAllCheckbox();

    // Pagination
    renderMemberPagination(pages, total);
  }

  function renderMemberPagination(pages, total) {
    const el = document.getElementById('member-pagination');
    if (!el) return;
    const from = (memberPage - 1) * PAGE_SIZE + 1;
    const to   = Math.min(memberPage * PAGE_SIZE, total);
    let btns = `<button class="pag-btn" id="pag-prev" ${memberPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>`;
    for (let i = 1; i <= pages; i++) {
      btns += `<button class="pag-btn${i === memberPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    btns += `<button class="pag-btn" id="pag-next" ${memberPage === pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>`;
    el.innerHTML = `<span class="pag-info">第 ${from}–${to} 筆，共 ${total} 筆</span><div class="pag-btns">${btns}</div>`;
    el.querySelector('#pag-prev')?.addEventListener('click', () => { if (memberPage > 1) { memberPage--; renderMemberTable(); } });
    el.querySelector('#pag-next')?.addEventListener('click', () => { if (memberPage < pages) { memberPage++; renderMemberTable(); } });
    el.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => { memberPage = +b.dataset.page; renderMemberTable(); }));
  }

  /* ── Batch operations ── */
  function updateMemberBatchBar() {
    const bar = document.getElementById('member-batch-bar');
    if (!bar) return;
    bar.hidden = memberSelectedIds.size === 0;
    const numEl = document.getElementById('batch-sel-num');
    if (numEl) numEl.textContent = memberSelectedIds.size;
    syncSelectAllCheckbox();
  }

  function syncSelectAllCheckbox() {
    const selAll = document.getElementById('member-select-all');
    if (!selAll) return;
    const filtered = getMembersFiltered();
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(memberPage, pages);
    const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const allSel  = slice.length > 0 && slice.every((m) => memberSelectedIds.has(m.id));
    const someSel = slice.some((m) => memberSelectedIds.has(m.id));
    selAll.checked = allSel;
    selAll.indeterminate = someSel && !allSel;
  }

  function openBatchTagModal() {
    batchTagsSelected = new Set();
    const countEl = document.getElementById('batch-tags-count');
    if (countEl) countEl.textContent = memberSelectedIds.size;
    const list = document.getElementById('batch-tags-list');
    if (!list) return;
    if (!tags.length) {
      list.innerHTML = '<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">尚無標籤，請先建立</div>';
    } else {
      list.innerHTML = tags.map((t) => {
        return `<div class="pick-item" data-btpick="${t.id}">
          <input class="pick-cb" type="checkbox" data-btpick="${t.id}" />
          <div class="pick-info">
            <div class="pick-name">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.color};margin-right:6px;vertical-align:middle;"></span>
              ${esc(t.name)}
            </div>
          </div>
        </div>`;
      }).join('');
      list.querySelectorAll('[data-btpick]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = el.dataset.btpick;
          if (batchTagsSelected.has(id)) batchTagsSelected.delete(id); else batchTagsSelected.add(id);
          el.querySelector('input').checked = batchTagsSelected.has(id);
          el.classList.toggle('is-picked', batchTagsSelected.has(id));
        });
      });
    }
    openModal('modal-batch-tags');
  }

  function confirmBatchTags() {
    if (!batchTagsSelected.size) { toast('請先選擇標籤', '#f59e0b'); return; }
    let added = 0;
    memberSelectedIds.forEach((uid) => {
      if (!userTags[uid]) userTags[uid] = [];
      batchTagsSelected.forEach((tagId) => {
        if (!userTags[uid].includes(tagId)) { userTags[uid].push(tagId); added++; }
      });
    });
    saveUserTags();
    closeModal('modal-batch-tags');
    renderMembersTab();
    const tagNames = [...batchTagsSelected].map((id) => getTagById(id)?.name || id).join('、');
    toast(`已為 ${memberSelectedIds.size} 人貼上標籤「${tagNames}」（新增 ${added} 筆）`);
  }

  function openBatchGroupModal() {
    batchGroupsSelected = new Set();
    const countEl = document.getElementById('batch-groups-count');
    if (countEl) countEl.textContent = memberSelectedIds.size;
    const list = document.getElementById('batch-groups-list');
    if (!list) return;
    if (!groups.length) {
      list.innerHTML = '<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">尚無群組，請先建立</div>';
    } else {
      list.innerHTML = groups.map((g) => `
        <div class="pick-item" data-bgpick="${g.id}">
          <input class="pick-cb" type="checkbox" data-bgpick="${g.id}" />
          <div class="pick-info">
            <div class="pick-name">${esc(g.name)}</div>
            <div class="pick-meta">建立 ${g.createdAt}</div>
          </div>
        </div>`).join('');
      list.querySelectorAll('[data-bgpick]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = el.dataset.bgpick;
          if (batchGroupsSelected.has(id)) batchGroupsSelected.delete(id); else batchGroupsSelected.add(id);
          el.querySelector('input').checked = batchGroupsSelected.has(id);
          el.classList.toggle('is-picked', batchGroupsSelected.has(id));
        });
      });
    }
    openModal('modal-batch-groups');
  }

  function confirmBatchGroups() {
    if (!batchGroupsSelected.size) { toast('請先選擇群組', '#f59e0b'); return; }
    let totalAdded = 0;
    batchGroupsSelected.forEach((gid) => {
      const g = getGroupById(gid);
      if (!g) return;
      let addedToGroup = 0;
      memberSelectedIds.forEach((uid) => {
        if (!g.memberIds.includes(uid)) { g.memberIds.push(uid); addedToGroup++; totalAdded++; }
      });
      if (addedToGroup) addGroupHistory(g, `批次加入 ${addedToGroup} 人（人員管理批次操作）`, '');
    });
    saveGroups();
    closeModal('modal-batch-groups');
    renderMembersTab();
    const groupNames = [...batchGroupsSelected].map((id) => getGroupById(id)?.name || id).join('、');
    toast(`已將 ${memberSelectedIds.size} 人加入群組「${groupNames}」（新增 ${totalAdded} 筆）`);
  }

  /* ── member edit modal ── */
  function openMemberEdit(uid) {
    const m = getMemberById(uid);
    if (!m) return;
    document.getElementById('member-edit-id').value = uid;
    document.getElementById('member-edit-title').textContent = `編輯：${m.name}`;
    // identity checkboxes
    const cbs = document.querySelectorAll('#member-edit-identity-cbs input');
    cbs.forEach((cb) => {
      cb.checked = m.identities.includes(cb.value);
      cb.closest('.id-cb-label').classList.toggle('on', cb.checked);
    });
    renderMemberEditTags(uid);
    openModal('modal-member-edit');
  }

  function renderMemberEditTags(uid) {
    const container = document.getElementById('member-edit-tags');
    if (!container) return;
    const tagIds = getUserTagIds(uid);
    const tagHtml = tagIds.map((tid) => {
      const t = getTagById(tid);
      return t ? `<span class="u-tag-chip" style="background:${hexRgba(t.color,0.12)};color:${t.color};border:1px solid ${hexRgba(t.color,0.3)};" data-action="remove-user-tag" data-uid="${uid}" data-tagid="${tid}" title="點擊移除">${esc(t.name)}<span class="remove-tag">×</span></span>` : '';
    }).join('');
    const addBtn = `<button class="btn-add-tag" data-action="open-tag-dropdown" data-uid="${uid}"><i class="fa-solid fa-plus"></i></button>`;
    container.innerHTML = tagHtml + addBtn;
    container.querySelectorAll('[data-action="remove-user-tag"]').forEach((chip) =>
      chip.addEventListener('click', (e) => { e.stopPropagation(); removeUserTag(chip.dataset.uid, chip.dataset.tagid); renderMemberEditTags(uid); renderMembersTab(); })
    );
    container.querySelectorAll('[data-action="open-tag-dropdown"]').forEach((btn) =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); openTagDropdown(uid, btn); })
    );
  }

  function saveMemberEdit() {
    const uid  = document.getElementById('member-edit-id').value;
    const m    = getMemberById(uid);
    if (!m) return;
    const selected = [];
    document.querySelectorAll('#member-edit-identity-cbs input:checked').forEach((cb) => selected.push(cb.value));
    if (!selected.length) { toast('請至少選擇一個身份', '#ef4444'); return; }
    m.identities = selected;
    closeModal('modal-member-edit');
    renderMembersTab();
    toast('人員資料已更新');
  }

  /* ── 貼群組 (attach groups to a member) ── */
  let attachGroupsMemberId = null;
  let attachGroupsState    = new Map(); // gid -> boolean

  function openAttachGroups(uid) {
    const m = getMemberById(uid);
    if (!m) return;
    attachGroupsMemberId = uid;
    attachGroupsState    = new Map(groups.map((g) => [g.id, g.memberIds.includes(uid)]));
    const titleEl = document.getElementById('attach-groups-title');
    if (titleEl) titleEl.textContent = `管理群組 — ${m.name}`;
    renderAttachGroupsList();
    openModal('modal-attach-groups');
  }

  function renderAttachGroupsList() {
    const list = document.getElementById('attach-groups-list');
    if (!list) return;
    if (!groups.length) {
      list.innerHTML = '<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">尚無群組，請先至群組頁面建立</div>';
      return;
    }
    list.innerHTML = groups.map((g) => {
      const inGroup = attachGroupsState.get(g.id) || false;
      return `<div class="pick-item-m${inGroup ? ' is-picked' : ''}" data-agrp="${g.id}">
        <input class="pick-cb-m" type="checkbox" ${inGroup ? 'checked' : ''} />
        <div style="width:28px;height:28px;border-radius:8px;background:#ede9fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
          <i class="fa-solid fa-layer-group" style="color:#6366f1;font-size:11px;"></i>
        </div>
        <div class="pick-m-info">
          <div class="pick-m-main">
            <span class="pick-m-name">${esc(g.name)}</span>
            ${inGroup ? '<span style="font-size:10px;color:#6366f1;font-weight:600;">已加入</span>' : ''}
          </div>
          <div class="pick-m-meta">
            <span style="font-size:10px;color:#9ca3af;">${g.memberIds.length} 人 · 建立 ${g.createdAt}</span>
          </div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-agrp]').forEach((el) => {
      el.addEventListener('click', () => {
        const gid = el.dataset.agrp;
        attachGroupsState.set(gid, !attachGroupsState.get(gid));
        renderAttachGroupsList();
      });
    });
  }

  function confirmAttachGroups() {
    const uid = attachGroupsMemberId;
    const m   = getMemberById(uid);
    if (!uid || !m) return;
    let changed = 0;
    attachGroupsState.forEach((shouldBeIn, gid) => {
      const g = getGroupById(gid);
      if (!g) return;
      const isIn = g.memberIds.includes(uid);
      if (shouldBeIn && !isIn) {
        g.memberIds.push(uid);
        addGroupHistory(g, `從人員頁面加入：${m.name}`, '');
        changed++;
      } else if (!shouldBeIn && isIn) {
        g.memberIds = g.memberIds.filter((id) => id !== uid);
        addGroupHistory(g, `從人員頁面移除：${m.name}`, '');
        changed++;
      }
    });
    if (changed) saveGroups();
    closeModal('modal-attach-groups');
    renderMembersTab();
    toast(changed ? `已更新 ${changed} 個群組` : '無變更');
  }

  /* ══════════════════════════════════════════════
     CONDITION FILTER ENGINE
  ══════════════════════════════════════════════ */
  const TODAY = new Date('2026-06-23');

  // Field definitions for row-based condition builder
  const CF_FIELDS = [
    // ── 名單系統（CRM）欄位 ──
    { key:'hasResponsible',     group:'crm', label:'責任人員',       ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'有'},{key:'no',label:'無'}] },
    { key:'noContactDays',      group:'crm', label:'未聯絡天數',     ops:[{key:'gte',label:'超過'},{key:'lte',label:'不超過'},{key:'eq',label:'等於'}],                          valType:'number', placeholder:'天' },
    { key:'isBlacklisted',      group:'crm', label:'黑名單標記',     ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'是'},{key:'no',label:'否'}] },
    { key:'doNotDisturb',       group:'crm', label:'勿擾標記',       ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'是'},{key:'no',label:'否'}] },
    { key:'suitableProduct',    group:'crm', label:'符合方案',       ops:[{key:'includes',label:'包含'}],                                                                       valType:'select', opts:[{key:'信用貸款',label:'信用貸款'},{key:'房屋貸款',label:'房屋貸款'},{key:'車貸',label:'車貸'},{key:'企業貸款',label:'企業貸款'}] },
    { key:'hasReviewCase',      group:'crm', label:'進行中審核單',   ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'有'},{key:'no',label:'沒有'}] },
    { key:'hasNegotiationCase', group:'crm', label:'進行中協商單',   ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'有'},{key:'no',label:'沒有'}] },
    { key:'hasCollectionCase',  group:'crm', label:'進行中收款單',   ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'有'},{key:'no',label:'沒有'}] },
    // ── 推薦平台欄位 ──
    { key:'referralCount',      group:'mgm', label:'推薦次數',       ops:[{key:'gte',label:'大於等於'},{key:'lte',label:'小於等於'},{key:'eq',label:'等於'}],                    valType:'number', placeholder:'次數' },
    { key:'lastReferralDays',   group:'mgm', label:'上次推薦距今',   ops:[{key:'gte',label:'超過'},{key:'lte',label:'不超過'}],                                                 valType:'number', placeholder:'天' },
    { key:'pendingReward',      group:'mgm', label:'待領獎金',       ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'yes',label:'有'},{key:'no',label:'沒有'}] },
    { key:'rewardExpireDays',   group:'mgm', label:'獎金到期倒數',   ops:[{key:'lte',label:'不超過'}],                                                                          valType:'number', placeholder:'天' },
    { key:'lineStatus',         group:'mgm', label:'LINE 狀態',      ops:[{key:'eq',label:'等於'}],                                                                             valType:'select', opts:[{key:'joined',label:'已加入'},{key:'not-joined',label:'未加入'}] },
    { key:'identity',           group:'mgm', label:'身份',           ops:[{key:'includes',label:'包含'}],                                                                       valType:'select', opts:[{key:'員工',label:'員工'},{key:'新客',label:'新客'},{key:'會員',label:'會員'},{key:'離職員工',label:'離職員工'},{key:'訪客',label:'訪客'}] },
  ];

  let conditionRows = []; // [{field, op, value}]

  function getCfField(key) { return CF_FIELDS.find((f) => f.key === key); }

  function buildFieldOpts(selectedKey) {
    const groups = [{ key:'crm', label:'名單系統' }, { key:'mgm', label:'推薦平台' }];
    return groups.map(({key, label}) => {
      const opts = CF_FIELDS.filter(f => f.group === key)
        .map(f => `<option value="${f.key}"${f.key === selectedKey ? ' selected' : ''}>${esc(f.label)}</option>`)
        .join('');
      return `<optgroup label="${label}">${opts}</optgroup>`;
    }).join('');
  }

  function badgesHtml(cond) {
    if (!cond) return '';
    const objs = cond.rows
      ? cond.rows.map((row) => {
          const field = getCfField(row.field);
          const fLabel = field ? field.label : row.field;
          const opDef  = field?.ops.find((o) => o.key === row.op);
          const opLabel = opDef ? opDef.label : row.op;
          let valLabel = row.value;
          if (field?.valType === 'select') { const opt = field.opts?.find((o) => o.key === row.value); if (opt) valLabel = opt.label; }
          return { label: `${fLabel} ${opLabel} ${valLabel}`, group: field?.group || 'mgm' };
        })
      : [];
    let html = objs.map(({label, group}) =>
      `<span class="gcb-badge${group === 'crm' ? ' gcb-badge--crm' : ''}">${esc(label)}</span>`
    ).join('');
    if (cond.excludeDND) html += '<span class="gcb-badge gcb-badge--exclude"><i class="fa-solid fa-ban" style="font-size:9px;"></i> 排除勿擾</span>';
    return html;
  }

  function renderCfRows() {
    const container = document.getElementById('cf-rows');
    if (!container) return;
    if (!conditionRows.length) {
      container.innerHTML = '<div class="cfb-empty"><i class="fa-solid fa-filter" style="font-size:18px;opacity:.3;display:block;margin-bottom:6px;"></i>尚無條件，點擊「新增條件」開始篩選</div>';
      return;
    }
    container.innerHTML = conditionRows.map((row, idx) => {
      const field = getCfField(row.field) || CF_FIELDS[0];
      const fieldOpts = buildFieldOpts(row.field);
      const opOpts = field.ops.map((o) => `<option value="${o.key}"${o.key===row.op?' selected':''}>${esc(o.label)}</option>`).join('');
      let valHtml = '';
      if (field.valType === 'select') {
        const valOpts = (field.opts||[]).map((o) => `<option value="${o.key}"${o.key===row.value?' selected':''}>${esc(o.label)}</option>`).join('');
        valHtml = `<select class="cfb-sel cfb-val-sel" data-cfval="${idx}">${valOpts}</select>`;
      } else {
        valHtml = `<input type="number" class="cfb-val-num" min="0" placeholder="${esc(field.placeholder||'數值')}" value="${esc(row.value||'')}" data-cfval="${idx}" />`;
      }
      if (idx === 0) {
        return `<div class="cfb-row" style="grid-template-columns:38px 148px 110px 1fr 30px;">
          <div class="cfb-row-num">${idx+1}</div>
          <select class="cfb-sel cfb-field-sel" data-cfrow="${idx}">${fieldOpts}</select>
          <select class="cfb-sel cfb-op-sel" data-cfop="${idx}">${opOpts}</select>
          ${valHtml}
          <button class="cfb-del-btn" data-cfdel="${idx}" title="移除"><i class="fa-solid fa-xmark"></i></button>
        </div>`;
      }
      return `<div class="cfb-row">
        <div class="cfb-row-num">${idx+1}</div>
        <div class="cfb-and-badge">AND</div>
        <select class="cfb-sel cfb-field-sel" data-cfrow="${idx}">${fieldOpts}</select>
        <select class="cfb-sel cfb-op-sel" data-cfop="${idx}">${opOpts}</select>
        ${valHtml}
        <button class="cfb-del-btn" data-cfdel="${idx}" title="移除"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
    }).join('');

    // Bind field change → re-render row (reset op+value)
    container.querySelectorAll('[data-cfrow]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const idx = +sel.dataset.cfrow;
        const newField = getCfField(sel.value) || CF_FIELDS[0];
        conditionRows[idx] = { field: newField.key, op: newField.ops[0].key, value: newField.valType === 'select' ? (newField.opts[0]?.key || '') : '' };
        renderCfRows(); resetCfPreview();
      });
    });
    // Bind op change
    container.querySelectorAll('[data-cfop]').forEach((sel) => {
      sel.addEventListener('change', () => { conditionRows[+sel.dataset.cfop].op = sel.value; resetCfPreview(); });
    });
    // Bind value change
    container.querySelectorAll('[data-cfval]').forEach((el) => {
      el.addEventListener('change', () => { conditionRows[+el.dataset.cfval].value = el.value; resetCfPreview(); });
      el.addEventListener('input',  () => { conditionRows[+el.dataset.cfval].value = el.value; resetCfPreview(); });
    });
    // Bind delete
    container.querySelectorAll('[data-cfdel]').forEach((btn) => {
      btn.addEventListener('click', () => { conditionRows.splice(+btn.dataset.cfdel, 1); renderCfRows(); resetCfPreview(); });
    });
  }

  function filterByRowConditions(rows, excludeDND) {
    return MEMBERS.filter((m) => {
      if (excludeDND && m.doNotDisturb) return false;
      return rows.every((row) => {
        const v = row.value;
        switch (row.field) {
          case 'referralCount': {
            const cnt = m.cases || 0;
            if (row.op === 'eq')  return cnt === +v;
            if (row.op === 'gte') return cnt >= +v;
            if (row.op === 'lte') return cnt <= +v;
            return true;
          }
          case 'lastReferralDays': {
            if (!m.lastReferralDate) return row.op === 'gte';
            const diff = Math.floor((TODAY - new Date(m.lastReferralDate)) / 86400000);
            if (row.op === 'gte') return diff >= +v;
            if (row.op === 'lte') return diff <= +v;
            return true;
          }
          case 'pendingReward':
            return v === 'yes' ? !!m.pendingReward : !m.pendingReward;
          case 'rewardExpireDays': {
            if (!m.rewardExpireDate) return false;
            const d = Math.floor((new Date(m.rewardExpireDate) - TODAY) / 86400000);
            return d >= 0 && d <= +v;
          }
          case 'hasResponsible':
            return v === 'yes' ? !!m.hasResponsible : !m.hasResponsible;
          case 'noContactDays': {
            if (!m.lastContactDate) return row.op === 'gte';
            const diff = Math.floor((TODAY - new Date(m.lastContactDate)) / 86400000);
            if (row.op === 'eq')  return diff === +v;
            if (row.op === 'gte') return diff >= +v;
            if (row.op === 'lte') return diff <= +v;
            return true;
          }
          case 'isBlacklisted':
            return v === 'yes' ? !!m.isBlacklisted : !m.isBlacklisted;
          case 'doNotDisturb':
            return v === 'yes' ? !!m.doNotDisturb : !m.doNotDisturb;
          case 'suitableProduct':
            return (m.suitableProducts || []).includes(v);
          case 'hasReviewCase':
            return v === 'yes' ? !!m.hasReviewCase : !m.hasReviewCase;
          case 'hasNegotiationCase':
            return v === 'yes' ? !!m.hasNegotiationCase : !m.hasNegotiationCase;
          case 'hasCollectionCase':
            return v === 'yes' ? !!m.hasCollectionCase : !m.hasCollectionCase;
          case 'lineStatus':
            return v === 'joined' ? !!m.line : !m.line;
          case 'identity':
            return m.identities.includes(v);
          default:
            return true;
        }
      });
    });
  }

  function filterByConditions(cond) {
    // Row-based format (new)
    if (cond.rows) return filterByRowConditions(cond.rows, cond.excludeDND);
    // Legacy flat-object format (backward compat)
    return MEMBERS.filter((m) => {
      if (cond.excludeDND && m.doNotDisturb) return false;
      if (cond.identities && cond.identities.length > 0) {
        if (!m.identities.some((id) => cond.identities.includes(id))) return false;
      }
      if (cond.referralCountOp && cond.referralCountVal !== '') {
        const val = +cond.referralCountVal;
        if (cond.referralCountOp === 'eq'  && m.cases !== val) return false;
        if (cond.referralCountOp === 'gte' && m.cases < val)   return false;
        if (cond.referralCountOp === 'lte' && m.cases > val)   return false;
      }
      if (cond.lastReferralDaysVal !== '' && cond.lastReferralDaysVal !== null) {
        const days = +cond.lastReferralDaysVal;
        if (!m.lastReferralDate) { if (cond.lastReferralDaysOp === 'lte') return false; }
        else {
          const diff = Math.floor((TODAY - new Date(m.lastReferralDate)) / 86400000);
          if (cond.lastReferralDaysOp === 'gte' && diff < days) return false;
          if (cond.lastReferralDaysOp === 'lte' && diff > days) return false;
        }
      }
      if (cond.pendingReward === 'yes' && !m.pendingReward)    return false;
      if (cond.pendingReward === 'no'  &&  m.pendingReward)    return false;
      if (cond.rewardExpireDays !== '' && cond.rewardExpireDays !== null) {
        const days = +cond.rewardExpireDays;
        if (!m.rewardExpireDate) return false;
        const diff = Math.floor((new Date(m.rewardExpireDate) - TODAY) / 86400000);
        if (diff > days || diff < 0) return false;
      }
      if (cond.hasReviewCase === 'yes' && !m.hasReviewCase)        return false;
      if (cond.hasReviewCase === 'no'  &&  m.hasReviewCase)        return false;
      if (cond.hasCollectionCase === 'yes' && !m.hasCollectionCase) return false;
      if (cond.hasCollectionCase === 'no'  &&  m.hasCollectionCase) return false;
      if (cond.lineStatus === 'joined'     && !m.line) return false;
      if (cond.lineStatus === 'not-joined' &&  m.line) return false;
      return true;
    });
  }

  function readConditionsFromModal() {
    return {
      rows: conditionRows.map((r) => ({ ...r })),
      excludeDND: document.getElementById('cf-exclude-dnd')?.checked ?? false,
    };
  }

  function rowsToLabels(rows) {
    return rows.map((row) => {
      const field = getCfField(row.field);
      const fLabel = field ? field.label : row.field;
      const opDef  = field?.ops.find((o) => o.key === row.op);
      const opLabel = opDef ? opDef.label : row.op;
      let valLabel = row.value;
      if (field?.valType === 'select') {
        const opt = field.opts?.find((o) => o.key === row.value);
        if (opt) valLabel = opt.label;
      }
      return `${fLabel} ${opLabel} ${valLabel}`;
    });
  }

  function conditionsToLabels(cond) {
    if (cond.rows) return rowsToLabels(cond.rows);
    // Legacy
    const labels = [];
    const opLabel = { eq:'= ', gte:'≥ ', lte:'≤ ' };
    if (cond.referralCountOp && cond.referralCountVal !== '') labels.push(`推薦次數 ${opLabel[cond.referralCountOp]||''}${cond.referralCountVal} 次`);
    if (cond.lastReferralDaysVal !== '')  labels.push(`上次推薦 ${cond.lastReferralDaysOp === 'gte' ? '超過' : '≤'} ${cond.lastReferralDaysVal} 天`);
    if (cond.pendingReward === 'yes')     labels.push('有待領獎金');
    if (cond.pendingReward === 'no')      labels.push('無待領獎金');
    if (cond.rewardExpireDays !== '')     labels.push(`獎金到期 ≤ ${cond.rewardExpireDays} 天`);
    if (cond.hasReviewCase === 'yes')     labels.push('有審核單');
    if (cond.hasReviewCase === 'no')      labels.push('無審核單');
    if (cond.hasCollectionCase === 'yes') labels.push('有收款單');
    if (cond.hasCollectionCase === 'no')  labels.push('無收款單');
    if (cond.lineStatus === 'joined')     labels.push('LINE 已加入');
    if (cond.lineStatus === 'not-joined') labels.push('LINE 未加入');
    if (cond.identities && cond.identities.length) labels.push(`身份：${cond.identities.join('/')}`);
    return labels;
  }

  function resetCfPreview() {
    const area = document.getElementById('cf-preview-area');
    if (area) area.style.display = 'none';
    const btn = document.getElementById('btn-cf-preview');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i> 預覽名單';
    const countEl = document.getElementById('cf-result-count');
    if (countEl) countEl.textContent = '—';
  }

  function renderConditionFilterResult() {
    const cond    = readConditionsFromModal();
    const matched = filterByConditions(cond);
    document.getElementById('cf-result-count').textContent = matched.length;
    const area = document.getElementById('cf-preview-area');
    if (area && area.style.display !== 'none') renderCfPreviewList(matched);
    return matched;
  }

  function renderCfPreviewList(members) {
    const list = document.getElementById('cf-preview-list');
    if (!list) return;
    if (!members.length) { list.innerHTML = '<div style="padding:20px;text-align:center;color:#c0c4cc;font-size:13px;">無符合條件的人員</div>'; return; }
    list.innerHTML = members.slice(0, 30).map((m) =>
      `<div class="pick-item-m" style="cursor:default;">
        <div class="m-avatar" style="width:28px;height:28px;font-size:12px;flex-shrink:0;margin-top:1px;">${esc(m.name.charAt(0))}</div>
        <div class="pick-m-info">
          <div class="pick-m-main">
            <span class="pick-m-name">${esc(m.name)}</span>
            <span class="pick-m-id">${m.id}</span>
          </div>
          <div class="pick-m-meta">
            <span class="pick-m-phone">${m.mobile}</span>
            ${m.identities.map(identityBadge).join('')}
            ${m.line ? '<span class="gm-line-yes" style="font-size:10px;"><i class="fa-brands fa-line"></i> LINE</span>' : ''}
            ${m.pendingReward ? `<span style="color:#10b981;font-weight:600;font-size:10px;">待領 $${m.pendingReward.toLocaleString()}</span>` : ''}
          </div>
        </div>
      </div>`
    ).join('') + (members.length > 30 ? `<div style="padding:8px 16px;font-size:12px;color:#9ca3af;text-align:center;">…另有 ${members.length - 30} 人</div>` : '');
  }

  let pendingConditions  = null;
  let pendingCondMembers = [];

  function openConditionFilter(fromGroupsTab) {
    cfEditingGroupId = null;
    conditionRows = [];
    const excDnd = document.getElementById('cf-exclude-dnd');
    if (excDnd) excDnd.checked = true;
    const timeEl = document.getElementById('cf-time-unlimited');
    if (timeEl) { timeEl.checked = true; const dr = document.getElementById('cfb-date-range'); if (dr) dr.style.display = 'none'; }
    resetCfPreview();
    const toSendBtn = document.getElementById('btn-cf-to-send');
    if (toSendBtn) toSendBtn.style.display = fromGroupsTab ? 'none' : '';
    const saveBtn = document.getElementById('btn-cf-save-group');
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> 存為群組…';
    renderCfRows();
    openModal('modal-condition-filter');
  }

  function confirmSaveCondGroup() {
    const nameEl = document.getElementById('save-cond-group-name');
    const errEl  = document.getElementById('save-cond-group-err');
    const name   = nameEl.value.trim();
    if (!name) { errEl.style.display = ''; nameEl.focus(); return; }
    const cond    = pendingConditions;
    const ids     = pendingCondMembers.map((m) => m.id);
    const labels  = conditionsToLabels(cond);
    const newGroup = {
      id: 'grp-' + Date.now(), name,
      memberIds: ids,
      conditions: cond,
      createdAt: new Date().toISOString().slice(0, 10),
      history: [{
        actor: 'Admin', time: nowStr(),
        action: `從條件篩選建立${labels.length ? `（${labels.join('、')}）` : ''}`,
        note: '',
      }],
    };
    groups.push(newGroup);
    saveGroups();
    closeModal('modal-save-cond-group');
    closeModal('modal-condition-filter');
    activeGroupId = newGroup.id;
    // Switch to groups tab if not already there
    const groupTab = document.querySelector('.ntab[data-ntab="groups"]');
    if (groupTab && !groupTab.classList.contains('active')) groupTab.click();
    showGroupsDetailView(newGroup.id);
    toast(`群組「${name}」已建立，共 ${ids.length} 人`);
  }

  function reapplyGroupConditions() {
    const g = getGroupById(activeGroupId);
    if (!g || !g.conditions) return;
    const matched = filterByConditions(g.conditions);
    const newIds  = matched.map((m) => m.id);
    const added   = newIds.filter((id) => !g.memberIds.includes(id)).length;
    const removed = g.memberIds.filter((id) => !newIds.includes(id)).length;
    const labels  = conditionsToLabels(g.conditions);
    g.memberIds = newIds;
    addGroupHistory(g, `重新套用條件（新增 ${added}，移除 ${removed}）${labels.length ? `（${labels.join('、')}）` : ''}`, '');
    saveGroups();
    renderGroupConditionsBlock(g); renderGroupMemberList(g); renderGroupHistory(g); renderGroupList();
    toast(`條件已重新套用，共 ${newIds.length} 人（+${added} / -${removed}）`);
  }

  function openEditConditions(g) {
    cfEditingGroupId = g.id;
    conditionRows = g.conditions?.rows ? g.conditions.rows.map((r) => ({ ...r })) : [];
    const excDnd = document.getElementById('cf-exclude-dnd');
    if (excDnd) excDnd.checked = g.conditions?.excludeDND ?? true;
    const timeEl = document.getElementById('cf-time-unlimited');
    if (timeEl) { timeEl.checked = true; const dr = document.getElementById('cfb-date-range'); if (dr) dr.style.display = 'none'; }
    resetCfPreview();
    const toSendBtn = document.getElementById('btn-cf-to-send');
    if (toSendBtn) toSendBtn.style.display = 'none';
    const saveBtn = document.getElementById('btn-cf-save-group');
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> 更新條件';
    renderCfRows();
    renderConditionFilterResult();
    openModal('modal-condition-filter');
  }

  function updateGroupConditions() {
    const g = getGroupById(cfEditingGroupId);
    if (!g) return;
    const cond    = readConditionsFromModal();
    const matched = filterByConditions(cond);
    const newIds  = matched.map((m) => m.id);
    const labels  = conditionsToLabels(cond);
    g.conditions = cond;
    g.memberIds  = newIds;
    addGroupHistory(g, `修改條件並重新套用${labels.length ? `（${labels.join('、')}）` : ''}`, '');
    saveGroups();
    cfEditingGroupId = null;
    const saveBtn = document.getElementById('btn-cf-save-group');
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> 存為群組…';
    const toSendBtn = document.getElementById('btn-cf-to-send');
    if (toSendBtn) toSendBtn.style.display = '';
    closeModal('modal-condition-filter');
    renderGroupDetail();
    toast(`條件已更新，共 ${newIds.length} 人`);
  }

  /* ══════════════════════════════════════════════
     GROUPS MODULE
  ══════════════════════════════════════════════ */
  function saveGroups() { saveJson(GROUPS_KEY, groups); }

  let _activeGrpDd = null;
  function openSimpleDropdown(wrapEl, items) {
    if (_activeGrpDd) { _activeGrpDd.remove(); _activeGrpDd = null; }
    const panel = document.createElement('div');
    panel.className = 'grp-dd-panel';
    panel.innerHTML = items.map((item) => {
      if (item === 'sep') return '<div class="grp-dd-sep"></div>';
      return `<div class="grp-dd-item${item.danger ? ' danger' : ''}" data-ddaction="${item.action}">
        <i class="${item.icon}" style="font-size:11px;width:14px;text-align:center;flex-shrink:0;"></i>
        ${esc(item.label)}
      </div>`;
    }).join('');
    wrapEl.appendChild(panel);
    _activeGrpDd = panel;
    panel.querySelectorAll('[data-ddaction]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = items.find((x) => x !== 'sep' && x.action === el.dataset.ddaction);
        panel.remove(); _activeGrpDd = null;
        if (item) item.handler();
      });
    });
    const closeOutside = (e) => {
      if (!wrapEl.contains(e.target)) {
        panel.remove(); _activeGrpDd = null;
        document.removeEventListener('click', closeOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', closeOutside), 0);
  }

  function renderGroupsTab() {
    if (groupsView === 'detail' && activeGroupId) {
      showGroupsDetailView(activeGroupId);
    } else {
      showGroupsListView();
    }
  }

  function showGroupsListView() {
    groupsView = 'list';
    const listView   = document.getElementById('groups-list-view');
    const detailView = document.getElementById('groups-detail-view');
    if (listView)   listView.style.display   = '';
    if (detailView) detailView.style.display = 'none';
    renderGroupList();
  }

  function showGroupsDetailView(gid) {
    const g = getGroupById(gid);
    if (!g) { showGroupsListView(); return; }
    groupsView   = 'detail';
    activeGroupId = gid;
    const listView   = document.getElementById('groups-list-view');
    const detailView = document.getElementById('groups-detail-view');
    if (listView)   listView.style.display   = 'none';
    if (detailView) detailView.style.display = '';
    document.getElementById('group-d-name').textContent = g.name;
    renderGroupConditionsBlock(g);
    renderGroupMemberList(g);
    renderGroupHistory(g);
  }

  function renderGroupList() {
    const container = document.getElementById('group-list-container');
    if (!container) return;
    const q = groupListSearch.toLowerCase();
    const filtered = q ? groups.filter((g) => g.name.toLowerCase().includes(q)) : groups;
    if (!filtered.length) {
      container.innerHTML = `<div class="group-list-empty">${q ? '沒有符合「' + esc(groupListSearch) + '」的群組' : '尚無群組，點選上方「新增群組」開始建立'}</div>`;
      return;
    }
    const totalPages = Math.ceil(filtered.length / GROUPS_PER_PAGE);
    if (groupListPage >= totalPages) groupListPage = totalPages - 1;
    const start = groupListPage * GROUPS_PER_PAGE;
    const pageItems = filtered.slice(start, start + GROUPS_PER_PAGE);
    const rows = pageItems.map((g, i) => {
      const hasCond = !!g.conditions;
      const condLabel = hasCond
        ? '<span class="gli-badge gli-badge--cond"><i class="fa-solid fa-filter"></i> 條件篩選</span>'
        : '<span class="gli-badge gli-badge--manual"><i class="fa-solid fa-pen"></i> 手動管理</span>';
      const lastHist = g.history && g.history.length ? g.history[g.history.length - 1] : null;
      const lastUpdate = lastHist ? esc(lastHist.time.split(' ')[0]) : '—';
      return `<tr class="gl-row" data-group-open="${g.id}">
        <td class="gl-td gl-td--no">${start + i + 1}</td>
        <td class="gl-td gl-td--name">${esc(g.name)}</td>
        <td class="gl-td gl-td--type">${condLabel}</td>
        <td class="gl-td gl-td--date">${esc(g.createdAt)}</td>
        <td class="gl-td gl-td--updated">${lastUpdate}</td>
        <td class="gl-td gl-td--action"><button class="gl-edit-btn">查看</button></td>
      </tr>`;
    }).join('');
    container.innerHTML = `<table class="group-table">
      <thead>
        <tr>
          <th class="gl-th gl-th--no">項次</th>
          <th class="gl-th gl-th--name">群組名稱</th>
          <th class="gl-th gl-th--type">管理方式</th>
          <th class="gl-th gl-th--date">建立日期</th>
          <th class="gl-th gl-th--updated">最後更新</th>
          <th class="gl-th gl-th--action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="tag-pagination">
      <span class="tag-pg-info">第 ${groupListPage + 1} / ${totalPages} 頁，共 ${filtered.length} 筆</span>
      <div class="tag-pg-btns">
        <button class="tag-pg-btn" id="grp-pg-prev" ${groupListPage === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
        <button class="tag-pg-btn" id="grp-pg-next" ${groupListPage >= totalPages - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </div>`;
    container.querySelectorAll('[data-group-open]').forEach((el) =>
      el.addEventListener('click', () => {
        selectedGroupMemberIds.clear();
        groupMemberSearch = '';
        showGroupsDetailView(el.dataset.groupOpen);
      })
    );
    document.getElementById('grp-pg-prev')?.addEventListener('click', () => { groupListPage--; renderGroupList(); });
    document.getElementById('grp-pg-next')?.addEventListener('click', () => { groupListPage++; renderGroupList(); });
  }

  function renderGroupDetail() {
    const g = activeGroupId ? getGroupById(activeGroupId) : null;
    if (!g) return;
    const nameEl = document.getElementById('group-d-name');
    if (nameEl) nameEl.textContent = g.name;
    renderGroupConditionsBlock(g);
    renderGroupMemberList(g);
    renderGroupHistory(g);
  }

  function renderGroupConditionsBlock(g) {
    const block   = document.getElementById('group-conditions-block');
    const badges  = document.getElementById('group-conditions-badges');
    const statEl  = document.getElementById('gcb-member-stat');
    const btnsEl  = document.getElementById('gcb-action-btns');
    if (!block || !badges) return;

    // 成員數量 stat chip
    if (statEl) {
      statEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;background:#eef2ff;color:#4f46e5;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;border:1px solid #c7d2fe;">
        <i class="fa-solid fa-users" style="font-size:10px;"></i>${g.memberIds.length} 人
      </span>`;
    }

    // 條件徽章
    if (g.conditions) {
      const html = badgesHtml(g.conditions);
      badges.innerHTML = html || '<span style="font-size:12px;color:#9ca3af;">（無條件限制）</span>';
    } else {
      badges.innerHTML = '<span style="font-size:12px;color:#9ca3af;"><i class="fa-solid fa-pen-to-square" style="font-size:10px;margin-right:4px;opacity:.5;"></i>此群組為手動建立，尚未設定篩選條件</span>';
    }

    // 動作按鈕
    if (btnsEl) {
      if (g.conditions) {
        btnsEl.innerHTML = `
          <button class="btn-reapply" id="gcb-btn-reapply" style="font-size:11px;"><i class="fa-solid fa-rotate"></i> 重新套用</button>
          <button class="btn-s" id="gcb-btn-edit-cond" style="font-size:11px;padding:4px 11px;"><i class="fa-solid fa-pen"></i> 修改條件</button>`;
        btnsEl.querySelector('#gcb-btn-reapply').addEventListener('click', reapplyGroupConditions);
        btnsEl.querySelector('#gcb-btn-edit-cond').addEventListener('click', () => openEditConditions(g));
      } else {
        btnsEl.innerHTML = `<button class="btn-s" id="gcb-btn-set-cond" style="font-size:11px;padding:4px 11px;"><i class="fa-solid fa-plus"></i> 設定條件</button>`;
        btnsEl.querySelector('#gcb-btn-set-cond').addEventListener('click', () => openEditConditions(g));
      }
    }
  }


  function renderGroupMemberList(g) {
    const list = document.getElementById('group-member-list');
    if (!list) return;
    const q = (document.getElementById('group-member-search')?.value || '').toLowerCase();
    const members = g.memberIds.map(getMemberById).filter(Boolean).filter((m) =>
      !q || m.name.toLowerCase().includes(q) || m.mobile.includes(q)
    );
    if (!members.length) {
      list.innerHTML = `<div style="padding:24px;text-align:center;color:#c0c4cc;font-size:13px;">${q ? '無符合條件的成員' : '尚無成員，點選「新增成員」加入指定對象'}</div>`;
      return;
    }
    list.innerHTML = members.map((m) => {
      const tagHtml = getUserTagIds(m.id).map((tid) => {
        const t = getTagById(tid);
        return t ? `<span class="gm-tag-sm" style="background:${hexRgba(t.color,0.09)};color:${t.color};border:1px solid ${hexRgba(t.color,0.22)};">${esc(t.name)}</span>` : '';
      }).join('');
      const idBadges = m.identities.slice(0, 2).map(identityBadge).join('');
      return `<div class="gm-cpt" style="grid-template-columns:26px 138px 104px 56px 76px 1fr auto;" data-gmcpt="${m.id}">
        <div class="m-avatar" style="width:26px;height:26px;font-size:11px;flex-shrink:0;">${esc(m.name.charAt(0))}</div>
        <div class="gm-c-info">
          <div class="gm-c-name">${esc(m.name)}</div>
          <div class="gm-c-id">${m.id}</div>
        </div>
        <span class="gm-c-phone">${m.mobile}</span>
        <div class="gm-c-line">${m.line ? '<span class="gm-line-yes"><i class="fa-brands fa-line"></i> 已加</span>' : '<span class="gm-line-no">—</span>'}</div>
        <div class="gm-c-badges">${idBadges}</div>
        <div class="gm-c-tags">${tagHtml}</div>
        <button class="gm-rm-btn" data-gmrm="${m.id}" title="移除" style="background:none;border:none;cursor:pointer;color:#d1d5db;padding:2px 4px;font-size:13px;line-height:1;border-radius:4px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#d1d5db'"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-gmrm]').forEach((btn) =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); openRemoveNote(btn.dataset.gmrm); })
    );
  }

  function openAddToGroupModal() {
    const g = getGroupById(activeGroupId);
    if (!g) return;
    grpAddSelected = new Set();
    const searchEl = document.getElementById('atg-search');
    const noteEl   = document.getElementById('atg-note');
    if (searchEl) searchEl.value = '';
    if (noteEl)   noteEl.value   = '';
    document.getElementById('atg-sel-count').textContent = '';
    renderAtgList(g);
    openModal('modal-add-to-group');
    setTimeout(() => searchEl?.focus(), 100);
  }

  function renderAtgList(g) {
    const q        = (document.getElementById('atg-search')?.value || '').toLowerCase();
    const existing = new Set(g.memberIds);
    const candidates = MEMBERS.filter((m) => {
      if (existing.has(m.id)) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.mobile.replace(/-/g, '').includes(q.replace(/-/g, ''))) return false;
      return true;
    });
    const list = document.getElementById('atg-member-list');
    if (!list) return;
    if (!candidates.length) {
      list.innerHTML = `<div style="padding:28px;text-align:center;color:#c0c4cc;font-size:13px;">${q ? '無符合條件的人員' : '所有人員皆已在群組中'}</div>`;
      return;
    }
    list.innerHTML = candidates.map((m) => {
      const sel = grpAddSelected.has(m.id);
      return `<div class="pick-item-m${sel ? ' is-picked' : ''}" data-atgpick="${m.id}">
        <input class="pick-cb-m" type="checkbox" ${sel ? 'checked' : ''} data-atgpick="${m.id}" />
        <div class="pick-m-info">
          <div class="pick-m-main">
            <span class="pick-m-name">${esc(m.name)}</span>
            <span class="pick-m-id">${m.id}</span>
          </div>
          <div class="pick-m-meta">
            <span class="pick-m-phone">${m.mobile}</span>
            ${m.identities.map((i) => identityBadge(i)).join('')}
            ${m.line ? '<span class="gm-line-yes" style="font-size:10px;"><i class="fa-brands fa-line"></i> LINE</span>' : ''}
          </div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-atgpick]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.atgpick;
        if (grpAddSelected.has(id)) grpAddSelected.delete(id); else grpAddSelected.add(id);
        const g2 = getGroupById(activeGroupId);
        if (g2) renderAtgList(g2);
        document.getElementById('atg-sel-count').textContent = grpAddSelected.size ? `已選 ${grpAddSelected.size} 人` : '';
      });
    });
    document.getElementById('atg-sel-count').textContent = grpAddSelected.size ? `已選 ${grpAddSelected.size} 人` : '';
  }

  function confirmAddToGroup() {
    const g = getGroupById(activeGroupId);
    if (!g) return;
    if (!grpAddSelected.size) { toast('請先選擇要加入的成員', '#f59e0b'); return; }
    const note = document.getElementById('atg-note')?.value.trim() || '';
    let added = 0;
    grpAddSelected.forEach((id) => {
      if (!g.memberIds.includes(id)) { g.memberIds.push(id); added++; }
    });
    addGroupHistory(g, `手動新增 ${added} 人`, note);
    saveGroups();
    closeModal('modal-add-to-group');
    renderGroupConditionsBlock(g);
    renderGroupMemberList(g);
    renderGroupHistory(g);
    renderGroupList();
    toast(`已新增 ${added} 人至群組`);
  }

  function renderGroupHistory(g) {
    const list = document.getElementById('group-history-list');
    if (!list) return;
    if (!g.history || !g.history.length) {
      list.innerHTML = '<div class="group-empty-hist">尚無歷程紀錄</div>';
      return;
    }
    list.innerHTML = [...g.history].reverse().map((h, i, arr) => {
      const parts = (h.time || '').split(' ');
      const datePart = parts[0] || '';
      const timePart = parts.slice(1).join(' ');
      return `<div class="history-item">
        <div class="hi-dot-col">
          <div class="hi-dot"></div>
          ${i < arr.length - 1 ? '<div class="hi-line"></div>' : ''}
        </div>
        <div class="hi-content">
          <div class="hi-date-actor">
            <span class="hi-date">${esc(datePart)}</span>
            <span class="hi-time-txt">${esc(timePart)}</span>
            <span class="hi-actor-sep">·</span>
            <span class="hi-actor-name">${esc(h.actor)}</span>
          </div>
          <div class="hi-action-text">${esc(h.action)}</div>
          ${h.note ? `<div class="hi-note-block">"${esc(h.note)}"</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function addGroupHistory(g, action, note = '') {
    if (!g.history) g.history = [];
    g.history.push({ actor: 'Admin', time: nowStr(), action, note });
  }

  function openRemoveNote(memberId) {
    const m = getMemberById(memberId);
    if (!m) return;
    pendingRemoveMemberId = memberId;
    document.getElementById('remove-note-desc').textContent = `確認移除成員「${m.name}」？`;
    document.getElementById('remove-note-input').value = '';
    openModal('modal-remove-note');
  }

  function confirmRemoveMember() {
    const uid = pendingRemoveMemberId;
    const g   = getGroupById(activeGroupId);
    if (!g || !uid) return;
    const m    = getMemberById(uid);
    const note = document.getElementById('remove-note-input')?.value.trim() || '';
    g.memberIds = g.memberIds.filter((id) => id !== uid);
    addGroupHistory(g, `移除成員：${m ? m.name : uid}`, note);
    saveGroups();
    closeModal('modal-remove-note');
    renderGroupConditionsBlock(g);
    renderGroupMemberList(g);
    renderGroupHistory(g);
    renderGroupList();
    toast('成員已移除', '#ef4444');
  }

  function deleteGroup(gid) {
    const g = getGroupById(gid);
    if (!g) return;
    if (!confirm(`確認刪除群組「${g.name}」？此操作無法復原。`)) return;
    groups = groups.filter((x) => x.id !== gid);
    if (activeGroupId === gid) activeGroupId = null;
    saveGroups();
    showGroupsListView();
    toast('群組已刪除', '#ef4444');
  }

  function copyGroup(gid) {
    const g = getGroupById(gid);
    if (!g) return;
    const newGroup = {
      id:       'grp-' + Date.now(),
      name:     g.name + ' (複本)',
      memberIds:[...g.memberIds],
      createdAt: new Date().toISOString().slice(0,10),
      history:  [{ actor:'Admin', time:nowStr(), action:`從「${g.name}」複製`, note:'' }],
    };
    groups.push(newGroup);
    saveGroups();
    activeGroupId = newGroup.id;
    showGroupsDetailView(newGroup.id);
    toast('群組已複製');
  }


  function openGroupSync() {
    syncTagsSelected = new Set();
    const list = document.getElementById('sync-tags-list');
    list.innerHTML = tags.map((t) => {
      const cnt = MEMBERS.filter((m) => getUserTagIds(m.id).includes(t.id)).length;
      return `<div class="pick-item" data-stpick="${t.id}">
        <input class="pick-cb" type="checkbox" data-stpick="${t.id}" />
        <div class="pick-info">
          <div class="pick-name"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${t.color};margin-right:6px;"></span>${esc(t.name)}</div>
          <div class="pick-meta">${cnt} 人</div>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-stpick]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.stpick;
        if (syncTagsSelected.has(id)) syncTagsSelected.delete(id); else syncTagsSelected.add(id);
        el.querySelector('input').checked = syncTagsSelected.has(id);
        el.classList.toggle('is-picked', syncTagsSelected.has(id));
      });
    });
    document.getElementById('sync-note').value = '';
    openModal('modal-group-sync');
  }

  function confirmGroupSync() {
    const g = getGroupById(activeGroupId);
    if (!g || !syncTagsSelected.size) { toast('請先選擇標籤', '#f59e0b'); return; }
    const note  = document.getElementById('sync-note')?.value.trim() || '';
    let added   = 0;
    const tagNames = [];
    syncTagsSelected.forEach((tid) => {
      const t = getTagById(tid);
      if (t) tagNames.push(t.name);
      MEMBERS.forEach((m) => {
        if (getUserTagIds(m.id).includes(tid) && !g.memberIds.includes(m.id)) {
          g.memberIds.push(m.id); added++;
        }
      });
    });
    addGroupHistory(g, `從標籤「${tagNames.join('、')}」同步，新增 ${added} 人`, note);
    saveGroups();
    closeModal('modal-group-sync');
    renderGroupConditionsBlock(g);
    renderGroupMemberList(g);
    renderGroupHistory(g);
    renderGroupList();
    toast(`同步完成，新增 ${added} 人`);
  }

  /* ══════════════════════════════════════════════
     TAGS MODULE
  ══════════════════════════════════════════════ */
  function saveTags() { saveJson(TAGS_KEY, tags); }
  function saveUserTags() { saveJson(UTAGS_KEY, userTags); }
  function addUserTag(uid, tagId) {
    if (!userTags[uid]) userTags[uid] = [];
    if (!userTags[uid].includes(tagId)) { userTags[uid].push(tagId); saveUserTags(); }
  }
  function removeUserTag(uid, tagId) {
    if (!userTags[uid]) return;
    userTags[uid] = userTags[uid].filter((id) => id !== tagId);
    if (!userTags[uid].length) delete userTags[uid];
    saveUserTags();
  }
  function getTagUserCount(tagId) { return Object.values(userTags).filter((ids) => ids.includes(tagId)).length; }

  /* ── Tag searchable combobox ─────────────────── */
  let _tcbCloseHandler = null;

  function renderTagCombobox(container, currentTagId, onChange) {
    if (!container) return;
    const t = currentTagId ? getTagById(currentTagId) : null;
    container.innerHTML = `
      <div class="tcb-wrap">
        <button class="tcb-btn" type="button">
          <span class="tcb-dot" style="background:${t ? t.color : '#cbd5e1'};"></span>
          <span class="tcb-label">${t ? esc(t.name) : '全部標籤'}</span>
          ${currentTagId ? `<span class="tcb-clear" data-clear="1" title="清除篩選">×</span>` : ''}
          <i class="fa-solid fa-chevron-down" style="font-size:9px;color:#9ca3af;margin-left:auto;flex-shrink:0;"></i>
        </button>
      </div>`;
    const wrap = container.querySelector('.tcb-wrap');
    const btn  = container.querySelector('.tcb-btn');
    const clearBtn = container.querySelector('[data-clear]');
    clearBtn?.addEventListener('click', (e) => { e.stopPropagation(); onChange(''); });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTagCbDropdown(wrap, currentTagId, onChange);
    });
  }

  function openTagCbDropdown(wrap, currentTagId, onChange) {
    // Close any existing
    if (_tcbCloseHandler) { document.removeEventListener('click', _tcbCloseHandler); _tcbCloseHandler = null; }
    wrap.querySelector('.tcb-dropdown')?.remove();

    const dd = document.createElement('div');
    dd.className = 'tcb-dropdown';
    dd.innerHTML = `
      <div class="tcb-search-row">
        <i class="fa-solid fa-magnifying-glass" style="color:#c0c4cc;font-size:11px;"></i>
        <input class="tcb-search-input" placeholder="搜尋標籤名稱…" autocomplete="off" />
      </div>
      <div class="tcb-list"></div>`;
    wrap.appendChild(dd);

    const renderList = (q = '') => {
      const all = [{ id:'', name:'全部標籤', color:null }, ...tags];
      const filtered = q ? all.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())) : all;
      const listEl = dd.querySelector('.tcb-list');
      if (!filtered.length) { listEl.innerHTML = '<div class="tcb-empty">無符合標籤</div>'; return; }
      listEl.innerHTML = filtered.map((t) => {
        const cnt = t.id ? MEMBERS.filter((m) => getUserTagIds(m.id).includes(t.id)).length : MEMBERS.length;
        const active = t.id === currentTagId;
        return `<div class="tcb-item${active ? ' active' : ''}" data-tcbv="${t.id}">
          <span class="tcb-dot" style="background:${t.color || '#cbd5e1'};"></span>
          <span class="tcb-item-name">${esc(t.name)}</span>
          <span class="tcb-item-cnt">${cnt} 人</span>
          ${active ? '<i class="fa-solid fa-check" style="font-size:10px;color:#0d9488;"></i>' : ''}
        </div>`;
      }).join('');
      listEl.querySelectorAll('.tcb-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          onChange(item.dataset.tcbv);
          dd.remove();
          if (_tcbCloseHandler) { document.removeEventListener('click', _tcbCloseHandler); _tcbCloseHandler = null; }
        });
      });
    };

    renderList();
    const searchInput = dd.querySelector('.tcb-search-input');
    searchInput?.addEventListener('input', (e) => renderList(e.target.value));
    requestAnimationFrame(() => searchInput?.focus());

    _tcbCloseHandler = (e) => {
      if (!wrap.contains(e.target)) {
        dd.remove();
        document.removeEventListener('click', _tcbCloseHandler);
        _tcbCloseHandler = null;
      }
    };
    requestAnimationFrame(() => document.addEventListener('click', _tcbCloseHandler));
  }

  function renderTagsTab() { renderTagList(); }

  function renderTagList() {
    const c = document.getElementById('tag-list-container');
    if (!c) return;
    if (!tags.length) { c.innerHTML = '<div class="tag-empty">尚無標籤，請點「新增標籤」建立</div>'; return; }
    const totalPages = Math.ceil(tags.length / TAGS_PER_PAGE);
    if (tagPage >= totalPages) tagPage = totalPages - 1;
    const start    = tagPage * TAGS_PER_PAGE;
    const pageTags = tags.slice(start, start + TAGS_PER_PAGE);
    c.innerHTML = `
      <div class="tag-chips-wrap">
        ${pageTags.map((t) => `
          <div class="tag-chip-card">
            <span class="tag-chip-name">${esc(t.name)}</span>
            <div class="tag-chip-acts">
              <button class="tag-act-btn" data-action="edit-tag" data-id="${t.id}" title="編輯"><i class="fa-solid fa-pen"></i></button>
              <button class="tag-act-btn del" data-action="delete-tag" data-id="${t.id}" title="刪除"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`).join('')}
      </div>
      <div class="tag-pagination">
        <span class="tag-pg-info">第 ${tagPage + 1} / ${totalPages} 頁，共 ${tags.length} 筆</span>
        <div class="tag-pg-btns">
          <button class="tag-pg-btn" id="tag-pg-prev" ${tagPage === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
          <button class="tag-pg-btn" id="tag-pg-next" ${tagPage >= totalPages - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>`;
    c.querySelectorAll('[data-action="edit-tag"]').forEach((b) =>
      b.addEventListener('click', () => openTagEditModal(b.dataset.id))
    );
    c.querySelectorAll('[data-action="delete-tag"]').forEach((b) =>
      b.addEventListener('click', () => deleteTag(b.dataset.id))
    );
    document.getElementById('tag-pg-prev')?.addEventListener('click', () => { tagPage--; renderTagList(); });
    document.getElementById('tag-pg-next')?.addEventListener('click', () => { tagPage++; renderTagList(); });
  }

  /* Tag dropdown */
  function openTagDropdown(uid, anchorBtn) {
    closeTagDropdown();
    if (!tags.length) { toast('請先建立標籤', '#f59e0b'); return; }
    const existing = getUserTagIds(uid);
    const dd = document.createElement('div');
    dd.className = 'tag-dropdown';
    dd.innerHTML = tags.map((t) => {
      const assigned = existing.includes(t.id);
      return `<div class="tag-dd-item${assigned?' assigned':''}" data-tagid="${t.id}" data-uid="${uid}">
        <span style="width:8px;height:8px;border-radius:50%;background:${t.color};display:inline-block;flex-shrink:0;"></span>
        <span style="flex:1;">${esc(t.name)}</span>
        ${assigned ? '<span style="font-size:10px;color:#10b981;">✓</span>' : ''}
      </div>`;
    }).join('');
    const anchor = anchorBtn.closest('.assign-tags,.edit-tag-chips') || anchorBtn.parentElement;
    anchor.appendChild(dd);
    activeTagDropdown = dd;
    dd.addEventListener('click', (e) => {
      const item = e.target.closest('.tag-dd-item');
      if (!item || item.classList.contains('assigned')) return;
      addUserTag(item.dataset.uid, item.dataset.tagid);
      closeTagDropdown();
      renderTagList();
      renderMemberTagFilterRow(); renderMemberTable();
      const editId = document.getElementById('member-edit-id')?.value;
      if (editId === item.dataset.uid) renderMemberEditTags(editId);
    });
    requestAnimationFrame(() =>
      document.addEventListener('click', closeTagDropdownOutside, { once: true })
    );
  }
  function closeTagDropdown() { if (activeTagDropdown) { activeTagDropdown.remove(); activeTagDropdown = null; } }
  function closeTagDropdownOutside() { closeTagDropdown(); }

  /* Tag CRUD */
  function openTagEditModal(tagId) {
    editingTagId = tagId || null;
    document.getElementById('tag-edit-modal-label').textContent = tagId ? '編輯標籤' : '新增標籤';
    const t = tagId ? tags.find((x) => x.id === tagId) : null;
    document.getElementById('tag-edit-name').value = t ? t.name : '';
    document.getElementById('tag-edit-name-err').style.display = 'none';
    openModal('modal-tag-edit');
    document.getElementById('tag-edit-name').focus();
  }
  function saveTagEdit() {
    const nameInput = document.getElementById('tag-edit-name');
    const errEl     = document.getElementById('tag-edit-name-err');
    const name      = nameInput.value.trim();
    if (!name) { errEl.textContent = '請輸入標籤名稱'; errEl.style.display = ''; nameInput.focus(); return; }
    if (tags.some((x) => x.name === name && x.id !== editingTagId)) {
      errEl.textContent = '標籤名稱已存在'; errEl.style.display = ''; nameInput.focus(); return;
    }
    errEl.style.display = 'none';
    if (editingTagId) {
      const t = tags.find((x) => x.id === editingTagId);
      if (t) { t.name = name; }
    } else {
      const color = TAG_COLORS[tags.length % TAG_COLORS.length];
      tags.push({ id: 'tag-' + Date.now(), name, color });
    }
    saveTags();
    closeModal('modal-tag-edit');
    renderTagList();
    renderMemberTagFilterRow(); renderMemberTable();
    toast(editingTagId ? '標籤已更新' : '標籤已建立');
  }
  function deleteTag(tagId) {
    const t = tags.find((x) => x.id === tagId);
    if (!t) return;
    const count = getTagUserCount(tagId);
    if (!confirm(`確認刪除標籤「${t.name}」？${count ? `\n目前有 ${count} 人持有此標籤，刪除後將一併移除。` : ''}`)) return;
    tags = tags.filter((x) => x.id !== tagId);
    for (const uid of Object.keys(userTags)) {
      userTags[uid] = userTags[uid].filter((id) => id !== tagId);
      if (!userTags[uid].length) delete userTags[uid];
    }
    memberTagFilters = memberTagFilters.filter((x) => x !== tagId);
    saveTags(); saveUserTags();
    renderTagList();
    renderMemberTagFilterRow(); renderMemberTable();
    toast('標籤已刪除', '#ef4444');
  }

  /* ══════════════════════════════════════════════
     SETTINGS MODULE
  ══════════════════════════════════════════════ */
  function renderSettingsCards() {
    const c   = document.getElementById('tpl-cards-container');
    const tpls = loadTemplates();
    c.innerHTML = tpls.map((t) => `
      <div class="tpl-card" id="card-${t.id}">
        <div class="tpl-card-head">
          <div class="tpl-icon ${t.iconCls}"><i class="${t.icon}"></i></div>
          <div>
            <div class="tpl-card-title">${esc(t.name)}</div>
            <div class="tpl-trigger">自動觸發條件：<span class="tpl-trigger-code">${esc(t.triggerLabel)}</span></div>
          </div>
        </div>
        <div class="tpl-body">
          <div class="tpl-ch-tabs">
            <button class="tpl-ch-tab active" data-tpl="${t.id}" data-tplch="sms"><i class="fa-solid fa-comment-sms"></i> SMS</button>
            <button class="tpl-ch-tab" data-tpl="${t.id}" data-tplch="line"><i class="fa-brands fa-line"></i> LINE</button>
          </div>
          <!-- SMS -->
          <div id="wrap-sms-${t.id}">
            <div class="tpl-var-row">
              <div class="tpl-var-label">可用變數（點擊插入）：</div>
              <div class="var-chips">
                ${['{姓名}','{URL}','{效期}','{案號}','{筆數}','{提領URL}','{紀錄URL}','{MGMURL}'].map((v) =>
                  `<span class="var-chip" data-tplid="${t.id}" data-v="${v}" data-vch="sms">${v}</span>`
                ).join('')}
              </div>
            </div>
            <textarea class="tpl-textarea" id="ta-sms-${t.id}">${esc(t.sms)}</textarea>
            <div class="tpl-save-row">
              <span class="tpl-char-info" id="ci-sms-${t.id}"></span>
              <button class="btn-tpl-save" data-saveid="${t.id}"><i class="fa-solid fa-floppy-disk"></i> 儲存此母版</button>
            </div>
          </div>
          <!-- LINE -->
          <div id="wrap-line-${t.id}" style="display:none;">
            <div class="tpl-line-types">
              <button class="tpl-lt-btn${t.lineType==='text'?' active':''}" data-tpllt="${t.id}" data-lt="text">文字訊息</button>
              <button class="tpl-lt-btn${t.lineType==='image'?' active':''}" data-tpllt="${t.id}" data-lt="image">影像卡片</button>
              // <button class="tpl-lt-btn${t.lineType==='location'?' active':''}" data-tpllt="${t.id}" data-lt="location">地點卡片</button>
            </div>
            <div id="wrap-line-text-${t.id}" style="${t.lineType!=='text'?'display:none;':''}">
              <div class="tpl-var-row">
                <div class="tpl-var-label">可用變數：</div>
                <div class="var-chips">
                  ${['{姓名}','{URL}','{效期}','{提領URL}','{紀錄URL}','{MGMURL}'].map((v) =>
                    `<span class="var-chip" data-tplid="${t.id}" data-v="${v}" data-vch="lineText">${v}</span>`
                  ).join('')}
                </div>
              </div>
              <textarea class="tpl-textarea" id="ta-linetext-${t.id}">${esc(t.lineText)}</textarea>
            </div>
            <div id="wrap-line-image-${t.id}" style="${t.lineType!=='image'?'display:none;':''}">
              <div class="card-fields">
                <div class="cf-row"><label class="cf-label">圖片網址</label><input class="cf-input" id="ta-li-imgurl-${t.id}" value="${esc(t.lineImageCard?.imageUrl||'')}" /></div>
                <div class="cf-row"><label class="cf-label">標題</label><input class="cf-input" id="ta-li-title-${t.id}" value="${esc(t.lineImageCard?.title||'')}" maxlength="30" /></div>
                <div class="cf-row"><label class="cf-label">說明文字</label><textarea class="cf-textarea" id="ta-li-body-${t.id}" maxlength="60">${esc(t.lineImageCard?.body||'')}</textarea></div>
                <div class="cf-2col">
                  <div class="cf-row"><label class="cf-label">按鈕文字</label><input class="cf-input" id="ta-li-btnlabel-${t.id}" value="${esc(t.lineImageCard?.buttonLabel||'')}" maxlength="20" /></div>
                  <div class="cf-row"><label class="cf-label">按鈕連結</label><input class="cf-input" id="ta-li-btnurl-${t.id}" value="${esc(t.lineImageCard?.buttonUrl||'')}" /></div>
                </div>
              </div>
            </div>
            <div id="wrap-line-location-${t.id}" style="${t.lineType!=='location'?'display:none;':''}">
              <div class="card-fields">
                <div class="cf-row"><label class="cf-label">地點名稱</label><input class="cf-input" id="ta-ll-name-${t.id}" value="${esc(t.lineLocation?.name||'')}" maxlength="30" /></div>
                <div class="cf-row"><label class="cf-label">地址</label><input class="cf-input" id="ta-ll-addr-${t.id}" value="${esc(t.lineLocation?.address||'')}" maxlength="60" /></div>
                <div class="cf-2col">
                  <div class="cf-row"><label class="cf-label">緯度</label><input class="cf-input" id="ta-ll-lat-${t.id}" value="${esc(t.lineLocation?.lat||'')}" /></div>
                  <div class="cf-row"><label class="cf-label">經度</label><input class="cf-input" id="ta-ll-lng-${t.id}" value="${esc(t.lineLocation?.lng||'')}" /></div>
                </div>
              </div>
            </div>
            <div class="tpl-save-row">
              <span class="tpl-char-info" id="ci-line-${t.id}"></span>
              <button class="btn-tpl-save" data-saveid="${t.id}"><i class="fa-solid fa-floppy-disk"></i> 儲存此母版</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // ch tabs
    c.querySelectorAll('.tpl-ch-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId = btn.dataset.tpl, ch = btn.dataset.tplch;
        const card  = document.getElementById('card-' + tplId);
        card.querySelectorAll('.tpl-ch-tab').forEach((b) => b.classList.toggle('active', b.dataset.tplch === ch));
        document.getElementById('wrap-sms-'  + tplId).style.display = ch === 'sms'  ? '' : 'none';
        document.getElementById('wrap-line-' + tplId).style.display = ch === 'line' ? '' : 'none';
        updateTplCharInfo(tplId, ch === 'sms' ? 'sms' : 'line');
      });
    });
    // line type tabs
    c.querySelectorAll('[data-tpllt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId = btn.dataset.tpllt, lt = btn.dataset.lt;
        const card  = document.getElementById('card-' + tplId);
        card.querySelectorAll('[data-tpllt]').forEach((b) => b.classList.toggle('active', b.dataset.lt === lt));
        ['text','image','location'].forEach((x) => {
          const w = document.getElementById(`wrap-line-${x}-${tplId}`);
          if (w) w.style.display = x === lt ? '' : 'none';
        });
      });
    });
    // var chips
    c.querySelectorAll('.var-chip[data-tplid]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const tplId = chip.dataset.tplid;
        const ch    = chip.dataset.vch;
        const ta    = document.getElementById(`ta-${ch === 'sms' ? 'sms' : 'linetext'}-${tplId}`);
        if (ta) insertAtCursor(ta, chip.dataset.v);
        updateTplCharInfo(tplId, ch === 'sms' ? 'sms' : 'line');
      });
    });
    // textarea input → char count
    tpls.forEach((t) => {
      ['sms', 'linetext'].forEach((pfx) => {
        const ta = document.getElementById(`ta-${pfx}-${t.id}`);
        if (ta) ta.addEventListener('input', () => updateTplCharInfo(t.id, pfx === 'sms' ? 'sms' : 'line'));
      });
      updateTplCharInfo(t.id, 'sms');
    });
    // save
    c.querySelectorAll('[data-saveid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId  = btn.dataset.saveid;
        const card   = document.getElementById('card-' + tplId);
        const activeLt = card.querySelector('[data-tpllt].active')?.dataset.lt || 'text';
        saveTplField(tplId, 'sms', document.getElementById('ta-sms-' + tplId)?.value || '');
        saveTplField(tplId, 'lineType', activeLt);
        saveTplField(tplId, 'lineText', document.getElementById('ta-linetext-' + tplId)?.value || '');
        saveTplField(tplId, 'lineImageCard', {
          imageUrl:    document.getElementById('ta-li-imgurl-'   + tplId)?.value || '',
          title:       document.getElementById('ta-li-title-'    + tplId)?.value || '',
          body:        document.getElementById('ta-li-body-'     + tplId)?.value || '',
          buttonLabel: document.getElementById('ta-li-btnlabel-' + tplId)?.value || '',
          buttonUrl:   document.getElementById('ta-li-btnurl-'   + tplId)?.value || '',
        });
        saveTplField(tplId, 'lineLocation', {
          name:    document.getElementById('ta-ll-name-' + tplId)?.value || '',
          address: document.getElementById('ta-ll-addr-' + tplId)?.value || '',
          lat:     document.getElementById('ta-ll-lat-'  + tplId)?.value || '',
          lng:     document.getElementById('ta-ll-lng-'  + tplId)?.value || '',
        });
        const tInMem = templates.find((x) => x.id === tplId);
        if (tInMem) {
          tInMem.sms     = document.getElementById('ta-sms-' + tplId)?.value || '';
          tInMem.lineText= document.getElementById('ta-linetext-' + tplId)?.value || '';
          tInMem.lineType= activeLt;
        }
        toast('母版已儲存');
      });
    });
  }
  function updateTplCharInfo(tplId, ch) {
    const ta  = document.getElementById(`ta-${ch === 'sms' ? 'sms' : 'linetext'}-${tplId}`);
    const el  = document.getElementById(`ci-${ch}-${tplId}`);
    if (!ta || !el) return;
    const len   = (ta.value || '').length;
    const limit = ch === 'sms' ? 60 : 50;
    el.className = 'tpl-char-info' + (len > limit ? ' warn' : '');
    el.textContent = `${len} 字${ch === 'sms' ? '（建議 ≤ 60）' : '（建議 ≤ 50）'}`;
  }

  /* ══════════════════════════════════════════════
     SETTINGS V2 — LIST + DETAIL PAGE
  ══════════════════════════════════════════════ */

  function loadAllSysTemplates() {
    const saved = loadJson(TPL_KEY, {});
    const all   = [...DEFAULT_TEMPLATES, ...SYS_EXTRA_TEMPLATES];
    return all.map((t) => ({
      ...t,
      sms:           saved[t.id + '_sms']           ?? t.sms,
      lineType:      t.lineType,
      lineText:      saved[t.id + '_lineText']      ?? t.lineText,
      lineImageCard: saved[t.id + '_lineImageCard'] ?? t.lineImageCard,
      lineLocation:  saved[t.id + '_lineLocation']  ?? t.lineLocation,
    }));
  }

  function loadCustomEvents()        { return loadJson(CUSTOM_EVENTS_KEY, []); }
  function saveCustomEventsData(arr) { saveJson(CUSTOM_EVENTS_KEY, arr); }

  function buildTplPicker() {
    const sel = document.getElementById('tpl-picker');
    if (!sel) return;
    const customs = loadCustomEvents();
    let html = '<option value="">── 自訂訊息（不套用母版）──</option>';
    html += '<optgroup label="系統通知事件（N01–N13）">';
    SYSTEM_NOTIFY_EVENTS.forEach((ev) => {
      const chLabel = ev.channels.join(' / ');
      html += `<option value="${ev.tplId}">${esc(ev.id)} | ${esc(ev.name)}（${chLabel}）</option>`;
    });
    html += '</optgroup>';
    if (customs.length) {
      html += '<optgroup label="自訂通知">';
      customs.forEach((ev) => {
        const chLabel = ev.channels && ev.channels.length ? `（${ev.channels.join(' / ')}）` : '';
        html += `<option value="${ev.id}">${esc(ev.name)}${chLabel}</option>`;
      });
      html += '</optgroup>';
    }
    sel.innerHTML = html;
  }

  let nsActiveId     = null;
  let pendingDeleteId = null;
  let editingCustomId = null;

  function nsChannelBadge(ch) {
    if (ch === 'LINE') return `<span class="ns-ch-badge ns-ch-line">LINE</span>`;
    if (ch === 'SMS')  return `<span class="ns-ch-badge ns-ch-sms">SMS</span>`;
    return '';
  }

  function nsTriggerBadge(method) {
    const map = { '系統自動':'auto','排程掃描':'scheduled','即時觸發':'realtime','日排程':'daily','月排程':'monthly','手動':'manual' };
    const cls = map[method] || 'manual';
    return `<span class="ns-trigger-badge ns-trigger-${cls}">${esc(method)}</span>`;
  }

  function renderSettingsPage() {
    renderNsList();
    bindNsPageEvents();
  }

  function renderNsList() {
    const listEl   = document.getElementById('ns-list-view');
    const detailEl = document.getElementById('ns-detail-view');
    // On standalone edit page, navigate back to list
    if (!listEl) { location.href = 'admin-notify-settings.html'; return; }
    if (listEl)   listEl.style.display   = '';
    if (detailEl) detailEl.style.display = 'none';
    renderNsSystemList();
    renderNsCustomList();
  }

  function renderNsSystemList() {
    const el = document.getElementById('ns-system-list');
    if (!el) return;
    const header = `
      <div class="ns-list-hd">
        <div class="ns-list-hd-cell">事件 ID</div>
        <div class="ns-list-hd-cell">事件名稱</div>
        <div class="ns-list-hd-cell">推薦對象</div>
        <div class="ns-list-hd-cell">管道</div>
        <div class="ns-list-hd-cell">觸發方式</div>
        <div class="ns-list-hd-cell">觸發時機</div>
        <div class="ns-list-hd-cell ns-list-hd-cell--right">操作</div>
      </div>`;
    el.innerHTML = header + SYSTEM_NOTIFY_EVENTS.map((ev) => `
      <div class="ns-event-row" data-ns-id="${ev.id}">
        <div class="ns-id-chip ns-id-sys">${esc(ev.id)}</div>
        <div class="ns-event-info">
          <div class="ns-event-name">${esc(ev.name)}</div>
        </div>
        <div class="ns-recipients">${esc(ev.recipients)}</div>
        <div class="ns-channels">${ev.channels.map(nsChannelBadge).join('')}</div>
        <div class="ns-trigger-col">${nsTriggerBadge(ev.triggerMethod)}</div>
        <div class="ns-timing">${esc(ev.triggerTiming)}</div>
        <div class="ns-actions">
          <button class="btn-s ns-btn-edit" data-ns-edit="${ev.id}">
             編輯
          </button>
        </div>
      </div>`).join('');

    el.querySelectorAll('[data-ns-edit]').forEach((btn) =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); openNsDetail(btn.dataset.nsEdit); })
    );
    el.querySelectorAll('.ns-event-row').forEach((row) =>
      row.addEventListener('click', (e) => {
        if (e.target.closest('.ns-actions')) return;
        openNsDetail(row.dataset.nsId);
      })
    );
  }

  function renderNsCustomList() {
    const customs = loadCustomEvents();
    const countEl = document.getElementById('ns-custom-count');
    if (countEl) countEl.textContent = `${customs.length} 項`;
    const el = document.getElementById('ns-custom-list');
    if (!el) return;

    if (!customs.length) {
      el.innerHTML = `<div class="ns-empty">
        <i class="fa-solid fa-inbox" style="font-size:28px;opacity:.25;display:block;margin-bottom:8px;"></i>
        尚無自訂通知。點擊右上角「新增自訂通知」建立。
      </div>`;
      return;
    }

    const header = `
      <div class="ns-list-hd">
        <div class="ns-list-hd-cell">編號</div>
        <div class="ns-list-hd-cell">事件名稱</div>
        <div class="ns-list-hd-cell">管道</div>
        <div class="ns-list-hd-cell">派送方式</div>
        <div class="ns-list-hd-cell">LINE 格式</div>
        <div class="ns-list-hd-cell ns-list-hd-cell--right">操作</div>
      </div>`;
    el.innerHTML = `<div class="ns-list-wrap">${header}${customs.map((ev, idx) => {
      const ltLabel = ev.lineType === 'image' ? '圖片卡片' : '純文字';
      return `
      <div class="ns-event-row ns-event-row--custom" data-ns-id="${ev.id}">
        <div class="ns-id-chip ns-id-custom">C${idx + 1}</div>
        <div class="ns-event-info">
          <div class="ns-event-name">${esc(ev.name)}</div>
        </div>
        <div class="ns-channels">${(ev.channels || []).map(nsChannelBadge).join('') || '—'}</div>
        <div class="ns-trigger-col">${nsTriggerBadge('手動')}</div>
        <div class="ns-timing">${esc(ltLabel)}</div>
        <div class="ns-actions">
          <button class="btn-s ns-btn-edit" data-ns-edit="${ev.id}">
            編輯
          </button>
          <button class="btn-icon del" data-ns-delete="${ev.id}" title="刪除">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>`;
    }).join('')}</div>`;

    el.querySelectorAll('[data-ns-edit]').forEach((btn) =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); openNsDetail(btn.dataset.nsEdit); })
    );
    el.querySelectorAll('[data-ns-delete]').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ev = loadCustomEvents().find((x) => x.id === btn.dataset.nsDelete);
        if (!ev) return;
        pendingDeleteId = ev.id;
        document.getElementById('del-confirm-name').textContent = ev.name;
        openModal('modal-delete-confirm');
      })
    );
    el.querySelectorAll('.ns-event-row').forEach((row) =>
      row.addEventListener('click', (e) => {
        if (e.target.closest('.ns-actions')) return;
        openNsDetail(row.dataset.nsId);
      })
    );
  }

  function openNsDetail(id) {
    nsActiveId = id;
    const detailEl = document.getElementById('ns-detail-view');
    // On list-only page: navigate to the dedicated edit page
    if (!detailEl) {
      location.href = 'admin-notify-settings-edit.html?id=' + encodeURIComponent(id);
      return;
    }
    document.getElementById('ns-list-view')?.style.setProperty('display', 'none');
    detailEl.style.display = '';
    const isSystem = SYSTEM_NOTIFY_EVENTS.some((e) => e.id === id);
    if (isSystem) renderNsSystemDetail(id);
    else          renderNsCustomDetail(id);
  }

  function renderNsSystemDetail(id) {
    const detailEl = document.getElementById('ns-detail-view');
    const ev = SYSTEM_NOTIFY_EVENTS.find((e) => e.id === id);
    if (!ev || !detailEl) return;

    const allTpls = loadAllSysTemplates();
    const tpl     = allTpls.find((t) => t.id === ev.tplId);
    if (!tpl) return;

    const hasSms  = ev.channels.includes('SMS');
    const hasLine = ev.channels.includes('LINE');
    const smsVal  = esc(tpl.sms || '');
    const lineVal = esc(tpl.lineText || '');
    const allVars = ['{姓名}','{URL}','{效期}','{案號}','{筆數}','{提領URL}','{紀錄URL}','{MGMURL}'];

    detailEl.innerHTML = `
      <div class="ns-detail-header">
        <button class="btn-s" id="btn-ns-back"><i class="fa-solid fa-chevron-left"></i> 返回清單</button>
        <div class="ns-detail-id-wrap">
          <span class="ns-detail-id">${esc(ev.id)}</span>
          <h2 class="ns-detail-title">${esc(ev.name)}</h2>
        </div>
        <span class="ns-sys-badge"><i class="fa-solid fa-lock" style="font-size:9px;"></i> 系統通知</span>
      </div>

      <div class="ns-meta-card">
        <div class="ns-meta-grid">
          <div class="ns-meta-item">
            <div class="ns-meta-label"><i class="fa-solid fa-users"></i> 通知對象</div>
            <div class="ns-meta-value">${esc(ev.recipients)}</div>
          </div>
          <div class="ns-meta-item">
            <div class="ns-meta-label"><i class="fa-solid fa-tower-broadcast"></i> 推播管道</div>
            <div class="ns-meta-value">${ev.channels.map(nsChannelBadge).join('')}</div>
          </div>
          <div class="ns-meta-item">
            <div class="ns-meta-label"><i class="fa-solid fa-bolt"></i> 觸發方式</div>
            <div class="ns-meta-value">${nsTriggerBadge(ev.triggerMethod)}</div>
          </div>
          <div class="ns-meta-item ns-meta-item--wide">
            <div class="ns-meta-label"><i class="fa-regular fa-clock"></i> 觸發時機</div>
            <div class="ns-meta-value"><span class="ns-timing-val">${esc(ev.triggerTiming)}</span></div>
          </div>
        </div>
      </div>

      <div class="ns-tpl-section">
        <div class="ns-tpl-hd">
          <div class="ns-tpl-title"><i class="fa-solid fa-file-pen" style="color:#6366f1;"></i> 訊息內容設定</div>
          <div class="ns-tpl-note">可自訂訊息文字；觸發條件由系統管控</div>
        </div>
        <div class="tpl-card" id="ns-card-${tpl.id}">
          <div class="tpl-body" style="border-radius:12px;">
            <div class="tpl-ch-tabs">
              ${hasLine ? `<button class="tpl-ch-tab active" data-tpl="${tpl.id}" data-tplch="line"><i class="fa-brands fa-line"></i> LINE</button>` : ''}
              ${hasSms  ? `<button class="tpl-ch-tab${!hasLine ? ' active' : ''}" data-tpl="${tpl.id}" data-tplch="sms"><i class="fa-solid fa-comment-sms"></i> SMS</button>` : ''}
            </div>
            ${hasLine ? `
            <div id="wrap-line-${tpl.id}">
              <div class="tpl-var-row">
                <div class="tpl-var-label">可用變數（點擊插入）：</div>
                <div class="var-chips">${allVars.map((v) =>
                  `<span class="var-chip" data-tplid="${tpl.id}" data-v="${v}" data-vch="lineText">${v}</span>`).join('')}</div>
              </div>
              <textarea class="tpl-textarea" id="ta-linetext-${tpl.id}">${lineVal}</textarea>
              <div class="tpl-save-row">
                <span class="tpl-char-info" id="ci-line-${tpl.id}"></span>
                <button class="btn-tpl-save" data-saveid="${tpl.id}"><i class="fa-solid fa-floppy-disk"></i> 儲存此母版</button>
              </div>
            </div>` : ''}
            ${hasSms ? `
            <div id="wrap-sms-${tpl.id}" style="${hasLine ? 'display:none;' : ''}">
              <div class="tpl-var-row">
                <div class="tpl-var-label">可用變數（點擊插入）：</div>
                <div class="var-chips">${allVars.map((v) =>
                  `<span class="var-chip" data-tplid="${tpl.id}" data-v="${v}" data-vch="sms">${v}</span>`).join('')}</div>
              </div>
              <textarea class="tpl-textarea" id="ta-sms-${tpl.id}">${smsVal}</textarea>
              <div class="tpl-save-row">
                <span class="tpl-char-info" id="ci-sms-${tpl.id}"></span>
                <button class="btn-tpl-save" data-saveid="${tpl.id}"><i class="fa-solid fa-floppy-disk"></i> 儲存此母版</button>
              </div>
            </div>` : ''}
          </div>
        </div>
      </div>`;

    document.getElementById('btn-ns-back')?.addEventListener('click', renderNsList);

    detailEl.querySelectorAll('.tpl-ch-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId = btn.dataset.tpl, ch = btn.dataset.tplch;
        const card  = document.getElementById('ns-card-' + tplId);
        card.querySelectorAll('.tpl-ch-tab').forEach((b) => b.classList.toggle('active', b.dataset.tplch === ch));
        const wl = document.getElementById('wrap-line-' + tplId);
        const ws = document.getElementById('wrap-sms-'  + tplId);
        if (wl) wl.style.display = ch === 'line' ? '' : 'none';
        if (ws) ws.style.display = ch === 'sms'  ? '' : 'none';
        updateTplCharInfo(tplId, ch);
      });
    });

    detailEl.querySelectorAll('.var-chip[data-tplid]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const tplId = chip.dataset.tplid;
        const ch    = chip.dataset.vch;
        const ta    = document.getElementById(`ta-${ch === 'sms' ? 'sms' : 'linetext'}-${tplId}`);
        if (ta) insertAtCursor(ta, chip.dataset.v);
        updateTplCharInfo(tplId, ch === 'sms' ? 'sms' : 'line');
      });
    });

    ['sms','linetext'].forEach((pfx) => {
      const ta = document.getElementById(`ta-${pfx}-${tpl.id}`);
      if (ta) ta.addEventListener('input', () => updateTplCharInfo(tpl.id, pfx === 'sms' ? 'sms' : 'line'));
    });

    detailEl.querySelectorAll('[data-saveid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId = btn.dataset.saveid;
        saveTplField(tplId, 'sms',      document.getElementById('ta-sms-'      + tplId)?.value || '');
        saveTplField(tplId, 'lineType', 'text');
        saveTplField(tplId, 'lineText', document.getElementById('ta-linetext-' + tplId)?.value || '');
        const live = [...templates, ...SYS_EXTRA_TEMPLATES].find((x) => x.id === tplId);
        if (live) {
          live.sms      = document.getElementById('ta-sms-'      + tplId)?.value || '';
          live.lineText = document.getElementById('ta-linetext-' + tplId)?.value || '';
        }
        toast('母版已儲存');
      });
    });

    if (hasLine) updateTplCharInfo(tpl.id, 'line');
    if (hasSms)  updateTplCharInfo(tpl.id, 'sms');
  }

  function renderNsCustomDetail(id) {
    const detailEl = document.getElementById('ns-detail-view');
    const customs  = loadCustomEvents();
    const ev = customs.find((x) => x.id === id);
    if (!ev || !detailEl) { renderNsList(); return; }

    const hasLine  = (ev.channels || []).includes('LINE');
    const hasSms   = (ev.channels || []).includes('SMS');
    const lineType = ev.lineType || 'text';
    const lineVal  = esc(ev.lineText || '');
    const smsVal   = esc(ev.smsText  || '');
    const ic       = ev.lineImageCard || {};
    const allVars  = ['{姓名}','{URL}','{效期}','{案號}','{筆數}'];

    const lineTypeLabel = lineType === 'image'
      ? '<i class="fa-regular fa-image" style="font-size:10px;"></i> 圖片卡片'
      : '<i class="fa-regular fa-message" style="font-size:10px;"></i> 純文字';

    const lineContentHtml = lineType === 'image' ? `
      <div style="display:flex;flex-direction:column;gap:10px;padding:12px 0;">
        <div class="tpl-ic-preview" style="background:#f8f9ff;border:1px solid #e0e0f0;border-radius:10px;padding:14px;font-size:12px;color:#374151;">
          ${ic.imageUrl ? `<img src="${esc(ic.imageUrl)}" style="width:100%;max-height:140px;object-fit:cover;border-radius:7px;margin-bottom:8px;" onerror="this.style.display='none'" />` : '<div style="height:80px;background:#f3f4f6;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#c0c4cc;font-size:11px;margin-bottom:8px;">無圖片</div>'}
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${esc(ic.title || '—')}</div>
          <div style="color:#6b7280;">${esc(ic.body || '—')}</div>
          ${ic.buttonLabel ? `<div style="margin-top:10px;"><a style="display:inline-block;padding:6px 16px;background:#6366f1;color:#fff;border-radius:20px;font-size:12px;font-weight:600;text-decoration:none;">${esc(ic.buttonLabel)}</a></div>` : ''}
        </div>
      </div>` : `
      <textarea class="tpl-textarea" id="nsd-ta-line">${lineVal}</textarea>
      <div class="tpl-save-row"><span class="tpl-char-info" id="nsd-ci-line"></span></div>`;

    detailEl.innerHTML = `
      <div class="ns-detail-header">
        <button class="btn-s" id="btn-ns-back"><i class="fa-solid fa-chevron-left"></i> 返回清單</button>
        <div class="ns-detail-id-wrap">
          <span class="ns-detail-id ns-detail-id--custom">自訂</span>
          <h2 class="ns-detail-title">${esc(ev.name)}</h2>
        </div>
        <div style="display:flex;gap:8px;margin-left:auto;">
          <button class="btn-s" id="btn-ns-edit-meta">編輯設定</button>
          <button class="btn-icon del" id="btn-ns-del-detail" title="刪除此通知"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>

      <div class="ns-meta-card">
        <div class="ns-meta-grid">
          <div class="ns-meta-item">
            <div class="ns-meta-label"><i class="fa-solid fa-tower-broadcast"></i> 推播管道</div>
            <div class="ns-meta-value">${(ev.channels || []).map(nsChannelBadge).join('') || '<span style="color:#c0c4cc;">—</span>'}</div>
          </div>
          <div class="ns-meta-item">
            <div class="ns-meta-label"><i class="fa-solid fa-bolt"></i> 派送方式</div>
            <div class="ns-meta-value">${nsTriggerBadge('手動')}</div>
          </div>
          <div class="ns-meta-item">
            <div class="ns-meta-label"><i class="fa-brands fa-line"></i> LINE 格式</div>
            <div class="ns-meta-value">${lineTypeLabel}</div>
          </div>
        </div>
      </div>

      <div class="ns-tpl-section">
        <div class="ns-tpl-hd">
          <div class="ns-tpl-title"><i class="fa-solid fa-file-pen" style="color:#6366f1;"></i> 訊息內容設定</div>
        </div>
        <div class="tpl-card">
          <div class="tpl-body" style="border-radius:12px;">
            <div class="tpl-ch-tabs">
              <button class="tpl-ch-tab${hasLine ? ' active' : ''}" data-nsdtab="line"><i class="fa-brands fa-line"></i> LINE</button>
              <button class="tpl-ch-tab${!hasLine && hasSms ? ' active' : ''}" data-nsdtab="sms"><i class="fa-solid fa-comment-sms"></i> SMS</button>
            </div>
            <div id="nsd-wrap-line" style="${!hasLine ? 'display:none;' : ''}">
              <div class="tpl-var-row">
                <div class="tpl-var-label">可用變數（點擊插入）：</div>
                <div class="var-chips">${allVars.map((v) =>
                  `<span class="var-chip" data-nsdv="${v}" data-nsdch="line">${v}</span>`).join('')}</div>
              </div>
              ${lineContentHtml}
            </div>
            <div id="nsd-wrap-sms" style="${hasLine ? 'display:none;' : ''}">
              <div class="tpl-var-row">
                <div class="tpl-var-label">可用變數（點擊插入）：</div>
                <div class="var-chips">${allVars.map((v) =>
                  `<span class="var-chip" data-nsdv="${v}" data-nsdch="sms">${v}</span>`).join('')}</div>
              </div>
              <textarea class="tpl-textarea" id="nsd-ta-sms">${smsVal}</textarea>
              <div class="tpl-save-row"><span class="tpl-char-info" id="nsd-ci-sms"></span></div>
            </div>
            <div class="tpl-save-row" style="border-top:1px solid #f3f4f6;padding-top:12px;margin-top:8px;">
              <span></span>
              <button class="btn-tpl-save" id="btn-nsd-save-msg"><i class="fa-solid fa-floppy-disk"></i> 儲存訊息</button>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('btn-ns-back')?.addEventListener('click', renderNsList);
    document.getElementById('btn-ns-edit-meta')?.addEventListener('click', () => openCustomEventModal(ev.id));

    document.getElementById('btn-ns-del-detail')?.addEventListener('click', () => {
      pendingDeleteId = ev.id;
      document.getElementById('del-confirm-name').textContent = ev.name;
      openModal('modal-delete-confirm');
    });

    detailEl.querySelectorAll('[data-nsdtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ch = btn.dataset.nsdtab;
        detailEl.querySelectorAll('[data-nsdtab]').forEach((b) => b.classList.toggle('active', b === btn));
        document.getElementById('nsd-wrap-line').style.display = ch === 'line' ? '' : 'none';
        document.getElementById('nsd-wrap-sms').style.display  = ch === 'sms'  ? '' : 'none';
        nsdUpdateCharInfo();
      });
    });

    detailEl.querySelectorAll('[data-nsdv]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const ch = chip.dataset.nsdch;
        const ta = document.getElementById(ch === 'sms' ? 'nsd-ta-sms' : 'nsd-ta-line');
        if (ta) insertAtCursor(ta, chip.dataset.nsdv);
        nsdUpdateCharInfo();
      });
    });

    document.getElementById('nsd-ta-line')?.addEventListener('input', nsdUpdateCharInfo);
    document.getElementById('nsd-ta-sms')?.addEventListener('input',  nsdUpdateCharInfo);

    document.getElementById('btn-nsd-save-msg')?.addEventListener('click', () => {
      const arr = loadCustomEvents();
      const idx = arr.findIndex((x) => x.id === ev.id);
      if (idx < 0) return;
      if (lineType === 'text') arr[idx].lineText = document.getElementById('nsd-ta-line')?.value || '';
      arr[idx].smsText = document.getElementById('nsd-ta-sms')?.value || '';
      saveCustomEventsData(arr);
      toast('訊息已儲存');
    });

    nsdUpdateCharInfo();
  }

  function nsdUpdateCharInfo() {
    [['nsd-ta-sms','nsd-ci-sms',60],['nsd-ta-line','nsd-ci-line',50]].forEach(([taId, ciId, limit]) => {
      const ta = document.getElementById(taId);
      const ci = document.getElementById(ciId);
      if (!ta || !ci) return;
      const len = ta.value.length;
      ci.className  = 'tpl-char-info' + (len > limit ? ' warn' : '');
      ci.textContent = `${len} 字${limit === 60 ? '（建議 ≤ 60）' : ''}`;
    });
  }

  function bindNsPageEvents() {
    document.getElementById('btn-ns-add')?.addEventListener('click', () => openCustomEventModal(null));

    // Channel/LINE tab switching
    document.querySelectorAll('.ce-tpl-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ce-tpl-tab').forEach((b) => b.classList.toggle('active', b === tab));
        document.getElementById('ce-panel-line').style.display = tab.dataset.cetab === 'line' ? '' : 'none';
        document.getElementById('ce-panel-sms').style.display  = tab.dataset.cetab === 'sms'  ? '' : 'none';
      });
    });

    // Channel radio toggles format row visibility and auto-switches active tab
    document.querySelectorAll('input[name="ce-channel"]').forEach((r) => {
      r.addEventListener('change', () => {
        ceUpdateLineTypeRow();
        const cetab = r.value === 'LINE' ? 'line' : 'sms';
        document.querySelectorAll('.ce-tpl-tab').forEach((b) => b.classList.toggle('active', b.dataset.cetab === cetab));
        document.getElementById('ce-panel-line').style.display = r.value === 'LINE' ? '' : 'none';
        document.getElementById('ce-panel-sms').style.display  = r.value === 'SMS'  ? '' : 'none';
      });
    });

    // LINE type radio toggles text/image panels
    document.querySelectorAll('input[name="ce-line-type"]').forEach((r) => {
      r.addEventListener('change', () => ceUpdateLineTypePanel(r.value));
    });

    // SMS char counter
    document.getElementById('ce-sms-text')?.addEventListener('input', function () {
      const el = document.getElementById('ce-sms-char');
      if (el) el.textContent = this.value.length + ' 字';
    });

    // Variable chips — insert at cursor in the focused textarea (LINE text or SMS)
    document.querySelectorAll('[data-cevar-modal]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const variable = chip.dataset.cevarModal;
        const activeTab = document.querySelector('.ce-tpl-tab.active')?.dataset.cetab;
        let ta;
        if (activeTab === 'sms') {
          ta = document.getElementById('ce-sms-text');
        } else {
          const lineType = document.getElementById('ce-lt-image')?.checked ? 'image' : 'text';
          ta = lineType === 'text'
            ? document.getElementById('ce-line-text')
            : document.getElementById('ce-li-body');
        }
        if (!ta) return;
        const s = ta.selectionStart, e = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + variable + ta.value.slice(e);
        ta.selectionStart = ta.selectionEnd = s + variable.length;
        ta.focus();
      });
    });

    document.getElementById('btn-save-custom-event')?.addEventListener('click', saveCustomEventFromModal);

    document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
      if (!pendingDeleteId) return;
      const arr = loadCustomEvents().filter((x) => x.id !== pendingDeleteId);
      saveCustomEventsData(arr);
      pendingDeleteId = null;
      closeModal('modal-delete-confirm');
      const inDetail = document.getElementById('ns-detail-view')?.style.display !== 'none';
      if (inDetail) renderNsList(); else renderNsCustomList();
      toast('已刪除');
    });
  }

  function openCustomEventModal(id) {
    editingCustomId = id;
    document.getElementById('modal-custom-title').textContent = id ? '編輯自訂通知' : '新增自訂通知';

    if (id) {
      const ev = loadCustomEvents().find((x) => x.id === id);
      if (!ev) return;
      document.getElementById('ce-name').value = ev.name || '';
      const hasSMS = (ev.channels || []).includes('SMS');
      document.getElementById('ce-ch-line').checked = !hasSMS;
      document.getElementById('ce-ch-sms').checked  = hasSMS;
      document.getElementById('ce-line-text').value = ev.lineText || '';
      document.getElementById('ce-sms-text').value  = ev.smsText  || '';
      // LINE type
      const lineType = ev.lineType || 'text';
      document.getElementById('ce-lt-text').checked  = lineType === 'text';
      document.getElementById('ce-lt-image').checked = lineType === 'image';
      // Image card fields
      document.getElementById('ce-li-imgurl').value   = ev.lineImageCard?.imageUrl   || '';
      document.getElementById('ce-li-title').value    = ev.lineImageCard?.title      || '';
      document.getElementById('ce-li-body').value     = ev.lineImageCard?.body       || '';
      document.getElementById('ce-li-btnlabel').value = ev.lineImageCard?.buttonLabel|| '';
      document.getElementById('ce-li-btnurl').value   = ev.lineImageCard?.buttonUrl  || '';
      ceUpdateLineTypePanel(lineType);
    } else {
      document.getElementById('ce-name').value           = '';
      document.getElementById('ce-ch-line').checked      = true;
      document.getElementById('ce-ch-sms').checked       = false;
      document.getElementById('ce-lt-text').checked      = true;
      document.getElementById('ce-lt-image').checked     = false;
      document.getElementById('ce-line-text').value      = '';
      document.getElementById('ce-sms-text').value       = '';
      document.getElementById('ce-li-imgurl').value      = '';
      document.getElementById('ce-li-title').value       = '';
      document.getElementById('ce-li-body').value        = '';
      document.getElementById('ce-li-btnlabel').value    = '';
      document.getElementById('ce-li-btnurl').value      = '';
      ceUpdateLineTypePanel('text');
    }

    ceUpdateLineTypeRow();
    document.getElementById('ce-name-err').style.display = 'none';
    const initTab = document.getElementById('ce-ch-sms').checked ? 'sms' : 'line';
    document.querySelectorAll('.ce-tpl-tab').forEach((b) => b.classList.toggle('active', b.dataset.cetab === initTab));
    document.getElementById('ce-panel-line').style.display = initTab === 'line' ? '' : 'none';
    document.getElementById('ce-panel-sms').style.display  = initTab === 'sms'  ? '' : 'none';
    openModal('modal-custom-event');
  }

  function ceUpdateLineTypePanel(type) {
    document.getElementById('ce-panel-line-text').style.display  = type === 'text'  ? '' : 'none';
    document.getElementById('ce-panel-line-image').style.display = type === 'image' ? '' : 'none';
  }

  function ceUpdateLineTypeRow() {
    const lineChecked = document.getElementById('ce-ch-line').checked;
    document.getElementById('ce-line-type-row').style.display = lineChecked ? '' : 'none';
  }

  function saveCustomEventFromModal() {
    const name = document.getElementById('ce-name').value.trim();
    if (!name) {
      document.getElementById('ce-name-err').style.display = '';
      document.getElementById('ce-name').focus();
      return;
    }
    const selectedChannel = document.querySelector('input[name="ce-channel"]:checked')?.value || 'LINE';
    const channels = [selectedChannel];

    const lineType = document.getElementById('ce-lt-image').checked ? 'image' : 'text';
    const lineImageCard = {
      imageUrl:    document.getElementById('ce-li-imgurl').value.trim(),
      title:       document.getElementById('ce-li-title').value.trim(),
      body:        document.getElementById('ce-li-body').value.trim(),
      buttonLabel: document.getElementById('ce-li-btnlabel').value.trim(),
      buttonUrl:   document.getElementById('ce-li-btnurl').value.trim(),
    };

    const record = {
      name,
      channels,
      triggerMethod: '手動',
      lineType,
      lineText:     document.getElementById('ce-line-text').value,
      lineImageCard,
      smsText:      document.getElementById('ce-sms-text').value,
    };

    const arr = loadCustomEvents();
    if (editingCustomId) {
      const idx = arr.findIndex((x) => x.id === editingCustomId);
      if (idx >= 0) arr[idx] = { ...arr[idx], ...record };
    } else {
      arr.push({ id: 'custom-' + Date.now(), ...record });
    }
    saveCustomEventsData(arr);
    closeModal('modal-custom-event');

    const inDetail = document.getElementById('ns-detail-view')?.style.display !== 'none';
    if (editingCustomId && inDetail) renderNsCustomDetail(editingCustomId);
    else renderNsCustomList();
    toast(editingCustomId ? '已更新自訂通知' : '已新增自訂通知');
  }

  /* ══════════════════════════════════════════════
     LOG MODULE
  ══════════════════════════════════════════════ */
  function getFilteredLog() {
    const real = loadJson(LOG_KEY, []);
    const rows = real.length ? real : DEMO_LOG;
    const { member, dateFrom, dateTo, actor, channel, keyword } = logFilter;
    const qMember  = member.trim().toLowerCase();
    const qActor   = actor.trim().toLowerCase();
    const qKeyword = keyword.trim().toLowerCase();
    return rows.filter((e) => {
      if (qMember) {
        const details = e.recipientDetails || [];
        const match = details.some((r) =>
          (r.name || '').toLowerCase().includes(qMember) || (r.id || '').toLowerCase().includes(qMember)
        );
        if (!match) return false;
      }
      if (dateFrom || dateTo) {
        const timePart = (e.time || '').split(' ')[0];
        const parts = timePart.replace(/\//g, '-').split('-');
        if (parts.length === 3) {
          const normalized = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
          if (dateFrom && normalized < dateFrom) return false;
          if (dateTo   && normalized > dateTo)   return false;
        }
      }
      if (qActor && !(e.actor || '').toLowerCase().includes(qActor)) return false;
      if (channel && !(e.channels || []).includes(channel)) return false;
      if (qKeyword) {
        const hay = [(e.tplName||''), (e.smsText||''), (e.lineText||'')].join(' ').toLowerCase();
        if (!hay.includes(qKeyword)) return false;
      }
      return true;
    });
  }

  function renderLog() {
    const tbody = document.getElementById('log-tbody');
    if (!tbody) return;

    const filtered = getFilteredLog();
    const total  = filtered.length;
    const pages  = Math.max(1, Math.ceil(total / LOG_PAGE_SIZE));
    if (logPage > pages) logPage = pages;
    const from  = (logPage - 1) * LOG_PAGE_SIZE;
    const to    = Math.min(logPage * LOG_PAGE_SIZE, total);
    const slice = filtered.slice(from, to);

    const infoEl = document.getElementById('log-result-info');
    if (infoEl) {
      const real = loadJson(LOG_KEY, []);
      const totalAll = (real.length ? real : DEMO_LOG).length;
      infoEl.textContent = total === totalAll
        ? `共 ${total} 筆紀錄`
        : `篩選結果：${total} 筆（共 ${totalAll} 筆）`;
    }

    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:28px;color:#9ca3af;">尚無符合條件的紀錄</td></tr>';
      renderLogPagination(pages, total, from + 1, to);
      return;
    }

    tbody.innerHTML = slice.map((e, i) => {
      const chBadges = (e.channels || []).map((ch) =>
        `<span class="log-ch-badge log-ch-badge--${ch.toLowerCase()}">${ch}</span>`
      ).join(' ');
      const details = e.recipientDetails || [];
      const count   = e.recipientCount || details.length;
      const fmtName = (r) => `${esc(r.name)}<span style="color:#9ca3af;font-weight:400;">(${r.id})</span>`;
      const rcptStr = details.length <= 2
        ? details.map(fmtName).join('、')
        : details.slice(0, 2).map(fmtName).join('、') + ` 等 ${count} 人`;
      const msgPrev = (e.smsText || e.lineText || '').substring(0, 20);
      return `<tr>
        <td style="white-space:nowrap;font-size:12px;">${esc(e.time||'—')}</td>
        <td style="white-space:nowrap;font-size:12px;">${esc(e.actor||'—')}</td>
        <td style="font-size:12px;">${rcptStr}</td>
        <td style="white-space:nowrap;">${chBadges}</td>
        <td style="font-size:12px;"><span style="color:#6366f1;font-weight:600;">【${esc(e.tplName||'自訂')}】</span> <span style="color:#6b7280;">${esc(msgPrev)}${msgPrev.length>=20?'…':''}</span></td>
        <td style="white-space:nowrap;">
          <span class="log-sent"><i class="fa-solid fa-check"></i> 已發送</span>
          <button class="log-detail-btn" data-logidx="${from + i}"><i class="fa-solid fa-magnifying-glass" style="font-size:9px;"></i> 明細</button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.log-detail-btn').forEach((btn) =>
      btn.addEventListener('click', () => openNotifyDetail(filtered[+btn.dataset.logidx]))
    );

    renderLogPagination(pages, total, from + 1, to);
  }

  function renderLogPagination(pages, total, from, to) {
    const el = document.getElementById('log-pagination');
    if (!el) return;
    if (total === 0) { el.innerHTML = ''; return; }

    let btns = `<button class="pag-btn" id="lpag-prev" ${logPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left" style="font-size:10px;"></i></button>`;
    const maxV = 7;
    let start = Math.max(1, logPage - 3);
    let end   = Math.min(pages, start + maxV - 1);
    if (end - start < maxV - 1) start = Math.max(1, end - maxV + 1);
    if (start > 1) { btns += `<button class="pag-btn" data-lpage="1">1</button>`; if (start > 2) btns += `<span class="pag-ellipsis">…</span>`; }
    for (let i = start; i <= end; i++) {
      btns += `<button class="pag-btn${i === logPage ? ' active' : ''}" data-lpage="${i}">${i}</button>`;
    }
    if (end < pages) { if (end < pages - 1) btns += `<span class="pag-ellipsis">…</span>`; btns += `<button class="pag-btn" data-lpage="${pages}">${pages}</button>`; }
    btns += `<button class="pag-btn" id="lpag-next" ${logPage === pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right" style="font-size:10px;"></i></button>`;

    el.innerHTML = `<span class="pag-info">第 ${from}–${to} 筆，共 ${total} 筆</span><div class="pag-btns">${btns}</div>`;
    el.querySelector('#lpag-prev')?.addEventListener('click', () => { if (logPage > 1) { logPage--; renderLog(); } });
    el.querySelector('#lpag-next')?.addEventListener('click', () => { if (logPage < pages) { logPage++; renderLog(); } });
    el.querySelectorAll('[data-lpage]').forEach((b) => b.addEventListener('click', () => { logPage = +b.dataset.lpage; renderLog(); }));
  }

  function exportLogCsv() {
    const filtered = getFilteredLog();
    if (!filtered.length) { toast('目前無紀錄可匯出', '#ef4444'); return; }
    const headers = ['發送時間','操作人員','收件對象','收件人數','管道','母版/摘要','SMS內容','LINE內容'];
    const csvRows = filtered.map((e) => {
      const details = e.recipientDetails || [];
      const rcptStr = details.map((r) => `${r.name}(${r.id})`).join('; ');
      const count   = e.recipientCount || details.length;
      const chs     = (e.channels || []).join('+');
      const summary = `【${e.tplName||'自訂'}】${(e.smsText||e.lineText||'').substring(0,30)}`;
      return [e.time||'', e.actor||'', rcptStr, count, chs, summary, e.smsText||'', e.lineText||'']
        .map((v) => `"${String(v).replace(/"/g,'""')}"`).join(',');
    });
    const bom = '﻿';
    const csv = bom + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    a.download = `notify-log-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`已匯出 ${filtered.length} 筆紀錄`);
  }

  function bindLog() {
    const applyFilter = () => {
      logFilter.member   = document.getElementById('lf-member')?.value   || '';
      logFilter.dateFrom = document.getElementById('lf-date-from')?.value || '';
      logFilter.dateTo   = document.getElementById('lf-date-to')?.value   || '';
      logFilter.actor    = document.getElementById('lf-actor')?.value     || '';
      logFilter.channel  = document.getElementById('lf-channel')?.value   || '';
      logFilter.keyword  = document.getElementById('lf-keyword')?.value   || '';
      logPage = 1;
      renderLog();
    };
    const clearFilter = () => {
      ['lf-member','lf-date-from','lf-date-to','lf-actor','lf-keyword'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const ch = document.getElementById('lf-channel');
      if (ch) ch.value = '';
      logFilter = { member:'', dateFrom:'', dateTo:'', actor:'', channel:'', keyword:'' };
      logPage = 1;
      renderLog();
    };
    document.getElementById('btn-search-log')?.addEventListener('click', applyFilter);
    document.getElementById('btn-clear-log')?.addEventListener('click',  clearFilter);
    document.getElementById('btn-refresh-log')?.addEventListener('click', () => { clearFilter(); });
    document.getElementById('btn-export-log')?.addEventListener('click',  exportLogCsv);
    // Enter key on filter inputs
    ['lf-member','lf-date-from','lf-date-to','lf-actor','lf-keyword'].forEach((id) => {
      document.getElementById(id)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilter(); });
    });
    document.getElementById('lf-channel')?.addEventListener('change', applyFilter);
    renderLog();
  }

  function openNotifyDetail(e) {
    const hasSms  = (e.channels || []).includes('SMS');
    const hasLine = (e.channels || []).includes('LINE');
    const details = e.recipientDetails || [];
    const count   = e.recipientCount || details.length;
    const chBadges = (e.channels || []).map((ch) =>
      `<span class="log-ch-badge log-ch-badge--${ch.toLowerCase()}">${ch}</span>`
    ).join(' ');
    const rcptHtml = details.map((r) =>
      `<div class="nm-rcpt-item">
        ${esc(r.name)}<span class="nm-rcpt-meta">(${r.id}、${esc(r.mobile)})</span>
        ${hasLine ? (r.line
          ? '<span class="nm-rcpt-line nm-rcpt-line--yes"><i class="fa-brands fa-line" style="font-size:9px;"></i> LINE</span>'
          : '<span class="nm-rcpt-line nm-rcpt-line--no">無 LINE</span>') : ''}
      </div>`
    ).join('');
    let msgHtml = '';
    if (hasSms && e.smsText) msgHtml += `<div class="nm-section"><div class="nm-ch-head nm-ch-head--sms"><i class="fa-solid fa-comment-sms"></i> SMS 發送內容</div><div class="nm-msg-box">${esc(e.smsText)}</div><div class="nm-msg-note">* {姓名} 於發送時自動替換</div></div>`;
    if (hasLine && e.lineText) msgHtml += `<div class="nm-section"><div class="nm-ch-head nm-ch-head--line"><i class="fa-brands fa-line"></i> LINE 推播內容</div><div class="nm-msg-box">${esc(e.lineText)}</div><div class="nm-msg-note">* {姓名} 於發送時自動替換</div></div>`;
    document.getElementById('nm-body').innerHTML = `
      <div class="nm-meta">
        <i class="fa-regular fa-clock" style="color:#6366f1;"></i>
        <strong>${esc(e.time||'—')}</strong>
        <span class="nm-meta-sep">|</span>
        ${esc(e.actor||'—')}
        <span class="nm-meta-sep">|</span>
        ${chBadges}
        <span class="nm-meta-sep">|</span>
        <span style="color:#6366f1;font-weight:700;">【${esc(e.tplName||'自訂')}】</span>
      </div>
      <div class="nm-section">
        <div class="nm-section-title"><i class="fa-solid fa-users"></i> 收件人（共 ${count} 位）</div>
        <div class="nm-rcpt-list">${rcptHtml}</div>
      </div>
      ${msgHtml}`;
    openModal('modal-notify-detail');
  }

  /* ══════════════════════════════════════════════
     EVENT BINDINGS
  ══════════════════════════════════════════════ */
  function bindTabs() {
    document.querySelectorAll('.ntab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ntab').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.ntab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.ntab).classList.add('active');
        if (btn.dataset.ntab === 'settings') renderSettingsCards();
        if (btn.dataset.ntab === 'log')      renderLog();
        if (btn.dataset.ntab === 'tags')     renderTagsTab();
        if (btn.dataset.ntab === 'members')  renderMembersTab();
        if (btn.dataset.ntab === 'groups')   renderGroupsTab();
      });
    });
  }

  function lockChannelsFromTemplate(chList) {
    channels.line = chList.includes('LINE');
    channels.sms  = chList.includes('SMS');
    const lockedRow = document.getElementById('tpl-ch-locked-row');
    const lockedEl  = document.getElementById('tpl-locked-channels');
    if (lockedEl) {
      lockedEl.innerHTML = chList.map((ch) => ch === 'LINE'
        ? `<span class="ch-locked-badge ch-locked-badge--line"><i class="fa-brands fa-line"></i> LINE 推播</span>`
        : `<span class="ch-locked-badge ch-locked-badge--sms"><i class="fa-solid fa-comment-sms"></i> 簡訊 SMS</span>`
      ).join('');
    }
    if (lockedRow) lockedRow.style.display = '';
    const chSection = document.getElementById('ch-select-section');
    if (chSection) chSection.style.display = 'none';
    syncChannelUI();
  }

  function unlockChannels() {
    channels.line = false;
    channels.sms  = false;
    const lockedRow = document.getElementById('tpl-ch-locked-row');
    if (lockedRow) lockedRow.style.display = 'none';
    const chSection = document.getElementById('ch-select-section');
    if (chSection) chSection.style.display = '';
    syncChannelUI();
  }

  function bindSend() {
    buildTplPicker();

    // Channel toggles — single select (radio)
    ['line','sms'].forEach((ch) => {
      const opt = document.getElementById('ch-' + ch + '-opt');
      const cb  = document.getElementById('ch-' + ch);
      opt.addEventListener('click', (e) => {
        if (e.target === cb) return;
        e.preventDefault();
        if (!channels[ch]) {
          channels.line = false;
          channels.sms  = false;
          channels[ch]  = true;
          syncChannelUI();
        }
      });
      cb.addEventListener('change', () => {
        if (cb.checked) {
          channels.line = false;
          channels.sms  = false;
          channels[ch]  = true;
          syncChannelUI();
        }
      });
    });

    // MSG tabs
    document.querySelectorAll('.msg-tab').forEach((btn) => {
      btn.addEventListener('click', () => { activeMsgCh = btn.dataset.ch; syncMsgArea(); });
    });

    // LINE type buttons
    document.querySelectorAll('.line-type-btn').forEach((btn) => {
      btn.addEventListener('click', () => { lineType = btn.dataset.ltype; syncLineCompose(); });
    });

    // LINE text textarea
    document.getElementById('msg-line-text')?.addEventListener('input', syncLineTextPreview);

    // Image card fields
    ['li-img-url','li-title','li-body','li-btn-label','li-btn-url'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', syncImageCardPreview)
    );
    // Location card fields
    ['ll-name','ll-addr','ll-lat','ll-lng'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', syncLocationPreview)
    );

    // SMS textarea
    document.getElementById('msg-sms-text')?.addEventListener('input', syncSmsCount);

    // var chips (SMS + LINE)
    document.querySelectorAll('.var-chip[data-var]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const isSms = activeMsgCh === 'sms';
        const ta    = isSms
          ? document.getElementById('msg-sms-text')
          : (lineType === 'text' ? document.getElementById('msg-line-text') : null);
        if (ta) { insertAtCursor(ta, chip.dataset.var); isSms ? syncSmsCount() : syncLineTextPreview(); }
      });
    });

    // Template picker
    document.getElementById('tpl-picker')?.addEventListener('change', (e) => {
      currentTplId = e.target.value;
      applyTemplate(currentTplId);
      if (currentTplId) {
        const sysEv = SYSTEM_NOTIFY_EVENTS.find((ev) => ev.tplId === currentTplId);
        const ce    = loadCustomEvents().find((ev) => ev.id === currentTplId);
        const tplChannels = sysEv?.channels || (ce?.channels?.length ? ce.channels : ['LINE']);
        lockChannelsFromTemplate(tplChannels);
      } else {
        unlockChannels();
      }
    });

    // Recipient add buttons
    document.getElementById('btn-add-groups')?.addEventListener('click', openPickGroups);
    document.getElementById('btn-add-tags')?.addEventListener('click', openPickTags);
    document.getElementById('btn-add-members')?.addEventListener('click', openPickMembers);

    // Clear all
    document.getElementById('btn-rcpt-clear')?.addEventListener('click', () => {
      sendGroups.clear(); sendTags.clear(); sendPersons.clear();
      renderSendChips(); updateSendTotal();
    });

    // Confirm buttons in pick modals
    document.getElementById('btn-pick-groups-ok')?.addEventListener('click', () => {
      pickGroupsSelected.forEach((id) => sendGroups.add(id));
      closeModal('modal-pick-groups');
      renderSendChips(); updateSendTotal();
    });
    document.getElementById('btn-pick-tags-ok')?.addEventListener('click', () => {
      pickTagsSelected.forEach((id) => sendTags.add(id));
      closeModal('modal-pick-tags');
      renderSendChips(); updateSendTotal();
    });
    document.getElementById('btn-pick-members-ok')?.addEventListener('click', () => {
      pickMembersSelected.forEach((id) => sendPersons.add(id));
      closeModal('modal-pick-members');
      renderSendChips(); updateSendTotal();
    });

    // Pick groups search
    document.getElementById('pick-groups-search')?.addEventListener('input', renderPickGroupsList);

    // Pick members search & filter
    document.getElementById('pick-members-search')?.addEventListener('input', renderPickMembersList);
    document.querySelectorAll('[data-pm-filter]').forEach((b) => b.addEventListener('click', () => {
      pickMembersFilter = b.dataset.pmFilter;
      document.querySelectorAll('[data-pm-filter]').forEach((x) => x.classList.toggle('active', x.dataset.pmFilter === pickMembersFilter));
      renderPickMembersList();
    }));

    // Send btn → confirm modal
    document.getElementById('btn-send-notify')?.addEventListener('click', handleSendClick);
    document.getElementById('btn-send-confirm-ok')?.addEventListener('click', confirmSend);
  }

  function bindMembers() {
    // ── 文字搜尋 ──
    document.getElementById('filter-member-id')?.addEventListener('input', (e) => {
      memberSearchId = e.target.value; memberPage = 1; renderMemberTable();
    });
    document.getElementById('filter-member-name')?.addEventListener('input', (e) => {
      memberSearchName = e.target.value; memberPage = 1; renderMemberTable();
    });
    document.getElementById('filter-member-mobile')?.addEventListener('input', (e) => {
      memberSearchMobile = e.target.value; memberPage = 1; renderMemberTable();
    });

    // ── 是否已加入好友（下拉選單） ──
    document.getElementById('filter-line-status')?.addEventListener('change', (e) => {
      memberLineFilter = e.target.value; memberPage = 1; renderMemberTable();
    });

    // ── 加入好友起訖日 ──
    document.getElementById('filter-line-from')?.addEventListener('input', (e) => {
      memberLineJoinFrom = e.target.value; memberPage = 1; renderMemberTable();
    });
    document.getElementById('filter-line-to')?.addEventListener('input', (e) => {
      memberLineJoinTo = e.target.value; memberPage = 1; renderMemberTable();
    });

    // ── 身份多選 ──
    document.querySelectorAll('[data-identity]').forEach((b) => b.addEventListener('click', () => {
      const val = b.dataset.identity;
      memberIdFilters = memberIdFilters.includes(val)
        ? memberIdFilters.filter((x) => x !== val)
        : [...memberIdFilters, val];
      b.classList.toggle('active', memberIdFilters.includes(val));
      memberPage = 1; renderMemberTable();
    }));

    // ── 重置篩選 ──
    document.getElementById('btn-nm-filter-reset')?.addEventListener('click', () => {
      memberSearchId = ''; memberSearchName = ''; memberSearchMobile = '';
      memberLineFilter = ''; memberLineJoinFrom = ''; memberLineJoinTo = '';
      memberIdFilters = []; memberTagFilters = []; memberGroupFilters = [];
      memberPage = 1;
      ['filter-member-id','filter-member-name','filter-member-mobile','filter-line-from','filter-line-to']
        .forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
      const lsel = document.getElementById('filter-line-status'); if (lsel) lsel.value = '';
      document.querySelectorAll('[data-identity]').forEach((x) => x.classList.remove('active'));
      renderMembersTab();
    });
    document.getElementById('btn-member-edit-save')?.addEventListener('click', saveMemberEdit);
    document.querySelectorAll('#member-edit-identity-cbs input').forEach((cb) => {
      cb.addEventListener('change', () => cb.closest('.id-cb-label').classList.toggle('on', cb.checked));
    });
    document.getElementById('btn-attach-groups-ok')?.addEventListener('click', confirmAttachGroups);

    // ── 全選 checkbox ──
    document.getElementById('member-select-all')?.addEventListener('click', (e) => {
      const filtered = getMembersFiltered();
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const safePage = Math.min(memberPage, pages);
      const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
      if (e.target.checked) slice.forEach((m) => memberSelectedIds.add(m.id));
      else slice.forEach((m) => memberSelectedIds.delete(m.id));
      renderMemberTable();
      updateMemberBatchBar();
    });

    // ── 批次操作列 ──
    document.getElementById('btn-batch-tags')?.addEventListener('click', openBatchTagModal);
    document.getElementById('btn-batch-groups')?.addEventListener('click', openBatchGroupModal);
    document.getElementById('btn-batch-clear')?.addEventListener('click', () => {
      memberSelectedIds.clear();
      renderMemberTable();
      updateMemberBatchBar();
    });
    document.getElementById('btn-batch-tags-ok')?.addEventListener('click', confirmBatchTags);
    document.getElementById('btn-batch-groups-ok')?.addEventListener('click', confirmBatchGroups);
  }

  function bindGroups() {
    document.getElementById('btn-new-group')?.addEventListener('click', () => {
      document.getElementById('new-group-name').value = '';
      document.getElementById('new-group-name-err').style.display = 'none';
      openModal('modal-new-group');
      setTimeout(() => document.getElementById('new-group-name').focus(), 100);
    });
    document.getElementById('btn-new-group-ok')?.addEventListener('click', () => {
      const nameEl = document.getElementById('new-group-name');
      const errEl  = document.getElementById('new-group-name-err');
      const name   = nameEl.value.trim();
      if (!name) { errEl.style.display = ''; nameEl.focus(); return; }
      const newGroup = {
        id: 'grp-' + Date.now(), name,
        memberIds: [], createdAt: new Date().toISOString().slice(0, 10),
        history: [{ actor: 'Admin', time: nowStr(), action: '建立群組', note: '' }],
      };
      groups.push(newGroup);
      saveGroups();
      closeModal('modal-new-group');
      activeGroupId = newGroup.id;
      showGroupsDetailView(newGroup.id);
      toast('群組已建立');
    });
    document.getElementById('btn-group-rename')?.addEventListener('click', () => {
      const g = getGroupById(activeGroupId);
      if (!g) return;
      const nameEl = document.getElementById('group-d-name');
      const currentName = nameEl.textContent;
      nameEl.outerHTML = `<input class="group-d-name-input" id="group-d-name" value="${esc(currentName)}" maxlength="30" />`;
      const input = document.getElementById('group-d-name');
      input.focus(); input.select();
      const save = () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
          const oldName = g.name;
          g.name = newName;
          addGroupHistory(g, `重新命名：「${oldName}」→「${newName}」`);
          saveGroups();
          renderGroupList();
          toast('群組名稱已更新');
        }
        input.outerHTML = `<div class="group-d-name" id="group-d-name">${esc(g.name)}</div>`;
      };
      input.addEventListener('blur', save, { once: true });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
    });
    document.getElementById('btn-group-copy')?.addEventListener('click', () => { if (activeGroupId) copyGroup(activeGroupId); });
    document.getElementById('btn-group-delete')?.addEventListener('click', () => { if (activeGroupId) deleteGroup(activeGroupId); });
    document.getElementById('btn-group-sync-tags')?.addEventListener('click', openGroupSync);

    // ── 返回清單 ──
    document.getElementById('btn-back-to-list')?.addEventListener('click', showGroupsListView);

    // ── 搜尋群組 ──
    document.getElementById('group-search-input')?.addEventListener('input', (e) => {
      groupListSearch = e.target.value;
      groupListPage = 0;
      renderGroupList();
    });

    // ── 更多動作 "..." ──
    document.getElementById('btn-group-more')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = document.getElementById('grp-more-wrap');
      if (!wrap || !activeGroupId) return;
      openSimpleDropdown(wrap, [
        { action:'sync', icon:'fa-solid fa-rotate', label:'從標籤同步', handler() { openGroupSync(); } },
        { action:'copy', icon:'fa-regular fa-copy', label:'複製群組', handler() { copyGroup(activeGroupId); } },
        'sep',
        { action:'delete', icon:'fa-solid fa-trash', label:'刪除群組', danger:true, handler() { deleteGroup(activeGroupId); } },
      ]);
    });
    document.getElementById('btn-sync-ok')?.addEventListener('click', confirmGroupSync);
    document.getElementById('btn-remove-note-ok')?.addEventListener('click', confirmRemoveMember);
    document.getElementById('group-member-search')?.addEventListener('input', () => {
      const g = getGroupById(activeGroupId);
      if (g) renderGroupMemberList(g);
    });

    // ── 新增成員（指定對象）──
    document.getElementById('btn-group-add-members')?.addEventListener('click', openAddToGroupModal);
    document.getElementById('atg-search')?.addEventListener('input', () => {
      const g = getGroupById(activeGroupId);
      if (g) renderAtgList(g);
    });
    document.getElementById('btn-atg-ok')?.addEventListener('click', confirmAddToGroup);

    // ── Condition filter ──────────────────────────
    document.getElementById('btn-new-group-condition')?.addEventListener('click', () => openConditionFilter(true));
    document.getElementById('btn-reapply-conditions')?.addEventListener('click', reapplyGroupConditions);

    // Add row button
    document.getElementById('btn-cf-add-row')?.addEventListener('click', () => {
      const def = CF_FIELDS[0];
      conditionRows.push({ field: def.key, op: def.ops[0].key, value: def.valType === 'select' ? (def.opts[0]?.key || '') : '' });
      renderCfRows(); resetCfPreview();
    });

    // Clear rows button
    document.getElementById('btn-cf-clear-rows')?.addEventListener('click', () => {
      conditionRows = []; renderCfRows(); resetCfPreview();
    });

    // Time unlimited toggle
    document.getElementById('cf-time-unlimited')?.addEventListener('change', (e) => {
      const dr = document.getElementById('cfb-date-range');
      if (dr) dr.style.display = e.target.checked ? 'none' : '';
    });

    // Exclude DND change — resets preview (non-realtime)
    document.getElementById('cf-exclude-dnd')?.addEventListener('change', resetCfPreview);

    // Preview toggle — updates count only on demand (non-realtime)
    document.getElementById('btn-cf-preview')?.addEventListener('click', () => {
      const area = document.getElementById('cf-preview-area');
      const btn  = document.getElementById('btn-cf-preview');
      if (!area) return;
      const show = area.style.display === 'none';
      area.style.display = show ? '' : 'none';
      btn.innerHTML = show
        ? '<i class="fa-solid fa-eye-slash"></i> 收起名單'
        : '<i class="fa-solid fa-eye"></i> 預覽名單';
      if (show) {
        const cond = readConditionsFromModal();
        const matched = filterByConditions(cond);
        document.getElementById('cf-result-count').textContent = matched.length;
        renderCfPreviewList(matched);
      }
    });

    // Add to send recipients
    document.getElementById('btn-cf-to-send')?.addEventListener('click', () => {
      const cond    = readConditionsFromModal();
      const matched = filterByConditions(cond);
      matched.forEach((m) => sendPersons.add(m.id));
      closeModal('modal-condition-filter');
      renderSendChips(); updateSendTotal();
      toast(`已加入 ${matched.length} 人至收件人`);
    });

    // Open save-as-group modal (or update existing group conditions)
    document.getElementById('btn-cf-save-group')?.addEventListener('click', () => {
      if (cfEditingGroupId) { updateGroupConditions(); return; }
      const cond    = readConditionsFromModal();
      const matched = filterByConditions(cond);
      if (!matched.length) { toast('目前條件無符合人員，請調整後再試', '#f59e0b'); return; }
      pendingConditions  = cond;
      pendingCondMembers = matched;
      document.getElementById('save-cond-group-name').value = '';
      document.getElementById('save-cond-group-err').style.display = 'none';
      const badgesStr = badgesHtml(cond);
      document.getElementById('save-cond-group-info').innerHTML =
        `符合人員 <strong>${matched.length} 人</strong>` +
        (badgesStr ? `<br>條件：<span style="display:inline-flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${badgesStr}</span>` : '');
      openModal('modal-save-cond-group');
      setTimeout(() => document.getElementById('save-cond-group-name').focus(), 100);
    });

    // Confirm save cond group
    document.getElementById('btn-save-cond-group-ok')?.addEventListener('click', confirmSaveCondGroup);
    document.getElementById('save-cond-group-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmSaveCondGroup();
    });
  }

  function bindTags() {
    document.getElementById('btn-new-tag')?.addEventListener('click', () => openTagEditModal(null));
    document.getElementById('tag-edit-save')?.addEventListener('click', saveTagEdit);
    document.getElementById('tag-edit-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveTagEdit();
    });
    document.getElementById('tag-edit-name')?.addEventListener('focus', (e) => e.target.style.borderColor = '#6366f1');
    document.getElementById('tag-edit-name')?.addEventListener('blur',  (e) => e.target.style.borderColor = '#e5e7eb');
  }

  /* ══════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    const notifyPage = document.body.dataset.notifyPage || 'all';

    bindModalClose();

    if (notifyPage === 'all') {
      // Legacy tab page — keep all tabs + lazy rendering
      bindTabs();
      bindSend();
      bindMembers();
      bindGroups();
      bindTags();
      bindLog();
      renderSendChips(); updateSendTotal(); syncChannelUI();
      renderMembersTab();
      return;
    }

    // Standalone page — init only the active module
    switch (notifyPage) {
      case 'send':
        bindSend();
        renderSendChips(); updateSendTotal(); syncChannelUI();
        break;
      case 'members':
        bindMembers();
        renderMembersTab();
        break;
      case 'groups':
        bindGroups();
        renderGroupsTab();
        break;
      case 'tags':
        bindTags();
        renderTagsTab();
        break;
      case 'settings':
        renderSettingsPage();
        break;
      case 'settings-edit': {
        bindNsPageEvents();
        const _editId = new URLSearchParams(location.search).get('id');
        if (_editId) openNsDetail(_editId);
        else location.href = 'admin-notify-settings.html';
        break;
      }
      case 'log':
        bindLog();
        break;
    }
  });
})();
