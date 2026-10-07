// 标签配色工具
// 按标签名做稳定哈希映射到固定颜色，保证同一标签在任何页面、任何时候
// 显示的颜色都一致，且不依赖标签出现的顺序或是否已持久化

const TAG_PALETTE = [
  { bg: '#ecf5ff', fg: '#337ecc' }, // 蓝
  { bg: '#f0f9eb', fg: '#529b2e' }, // 绿
  { bg: '#fdf6ec', fg: '#b88230' }, // 橙
  { bg: '#fef0f0', fg: '#c45656' }, // 红
  { bg: '#f9f0ff', fg: '#7c3aed' }, // 紫
  { bg: '#edf0ff', fg: '#4f46e5' }, // 靛
  { bg: '#f0fdfa', fg: '#0d9488' }, // 青
  { bg: '#fdf2f8', fg: '#a21caf' }, // 洋红
  { bg: '#f8fafc', fg: '#475569' }, // 石板
  { bg: '#fff7ed', fg: '#c2410c' }, // 深橙
  { bg: '#f0fdf4', fg: '#15803d' }, // 深绿
  { bg: '#fef2f2', fg: '#b91c1c' }, // 深红
]

// djb2 字符串哈希，结果为无符号整数
const hashTag = str => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

// 取标签对应的配色
export const tagColor = tag => {
  if (!tag) return TAG_PALETTE[0]
  return TAG_PALETTE[hashTag(String(tag)) % TAG_PALETTE.length]
}

// 生成可直接绑定到 el-tag 的 style
// active 为选中态，使用实心填充
export const tagStyle = (tag, active = false) => {
  const { bg, fg } = tagColor(tag)
  return active
    ? { backgroundColor: fg, borderColor: fg, color: '#ffffff' }
    : { backgroundColor: bg, borderColor: bg, color: fg }
}
