/**
 * Paper size configuration for print scaling
 */
export interface PaperScaleConfig {
  scaleFactor: number
  shiftTextSize: string
  shiftTimeSize: string
}

const PAPER_SCALE_CONFIG: Record<string, PaperScaleConfig> = {
  letter: { scaleFactor: 0.94, shiftTextSize: '11px', shiftTimeSize: '10px' },
  legal: { scaleFactor: 0.94, shiftTextSize: '11px', shiftTimeSize: '10px' },
  tabloid: { scaleFactor: 1.25, shiftTextSize: '16px', shiftTimeSize: '14px' },
  a4: { scaleFactor: 0.94, shiftTextSize: '11px', shiftTimeSize: '10px' },
}

const DEFAULT_PAPER_SIZE = 'letter'

export const HOUR_HEIGHT = 50

/**
 * Get paper scale configuration for a given paper size
 */
export function getPaperConfig(paperSize: string): PaperScaleConfig {
  return PAPER_SCALE_CONFIG[paperSize] || PAPER_SCALE_CONFIG[DEFAULT_PAPER_SIZE]
}
