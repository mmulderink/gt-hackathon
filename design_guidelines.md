# Design Guidelines: Enterprise KGNN RAG System for Medical Device Support

## Design Approach
**System-Based Design**: Material Design principles adapted for enterprise data applications, emphasizing information hierarchy, data density, and professional aesthetics suitable for mission-critical healthcare environments.

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, professional, excellent for data-heavy interfaces
- **Monospace Font**: JetBrains Mono - for technical data, node IDs, and code snippets
- **Hierarchy**:
  - Page Titles: text-3xl font-semibold
  - Section Headers: text-xl font-semibold
  - Card Titles: text-lg font-medium
  - Body Text: text-base font-normal
  - Metadata/Labels: text-sm font-medium
  - Technical Data: text-sm font-mono

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, and 12
- Component padding: p-6 to p-8
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Tight groupings: space-y-2

**Container Strategy**:
- Main dashboard: max-w-screen-2xl mx-auto px-8
- Cards and panels: Full width within containers
- Content wells: p-6 standard, p-8 for primary panels

## Core Layout Structure

### Primary Navigation (Left Sidebar - Fixed)
- Width: w-64
- Vertical navigation with icon + label pattern
- Sections: Query, Visualization, Evaluation, Feedback, Audit Trail
- Active state with border-l-4 accent
- Icons: Heroicons (outline style)

### Main Content Area
- Multi-panel dashboard layout using CSS Grid
- Grid structure: grid grid-cols-12 gap-6
- Responsive breakpoints: full-width mobile, 2-column tablet, 3-column desktop

### Query Interface (Primary Panel)
- Prominent search/input area: col-span-12 lg:col-span-8
- Large textarea with placeholder guidance
- Submit button: px-8 py-3 with loading state
- Recent queries sidebar: col-span-12 lg:col-span-4

## Component Library

### Cards (Primary Container)
- Structure: rounded-lg border shadow-sm
- Padding: p-6
- Header with title + action buttons: flex justify-between items-center mb-4
- Dividers between sections: border-t mt-4 pt-4

### Graph Visualization Panel
- Full-width canvas area with SVG rendering
- Node indicators: Circular badges with labels
- Path highlighting with animated stroke progression
- Side panel showing current node details: w-80 border-l p-4
- Legend: Positioned top-right with small badges

### Metrics Dashboard
- Grid layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
- Metric cards with large numbers (text-3xl font-bold) and labels
- Trend indicators with small charts (sparklines)
- Status badges: rounded-full px-3 py-1 text-xs font-medium

### Evaluation Table
- Striped rows for readability: divide-y
- Header: font-medium text-sm uppercase tracking-wide
- Cell padding: px-4 py-3
- Sortable columns with icon indicators
- Expandable rows for detailed breakdowns

### Feedback Collection Interface
- Inline feedback: Thumbs up/down icon buttons (size-6)
- Rating stars: Interactive 5-star system with hover states
- Comment textarea: min-h-32 with character count
- Submit confirmation: Toast notification pattern

### Audit Trail Timeline
- Left-aligned timeline with connecting lines
- Node bubbles: size-8 rounded-full with status indicators
- Timestamp labels: text-xs text-muted
- Expandable detail cards on click
- Confidence scores: Progress bars with percentage labels

### Real-time Updates
- Streaming response display: Typewriter effect in monospace font
- Live node traversal: Animated highlighting in graph view
- Status indicators: Pulsing dot animation (animate-pulse)
- Loading states: Skeleton screens with gradient shimmer

## Data Visualization Elements

### Graph Network View
- Force-directed layout with draggable nodes
- Node sizing based on importance/relevance
- Edge thickness indicates relationship strength
- Zoom and pan controls: Fixed position buttons
- Mini-map for navigation: Bottom-right corner, w-48 h-32

### Performance Charts
- Line charts for latency trends (area fills for confidence intervals)
- Bar charts for accuracy metrics (horizontal bars with labels)
- Donut charts for query distribution
- Height: h-64 standard for embedded charts, h-96 for featured metrics

## Interaction Patterns

### Progressive Disclosure
- Collapsed panels expandable via chevron icons
- Detailed views in slide-over panels (w-96 from right)
- Modal dialogs for critical confirmations (max-w-2xl)

### Status Communication
- Badge system: rounded-md px-2 py-1 text-xs font-medium
- Toast notifications: Fixed bottom-right, auto-dismiss after 5s
- Inline validation: Below form fields with icon + message

### Navigation Flow
- Tab navigation within sections: border-b with active indicator
- Breadcrumbs for deep navigation: text-sm with separator icons
- Keyboard shortcuts indicated with kbd styling: rounded border px-2 py-1 text-xs font-mono

## Accessibility Standards
- Focus indicators: ring-2 ring-offset-2 on interactive elements
- ARIA labels on all icon-only buttons
- Keyboard navigation throughout (Tab, Arrow keys, Enter, Escape)
- Screen reader announcements for dynamic content updates
- Minimum touch targets: min-h-10 min-w-10

## Icons
**Library**: Heroicons (outline for nav, solid for actions)
- Navigation: 24px (size-6)
- Action buttons: 20px (size-5)
- Inline icons: 16px (size-4)

## Special Features

### Enterprise Professional Touches
- Subtle borders throughout (not heavy shadows)
- Consistent rounded corners: rounded-lg for cards, rounded-md for buttons
- Minimal animation (only for loading, status changes, graph traversal)
- High information density without clutter
- Monospace for all technical identifiers
- Professional neutral palette references only in semantic terms (primary, secondary, muted, success, warning, error)

This design system creates a sophisticated, data-rich enterprise application that communicates reliability and professionalism suitable for high-stakes medical device support environments.