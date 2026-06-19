import { useState } from "react";

export interface AccordionItem {
  title: string;
  body: string;
}

/** Accessible accordion: keyboard-operable buttons, aria-expanded, one open at a time. */
export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gold/20 overflow-hidden rounded-xl border border-gold/30 bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `accordion-panel-${i}`;
        const btnId = `accordion-button-${i}`;
        return (
          <div key={item.title}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-maroon focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span>{item.title}</span>
                <span
                  aria-hidden="true"
                  className={`text-gold transition-transform ${isOpen ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="px-5 pb-4 text-sm leading-relaxed text-ink/80"
            >
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
