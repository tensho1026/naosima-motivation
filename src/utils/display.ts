const categoryLabels: Record<string, string> = {
  MONEY: 'お金',
  WORK: '仕事',
  SKILL: 'スキル',
  LIFESTYLE: '暮らし',
  NAOSHIMA: '直島',
  CONNECTION: 'つながり',
}

const readyStatusLabels: Record<string, string> = {
  NOT_READY: '準備中',
  ALMOST_READY: 'もう少し',
  READY: '移住可能',
}

export function categoryLabel(value: string) {
  return categoryLabels[value] ?? value
}

export function readyStatusLabel(value: string) {
  return readyStatusLabels[value] ?? value.replaceAll('_', ' ')
}

export function skillStatusLabel(value: string) {
  return (
    {
      LEARNING: '学習中',
      LOCKED: '未着手',
      ACHIEVED: '達成済み',
    }[value] ?? value
  )
}

export function incomeTypeLabel(value: string) {
  return (
    {
      SALARY: '給与',
      FREELANCE: 'フリーランス',
      SIDE_JOB: '副業',
      PRODUCT: '商品・サービス',
      OTHER: 'その他',
    }[value] ?? value
  )
}

export function bucketKindLabel(value: string) {
  return (
    {
      BUCKET: '直島でやりたいこと',
      DREAM: '100の夢',
      PROJECT: '計画',
    }[value] ?? value
  )
}

export function audioKindLabel(value: string) {
  return { VOICE_MEMO: '音声メモ', AMBIENCE: '環境音' }[value] ?? value
}
