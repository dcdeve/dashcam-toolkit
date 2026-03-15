import type { Pattern } from '../../../interfaces/patterns.js';

export const BUILTIN_PATTERNS: Pattern[] = [
  {
    id: 'viofo',
    name: 'VIOFO',
    format: "yyyyMMdd'_'HHmmss",
    regex:
      '^(?<Y>\\d{4})(?<M>\\d{2})(?<D>\\d{2})_(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})_(?<cam>[FR])(?:_(?<seq>\\d+))?\\.mp4$',
    priority: 10,
    builtin: true,
  },
  {
    id: 'blackvue',
    name: 'BlackVue',
    format: "yyyyMMdd'_'HHmmss",
    regex:
      '^(?<Y>\\d{4})(?<M>\\d{2})(?<D>\\d{2})_(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})_(?<type>[NPE])(?<cam>[FR])\\.mp4$',
    priority: 10,
    builtin: true,
  },
  {
    id: 'nextbase',
    name: 'Nextbase',
    format: "yyMMdd'_'HHmmss",
    regex:
      '^(?<Y>\\d{2})(?<M>\\d{2})(?<D>\\d{2})_(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})_(?<seq>\\d{3})_(?<cam>[FR])(?<qual>[HL])\\.(?:mp4|MP4)$',
    priority: 10,
    builtin: true,
  },
  {
    id: 'thinkware',
    name: 'Thinkware',
    format: "yyyy'_'MMdd'_'HHmmss",
    regex:
      '^(?<Y>\\d{4})_(?<M>\\d{2})(?<D>\\d{2})_(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})_(?<type>NOR|EVT|MAN|PAR)(?:_(?<cam>[FR]))?\\.mp4$',
    priority: 10,
    builtin: true,
  },
  {
    id: '70mai',
    name: '70mai',
    format: "yyyyMMdd'-'HHmmss",
    regex:
      '^(?<type>NO|EV|PA|TL)(?<Y>\\d{4})(?<M>\\d{2})(?<D>\\d{2})-(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})(?:_(?<seq>\\d+))?\\.mp4$',
    priority: 10,
    builtin: true,
  },
  {
    id: 'xiaomi-mijia',
    name: 'Xiaomi Mijia',
    format: "yyyy'_'MMdd'_'HHmmss",
    regex: '^(?<Y>\\d{4})_(?<M>\\d{2})(?<D>\\d{2})_(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})\\.mp4$',
    priority: 8,
    builtin: true,
  },
  {
    id: 'ddpai',
    name: 'DDPai',
    format: 'yyyyMMddHHmmss',
    regex:
      '^(?<Y>\\d{4})(?<M>\\d{2})(?<D>\\d{2})(?<h>\\d{2})(?<m>\\d{2})(?<s>\\d{2})_(?<seq>\\d{4})\\.mp4$',
    priority: 8,
    builtin: true,
  },
  {
    id: 'xiaomi-yi',
    name: 'Xiaomi Yi',
    format: '',
    regex: '^YDXJ(?<seq>\\d{4})\\.mp4$',
    priority: 5,
    builtin: true,
  },
  {
    id: 'generic-ts',
    name: 'Generic Timestamp',
    format: "yyyy'-'MM'-'dd'_'HH'-'mm'-'ss",
    regex:
      '^(?<Y>\\d{4})-(?<M>\\d{2})-(?<D>\\d{2})[_T](?<h>\\d{2})-(?<m>\\d{2})-(?<s>\\d{2})(?:_(?<cam>[^.]+))?\\.(?:mp4|MP4|avi|AVI|mov|MOV)$',
    priority: 1,
    builtin: true,
  },
];
