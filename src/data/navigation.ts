export interface NavChild {
  label: string
  to: string
}
export interface NavItem {
  label: string
  to: string
  children?: NavChild[]
}

// Top-level nav. Most destinations are stubs at this stage — links resolve
// once the corresponding page exists in src/pages/. The nav structure is
// defined here so the layout can render the full IA even before pages are
// authored.
export const mainNav: NavItem[] = [
  {
    label: 'About',
    to: '/about/',
    children: [
      { label: 'About TC 12', to: '/about/' },
      { label: 'History', to: '/history/' },
      { label: 'Business Plan', to: '/business-plan/' },
      { label: 'Working Groups', to: '/groups/' },
      { label: 'Liaisons', to: '/liaisons/' },
      { label: 'National Bodies', to: '/national-bodies/' },
      { label: 'FAQ', to: '/faq/' },
      { label: 'Contact', to: '/contact/' },
    ],
  },
  {
    label: 'Our Work',
    to: '/standards/',
    children: [
      { label: 'Standards', to: '/standards/' },
      { label: 'Projects', to: '/projects/' },
    ],
  },
  {
    label: 'Meetings',
    to: '/meetings/',
  },
  {
    label: 'Members',
    to: '/members/',
  },
  {
    label: 'Decisions',
    to: '/decisions/',
  },
]
