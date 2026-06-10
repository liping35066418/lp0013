import { ModerationResult } from '../../shared/types.js';

const VIOLATION_KEYWORDS = [
  { keyword: '枪支', level: 'high', suggestion: '内容涉及违禁武器' },
  { keyword: '弹药', level: 'high', suggestion: '内容涉及违禁武器' },
  { keyword: '毒品', level: 'high', suggestion: '内容涉及违禁物品' },
  { keyword: '走私', level: 'high', suggestion: '内容涉及非法交易' },
  { keyword: '假币', level: 'high', suggestion: '内容涉及违法行为' },
  { keyword: '发票', level: 'medium', suggestion: '内容可能涉及违规财务票据' },
  { keyword: '办证', level: 'medium', suggestion: '内容可能涉及违规证件办理' },
  { keyword: '代考', level: 'high', suggestion: '内容涉及违规服务' },
  { keyword: '外挂', level: 'medium', suggestion: '内容涉及违规软件' },
  { keyword: '色情', level: 'high', suggestion: '内容涉及违规色情信息' },
  { keyword: '赌博', level: 'high', suggestion: '内容涉及违规赌博信息' },
  { keyword: '传销', level: 'high', suggestion: '内容涉及违规传销' },
  { keyword: '违禁品', level: 'high', suggestion: '内容涉及违禁物品' },
  { keyword: '军刀', level: 'medium', suggestion: '内容可能涉及管制刀具' },
  { keyword: '管制刀具', level: 'high', suggestion: '内容涉及管制刀具' },
  { keyword: '窃听', level: 'high', suggestion: '内容涉及违规器材' },
  { keyword: '高仿', level: 'medium', suggestion: '内容可能涉及假冒商品' },
  { keyword: '精仿', level: 'medium', suggestion: '内容可能涉及假冒商品' },
  { keyword: '盗版', level: 'medium', suggestion: '内容可能涉及侵权商品' },
  { keyword: '水货', level: 'low', suggestion: '建议明确货源渠道' },
];

export function checkViolation(text: string): ModerationResult {
  if (!text) {
    return { isViolation: false, matchedKeywords: [], suggestion: '' };
  }

  const matched: { keyword: string; level: string; suggestion: string }[] = [];

  for (const rule of VIOLATION_KEYWORDS) {
    if (text.includes(rule.keyword)) {
      matched.push(rule);
    }
  }

  if (matched.length === 0) {
    return { isViolation: false, matchedKeywords: [], suggestion: '' };
  }

  const hasHigh = matched.some(m => m.level === 'high');
  const keywords = matched.map(m => m.keyword);
  const suggestions = [...new Set(matched.map(m => m.suggestion))].join('；');

  return {
    isViolation: hasHigh || matched.length >= 2,
    matchedKeywords: keywords,
    suggestion: `检测到敏感词：${keywords.join('、')}。${suggestions}。${hasHigh ? '已自动下架。' : '建议人工复核。'}`,
  };
}
