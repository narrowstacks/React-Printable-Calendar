import { getPaperConfig, HOUR_HEIGHT } from '../config/printConfig'

/**
 * Apply print-friendly styles to a calendar element for PDF generation.
 * html2canvas does not apply @media print CSS, so we must apply styles directly.
 */
export function applyPrintStyles(element: HTMLElement, paperSize: string): void {
  const config = getPaperConfig(paperSize)
  const scaleFactor = config.scaleFactor
  const newHourHeight = HOUR_HEIGHT * scaleFactor

  // Root element styling
  applyRootStyles(element)

  // Inner container padding
  applyInnerContainerStyles(element)

  // Shift block styling
  applyShiftBlockStyles(element, config)

  // Header styling
  applyHeaderStyles(element)

  // Scale time-based elements
  scaleTimeElements(element, scaleFactor, newHourHeight)
}

function applyRootStyles(element: HTMLElement): void {
  element.style.padding = '4px'
  element.style.margin = '0'
  element.style.backgroundColor = 'white'
  element.style.boxShadow = 'none'
  element.style.borderRadius = '0'
}

function applyInnerContainerStyles(element: HTMLElement): void {
  const innerContainer = element.querySelector(':scope > div') as HTMLElement
  if (innerContainer) {
    innerContainer.style.padding = '4px'
  }
}

function applyShiftBlockStyles(
  element: HTMLElement,
  config: { shiftTextSize: string; shiftTimeSize: string }
): void {
  const shiftBlocks = element.querySelectorAll('.shift-block') as NodeListOf<HTMLElement>

  shiftBlocks.forEach((block) => {
    block.style.overflow = 'visible'
    block.style.paddingTop = '4px'

    // Style children
    const children = block.querySelectorAll('*') as NodeListOf<HTMLElement>
    children.forEach((child) => {
      child.style.overflow = 'visible'
      child.style.lineHeight = '1.3'
    })

    // Apply text sizes
    const textElements = block.querySelectorAll('div, span') as NodeListOf<HTMLElement>
    textElements.forEach((el) => {
      if (el.classList.contains('font-semibold') || el.classList.contains('font-medium')) {
        el.style.fontSize = config.shiftTextSize
      } else if (el.classList.contains('text-xs') || el.classList.contains('text-sm')) {
        el.style.fontSize = config.shiftTimeSize
      }
    })
  })
}

function applyHeaderStyles(element: HTMLElement): void {
  const header = element.querySelector('h2') as HTMLElement
  if (header) {
    header.style.fontSize = '24px'
    header.style.fontWeight = '700'
    header.style.marginBottom = '12px'
    header.style.marginTop = '0'
    header.style.paddingTop = '0'
    header.style.textAlign = 'center'
  }

  const headerContainer = element.querySelector('.mb-6') as HTMLElement
  if (headerContainer) {
    headerContainer.style.marginBottom = '4px'
  }
}

function scaleTimeElements(element: HTMLElement, scaleFactor: number, newHourHeight: number): void {
  // Scale time axis rows
  const timeSlots = element.querySelectorAll(
    ".week-grid-container [style*='height: 50px']"
  ) as NodeListOf<HTMLElement>
  timeSlots.forEach((slot) => {
    slot.style.height = `${newHourHeight}px`
  })

  // Scale day column containers (minHeight)
  const dayColumnGrids = element.querySelectorAll('.day-column > .relative') as NodeListOf<HTMLElement>
  dayColumnGrids.forEach((grid) => {
    const currentMinHeight = grid.style.minHeight
    if (currentMinHeight) {
      const value = parseFloat(currentMinHeight)
      grid.style.minHeight = `${value * scaleFactor}px`
    }
  })

  // Scale hour divider positions and heights
  const hourDividers = element.querySelectorAll('.day-column .absolute.border-b') as NodeListOf<HTMLElement>
  hourDividers.forEach((divider) => {
    scaleElementPosition(divider, scaleFactor)
  })

  // Scale shift block positions
  const shiftBlocks = element.querySelectorAll('.shift-block') as NodeListOf<HTMLElement>
  shiftBlocks.forEach((block) => {
    scaleElementPosition(block, scaleFactor)
  })
}

function scaleElementPosition(element: HTMLElement, scaleFactor: number): void {
  const currentTop = element.style.top
  const currentHeight = element.style.height

  if (currentTop) {
    const topValue = parseFloat(currentTop)
    element.style.top = `${topValue * scaleFactor}px`
  }
  if (currentHeight) {
    const heightValue = parseFloat(currentHeight)
    element.style.height = `${heightValue * scaleFactor}px`
  }
}
