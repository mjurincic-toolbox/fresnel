// tslint:disable:completed-docs

import { MediaBreakpointProps } from "./Media"

export function createSortedBreakpoints(breakpoints: {
  [key: string]: number
}): string[] {
  return Object.keys(breakpoints)
    .map(breakpoint => [breakpoint, breakpoints[breakpoint]])
    .sort((a, b) => (a[1] < b[1] ? -1 : 1))
    .map(breakpointAndValue => breakpointAndValue[0] as string)
}

export function createAtRanges(sortedBreakpoints: string[]) {
  const atRanges = new Map<string, MediaBreakpointProps<any>>()
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < sortedBreakpoints.length; i++) {
    const from = sortedBreakpoints[i]
    const to = sortedBreakpoints[i + 1]
    if (to) {
      atRanges.set(from, { between: [from, to] })
    } else {
      atRanges.set(from, { greaterThanOrEqual: from })
    }
  }
  return atRanges
}

function findNextBreakpoint(sortedBreakpoints: string[], breakpoint: string) {
  const nextBreakpoint =
    sortedBreakpoints[sortedBreakpoints.indexOf(breakpoint) + 1]
  if (!nextBreakpoint) {
    throw new Error(`There is no breakpoint larger than ${breakpoint}`)
  }
  return nextBreakpoint
}

export function createAtBreakpointQueries(
  breakpoints: {
    [key: string]: number
  },
  sortedBreakpoints: string[],
  atRanges: Map<string, MediaBreakpointProps<any>>
): { [key: string]: string } {
  return Array.from(atRanges.entries()).reduce(
    (queries, [k, v]) => ({
      ...queries,
      [k]: createBreakpointQuery(breakpoints, sortedBreakpoints, v),
    }),
    {}
  )
}

export function createBreakpointQuery(
  breakpoints: {
    [key: string]: number
  },
  sortedBreakpoints: string[],
  breakpointProps: MediaBreakpointProps<string>
): string {
  if (breakpointProps.lessThan) {
    const width = breakpoints[breakpointProps.lessThan]
    return `(max-width:${width - 1}px)`
  } else if (breakpointProps.greaterThan) {
    const width =
      breakpoints[
        findNextBreakpoint(sortedBreakpoints, breakpointProps.greaterThan)
      ]
    return `(min-width:${width}px)`
  } else if (breakpointProps.greaterThanOrEqual) {
    const width = breakpoints[breakpointProps.greaterThanOrEqual]
    return `(min-width:${width}px)`
  } else if (breakpointProps.between) {
    // TODO: This is the only useful breakpoint to negate, but we’ll
    //       we’ll see when/if we need it. We could then also decide
    //       to add `oustide`.
    const fromWidth = breakpoints[breakpointProps.between[0]]
    const toWidth = breakpoints[breakpointProps.between[1]]
    return `(min-width:${fromWidth}px) and (max-width:${toWidth - 1}px)`
  }
  throw new Error(
    `Unexpected breakpoint props: ${JSON.stringify(breakpointProps)}`
  )
}

export function shouldRender(
  breakpoints: {
    [key: string]: number
  },
  sortedBreakpoints: string[],
  breakpointProps: MediaBreakpointProps<string>,
  onlyRenderAt: string[]
): boolean {
  if (breakpointProps.at) {
    const from = breakpointProps.at
    const fromIndex = sortedBreakpoints.indexOf(breakpointProps.at)
    const to = sortedBreakpoints[fromIndex + 1]
    if (to) {
      breakpointProps = { between: [from, to] }
    } else {
      breakpointProps = {
        greaterThanOrEqual: from,
      }
    }
  }
  if (breakpointProps.lessThan) {
    const width = breakpoints[breakpointProps.lessThan]
    const lowestAllowedWidth = Math.min(
      ...onlyRenderAt.map(breakpoint => breakpoints[breakpoint])
    )
    if (lowestAllowedWidth >= width) {
      return false
    }
  } else if (breakpointProps.greaterThan) {
    const width =
      breakpoints[
        findNextBreakpoint(sortedBreakpoints, breakpointProps.greaterThan)
      ]
    const highestAllowedWidth = Math.max(
      ...onlyRenderAt.map(breakpoint => breakpoints[breakpoint])
    )
    if (highestAllowedWidth < width) {
      return false
    }
  } else if (breakpointProps.greaterThanOrEqual) {
    const width = breakpoints[breakpointProps.greaterThanOrEqual]
    const highestAllowedWidth = Math.max(
      ...onlyRenderAt.map(breakpoint => breakpoints[breakpoint])
    )
    if (highestAllowedWidth < width) {
      return false
    }
  } else if (breakpointProps.between) {
    // TODO: This is the only useful breakpoint to negate, but we’ll
    //       we’ll see when/if we need it. We could then also decide
    //       to add `oustide`.
    const fromWidth = breakpoints[breakpointProps.between[0]]
    const toWidth = breakpoints[breakpointProps.between[1]]
    const allowedWidths = onlyRenderAt.map(
      breakpoint => breakpoints[breakpoint]
    )
    if (
      Math.max(...allowedWidths) < fromWidth ||
      Math.min(...allowedWidths) >= toWidth
    ) {
      return false
    }
  }
  return true
}
