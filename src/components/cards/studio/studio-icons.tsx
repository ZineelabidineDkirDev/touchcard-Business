export type StudioIconName = "identity" | "contact" | "design" | "sections" | "links" | "catalog" | "eye" | "share" | "check" | "external" | "plus" | "phone" | "mail" | "globe" | "chat" | "spark";

const paths: Record<StudioIconName, React.ReactNode> = {
  identity: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="11" r="2.2" /><path d="M5.5 16c.6-1.6 1.9-2.4 3.5-2.4s2.9.8 3.5 2.4M14.5 10h4M14.5 13.5h3" /></>,
  contact: <path d="M6.6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.4v3a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 4.1 6.2 2.5 2.5 0 0 1 6.6 3.5Z" />,
  design: <><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.4-1 .2-2.2 1.4-2.2H17a4 4 0 0 0 4-4C21 7.1 17 3 12 3Z" /><circle cx="7.8" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="8" r="1" /></>,
  sections: <path d="M10 4a2 2 0 1 1 4 0v1.5h3.5A1.5 1.5 0 0 1 19 7v3h-1.5a2 2 0 1 0 0 4H19v3a1.5 1.5 0 0 1-1.5 1.5H14V17a2 2 0 1 0-4 0v2.5H6.5A1.5 1.5 0 0 1 5 18v-3.5h1.5a2 2 0 1 0 0-4H5V7a1.5 1.5 0 0 1 1.5-1.5H10Z" />,
  links: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  catalog: <><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  share: <><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><path d="M14 14h2v2h-2zM18 18h2M14 19h.01M18 14h2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  phone: <path d="M6.6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.4v3a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 4.1 6.2 2.5 2.5 0 0 1 6.6 3.5Z" />,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 8 8 5.5L20 8" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.500 18.400 12 21c-2.500-2.600-3.700-5.600-3.700-9S9.500 5.600 12 3Z" /></>,
  chat: <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.500 3.500V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800L12 3Zm6.500 11 .8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8.8-2.200Z" />,
};

export function StudioIcon({ name, className = "h-5 w-5" }: { name: StudioIconName; className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
