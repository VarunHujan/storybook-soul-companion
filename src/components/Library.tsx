import { motion } from "motion/react";
import { BookOpen, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { libraryBooks } from "@/lib/library";
import libraryImage from "@/assets/library.jpg";

export type BookFlight = { book: (typeof libraryBooks)[number]; rect: DOMRect };

export function LibraryBackground() {
  return <div className="library-background" aria-hidden="true"><img src={libraryImage} width={1920} height={1280} alt="" /><div className="library-scrim" /></div>;
}

export function CoverArt({ book }: { book: (typeof libraryBooks)[number] }) {
  return <span className={`library-cover cover-${book.tone}`}><span className="cover-border" /><span className="cover-edition">THE FOLIO COLLECTION</span><Feather className="cover-feather" strokeWidth={1} /><strong>{book.title}</strong><span className="cover-ornament">✧</span><small>FOLIO</small></span>;
}

export function Library({ onSelect }: { onSelect: (flight: BookFlight) => void }) {
  return <section className="library-view" aria-label="Library">
    <div className="library-heading"><span className="eyebrow">THE FOLIO COLLECTION</span><h1>Your library.</h1><p>A little curiosity, waiting between the covers.</p></div>
    <div className="library-shelves">{[0, 1].map((row) => <div className="library-shelf" key={row}>
      {libraryBooks.slice(row * 6, row * 6 + 6).map((book) => <Button key={book.id} variant="ghost" className="library-book" aria-label={`Open ${book.title}`} onClick={(event) => onSelect({ book, rect: event.currentTarget.querySelector(".library-cover")?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect() })}>
        <CoverArt book={book} /><span className="library-book-caption">{book.subtitle}</span><span className="library-book-open"><BookOpen size={12} /> Open book</span>
      </Button>)}
    </div>)}</div>
  </section>;
}

export function FlyingBook({ flight, target, onComplete }: { flight: BookFlight; target: DOMRect; onComplete: () => void }) {
  return <div className="book-flight-layer" aria-hidden="true" inert>
    <motion.div className="flying-book" initial={{ left: flight.rect.left, top: flight.rect.top, width: flight.rect.width, height: flight.rect.height, rotateY: 0, rotateZ: -4 }} animate={{ left: target.left, top: target.top, width: target.width / 2, height: target.height, rotateY: [0, 0, -160], rotateZ: 0, opacity: [1, 1, 0] }} transition={{ duration: 1.15, times: [0, 0.58, 1], ease: [0.22, 1, 0.36, 1] }} onAnimationComplete={onComplete}><CoverArt book={flight.book} /></motion.div>
  </div>;
}