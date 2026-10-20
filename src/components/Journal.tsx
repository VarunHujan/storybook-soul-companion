import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Feather,
  Leaf,
  Plus,
  RotateCcw,
  ShieldCheck,
  Square,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { BookScene } from "./BookScene";
import { copyPage, PageTurn, type TurnSnapshot } from "./PageTurn";
import { getSpreads, messageText, readBook, STORAGE_KEY, type BookTheme } from "@/lib/journal";

const themes: { id: BookTheme; title: string; short: string; caption: string }[] = [
  {
    id: "parchment",
    title: "Medieval Spellbook",
    short: "The Spellbook",
    caption: "Parchment & possibility",
  },
  {
    id: "cyberpunk",
    title: "Modern Cyberpunk",
    short: "The Cyberpunk",
    caption: "A future worth imagining",
  },
  {
    id: "japanese",
    title: "Minimalist Japanese Notebook",
    short: "The Notebook",
    caption: "Less noise. More clarity.",
  },
];

function InkFeather() {
  return (
    <svg className="ink-feather" viewBox="0 0 140 180" fill="none" aria-hidden="true">
      <path d="M34 155C46 126 61 104 84 79M43 133C25 114 45 57 101 24C125 54 110 88 80 111C69 120 53 122 43 133Z" />
      <path d="M44 126L102 28M50 112L38 98M59 97L47 77M66 82L60 57M72 72L84 73M62 93L92 91M53 110L79 106M81 56L103 54M89 44L107 43" />
      <path d="M26 158H55M36 145L34 155" />
    </svg>
  );
}

export function Journal() {
  const [theme, setTheme] = useState<BookTheme>("parchment");
  const [mock, setMock] = useState(true);
  const mockRef = useRef(mock);
  mockRef.current = mock;
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: () => ({ mock: mockRef.current }) }),
    [],
  );
  const [initialMessages] = useState(readBook);
  const [saveError, setSaveError] = useState("");
  const { messages, sendMessage, status, stop, setMessages, regenerate, error, clearError } =
    useChat({
      id: "folio-book",
      messages: initialMessages,
      transport,
      onFinish: ({ messages: completed }) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
        } catch {
          setSaveError("This browser couldn’t save your book.");
        }
      },
    });
  const spreads = getSpreads(messages);
  const [page, setPage] = useState(
    initialMessages.length ? getSpreads(initialMessages).length - 1 : 0,
  );
  const [turning, setTurning] = useState(false);
  const [turnSnapshot, setTurnSnapshot] = useState<TurnSnapshot | null>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const turnLock = useRef(false);
  const finishTurn = useCallback(() => {
    turnLock.current = false;
    setTurning(false);
    setTurnSnapshot(null);
  }, []);
  const [draft, setDraft] = useState("");
  const [mobilePage, setMobilePage] = useState("question");
  const [clearOpen, setClearOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = status === "submitted" || status === "streaming";
  const spread = spreads[page];
  const answer = spread?.answer;
  const isNew = !spread;
  const currentTheme = themes.find((t) => t.id === theme) ?? themes[0];
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      setSaveError("This browser couldn’t save your book.");
    }
  }, [messages]);
  useEffect(() => {
    if (!busy && !clearOpen && mobilePage === "question")
      textarea.current?.focus({ preventScroll: true });
  }, [busy, page, clearOpen, mobilePage]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const flip = (next: number) => {
    if (turnLock.current || busy || next === page || next < 0 || next > spreads.length) return;
    const direction = next > page ? "forward" : "backward";
    const front = pagesRef.current?.querySelector<HTMLElement>(
      direction === "forward" ? ".right-page" : ".left-page",
    );
    const stationary = pagesRef.current?.querySelector<HTMLElement>(
      direction === "forward" ? ".left-page" : ".right-page",
    );
    if (front && stationary && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      turnLock.current = true;
      setTurning(true);
      setTurnSnapshot({ direction, front: copyPage(front), stationary: copyPage(stationary) });
      // Fallback for a background tab or an interrupted CSS animation.
      timers.current.push(setTimeout(finishTurn, 1200));
    }
    setPage(next);
    setDraft("");
    setMobilePage("question");
  };
  const submit = ({ text }: { text: string }) => {
    if (!text.trim() || busy || turning) return;
    clearError();
    setPage(spreads.length);
    setDraft("");
    setMobilePage("answer");
    void sendMessage({ text: text.trim() });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(messageText(answer));
      setCopied(true);
      timers.current.push(setTimeout(() => setCopied(false), 1800));
    } catch {
      setSaveError("Copy wasn’t available. You can select the answer to copy it.");
    }
  };
  const pointer = useRef(0);
  return (
    <TooltipProvider delayDuration={250}>
      <main className={`folio-app theme-${theme}`}>
        <header className="app-header">
          <a href="/" className="brand" aria-label="Folio home">
            <span className="brand-mark">
              <BookOpen strokeWidth={1.3} />
            </span>
            <span>
              folio<span className="brand-dot">.</span>
            </span>
            <span className="brand-divider" />
            <span className="brand-description">A conversation, unfolding.</span>
          </a>
          <div className="header-actions">
            <div className="demo-control">
              <span className="status-dot" />
              <label htmlFor="demo-mode">Demo mode</label>
              <Switch id="demo-mode" checked={mock} disabled={busy} onCheckedChange={setMock} />
            </div>
            <span className="header-divider" />
            <Button
              variant="ghost"
              className="new-book"
              onClick={() => setClearOpen(true)}
              disabled={busy}
            >
              <Plus /> New book
            </Button>
          </div>
        </header>
        <section className="journal-heading">
          <div className="eyebrow">
            <span /> YOUR THOUGHTS, BOUND TOGETHER <span />
          </div>
          <h1>Conversation Journal</h1>
          <p>Every good conversation begins with a little curiosity.</p>
        </section>
        <div className="book-navigation">
          <div>
            <BookOpen size={14} />
            <span>{currentTheme?.short}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={busy}>
                Entry {String(page + 1).padStart(2, "0")} <ChevronDown size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {spreads.map((s, i) => (
                <DropdownMenuItem key={s.question.id} onSelect={() => flip(i)}>
                  Entry {i + 1} · {messageText(s.question).slice(0, 36)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={() => flip(spreads.length)}>
                <Plus size={14} /> Blank entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mobile-pages">
          <Button
            variant={mobilePage === "question" ? "default" : "ghost"}
            onClick={() => setMobilePage("question")}
          >
            Question
          </Button>
          <Button
            variant={mobilePage === "answer" ? "default" : "ghost"}
            onClick={() => setMobilePage("answer")}
          >
            Answer
          </Button>
        </div>
        <section
          className={`book-stage ${turning ? "is-turning" : ""}`}
          aria-label="Open conversation book"
          onPointerDown={(e) => {
            pointer.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if ((e.target as HTMLElement).closest('textarea,button,a,[role="switch"]')) return;
            const d = e.clientX - pointer.current;
            if (Math.abs(d) > 80) flip(page + (d < 0 ? 1 : -1));
          }}
        >
          <div className="book-cover" />
          <BookScene theme={theme} />
          <div className="page-edges" />
          <div ref={pagesRef} className={`book-pages show-${mobilePage}`} inert={turning}>
            <article className="book-page left-page">
              <div className="page-topline">
                <span>THE QUESTION</span>
                <Feather size={15} strokeWidth={1.3} />
              </div>
              <div className="page-rule" />
              <div className="question-area">
                <div className="entry-label">ENTRY {String(page + 1).padStart(2, "0")}</div>
                <h2>{isNew ? "What’s on your mind?" : "A thought, put to paper."}</h2>
                {isNew ? (
                  <p className="page-intro">
                    An idea to explore. A question to untangle.
                    <br />A story waiting to be written.
                  </p>
                ) : (
                  <div className="past-question">
                    <Message from="user">
                      <MessageContent>
                        <MessageResponse>{messageText(spread.question)}</MessageResponse>
                      </MessageContent>
                    </Message>
                  </div>
                )}
                {isNew && (
                  <PromptInput onSubmit={submit} className="book-composer">
                    <PromptInputTextarea
                      ref={textarea}
                      aria-label="Your question"
                      placeholder="Dear Folio, I’ve been wondering…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      disabled={busy || turning}
                      autoFocus
                    />
                    <PromptInputFooter className="composer-footer">
                      <span className="write-label">
                        <Feather size={14} /> Write into book
                      </span>
                      <PromptInputSubmit
                        status={status}
                        onStop={() => void stop()}
                        disabled={(!draft.trim() && !busy) || turning}
                        title={busy ? "Stop writing" : "Write into book"}
                      >
                        {busy ? <Square size={16} /> : <ArrowRight size={18} />}
                      </PromptInputSubmit>
                    </PromptInputFooter>
                  </PromptInput>
                )}
                {!isNew && (
                  <Button
                    className="continue-button"
                    variant="outline"
                    onClick={() => flip(spreads.length)}
                    disabled={busy}
                  >
                    <Feather /> Continue on a new page <ArrowRight />
                  </Button>
                )}
              </div>
              {isNew && (
                <div className="suggestions">
                  <span>A LITTLE INSPIRATION</span>
                  <div>
                    {[
                      {
                        icon: Leaf,
                        label: "Find some perspective",
                        prompt: "Help me find perspective when I’m feeling overwhelmed.",
                      },
                      {
                        icon: Feather,
                        label: "Write something creative",
                        prompt: "Write a short story about finding beauty in everyday things.",
                      },
                      {
                        icon: BookOpen,
                        label: "Learn something new",
                        prompt: "Explain why the sky changes color at sunset.",
                      },
                    ].map((s) => (
                      <Button
                        key={s.label}
                        variant="ghost"
                        className="suggestion"
                        onClick={() => {
                          setDraft(s.prompt);
                          textarea.current?.focus();
                        }}
                        disabled={busy}
                      >
                        <s.icon size={13} />
                        {s.label}
                        <ArrowRight size={12} />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="page-bottom">
                <span>YOUR WORDS MATTER.</span>
                <span>{page * 2 + 1}</span>
              </div>
            </article>
            <article className="book-page right-page">
              <span className="bookmark-ribbon" />
              <div className="page-topline">
                <span>THE RESPONSE</span>
                <span className="folio-signature">Folio</span>
              </div>
              <div className="page-rule" />
              {answer || (busy && page === spreads.length - 1) ? (
                <Conversation className="answer-scroll">
                  <ConversationContent className="answer-content">
                    {busy && !messageText(answer) ? (
                      <div className="writing-state">
                        <Feather size={24} />
                        <Shimmer>Gathering a thought…</Shimmer>
                      </div>
                    ) : (
                      <Message from="assistant">
                        <MessageContent>
                          {answer?.parts.map((part, i) =>
                            part.type === "text" ? (
                              <MessageResponse key={i}>{part.text}</MessageResponse>
                            ) : part.type === "reasoning" ? (
                              <details className="reasoning" key={i}>
                                <summary>Between the lines</summary>
                                <MessageResponse>{part.text}</MessageResponse>
                              </details>
                            ) : null,
                          )}
                        </MessageContent>
                      </Message>
                    )}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
              ) : (
                <div className="answer-empty">
                  <InkFeather />
                  <h2>
                    A blank page.
                    <br />
                    Endless possibilities.
                  </h2>
                  <p>
                    Your words on the left.
                    <br />A new perspective on the right.
                  </p>
                  <div className="ornament">
                    <span />✧<span />
                  </div>
                </div>
              )}
              {(error || saveError) && (
                <p className="book-error" role="alert">
                  {error?.message || saveError}
                </p>
              )}
              <div className="answer-actions">
                {answer && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Copy response"
                          onClick={() => void copy()}
                        >
                          {copied ? <Check /> : <Copy />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{copied ? "Copied" : "Copy response"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Regenerate response"
                          disabled={busy}
                          onClick={() => {
                            clearError();
                            void regenerate({ messageId: answer.id });
                          }}
                        >
                          <RotateCcw />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Regenerate response</TooltipContent>
                    </Tooltip>
                  </>
                )}
                {busy && (
                  <Button variant="ghost" size="sm" onClick={() => void stop()}>
                    <Square /> Stop
                  </Button>
                )}
              </div>
              <div className="page-bottom">
                <span>
                  {busy ? "INK IS STILL DRYING…" : "A LITTLE WISDOM, ONE PAGE AT A TIME."}
                </span>
                <span>{page * 2 + 2}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="page-curl"
                    variant="ghost"
                    size="icon"
                    aria-label="Flip to next page"
                    onClick={() => flip(page + 1)}
                    disabled={busy || isNew}
                  >
                    <ArrowRight />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Turn the page</TooltipContent>
              </Tooltip>
            </article>
          </div>
          {turnSnapshot && <PageTurn snapshot={turnSnapshot} pages={pagesRef.current} onComplete={finishTurn} />}
          <Button
            variant="ghost"
            size="icon"
            className="outside-nav previous"
            aria-label="Previous entry"
            disabled={page === 0 || busy || turning}
            onClick={() => flip(page - 1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="outside-nav next"
            aria-label="Next entry"
            disabled={isNew || busy || turning}
            onClick={() => flip(page + 1)}
          >
            <ArrowRight />
          </Button>
        </section>
        <div className="below-book">
          <span>
            <ShieldCheck size={13} /> Saved only in this browser
          </span>
          <div className="spread-dots">
            {Array.from({ length: Math.min(spreads.length + 1, 8) }, (_, i) => (
              <Button
                key={i}
                variant="ghost"
                className={`spread-dot ${page === i ? "active" : ""}`}
                aria-label={`Go to entry ${i + 1}`}
                onClick={() => flip(i)}
                disabled={busy}
              />
            ))}
          </div>
          <span>SPREAD {String(page + 1).padStart(2, "0")}</span>
        </div>
        <section className="theme-section" aria-label="Book themes">
          <div className="theme-label">
            <span /> A DIFFERENT COVER, THE SAME CURIOSITY <span />
          </div>
          <div className="theme-list">
            {themes.map((t) => (
              <Button
                variant="ghost"
                key={t.id}
                className={`theme-choice ${theme === t.id ? "selected" : ""}`}
                aria-label={t.title}
                onClick={() => setTheme(t.id)}
              >
                <span className={`theme-preview preview-${t.id}`}>
                  <span />
                  <span />
                  {t.id === "parchment" ? (
                    <Feather />
                  ) : t.id === "cyberpunk" ? (
                    <span className="cyber-glyph">⌘</span>
                  ) : (
                    <Leaf />
                  )}
                </span>
                <span>
                  <strong>{t.short}</strong>
                  <small>{t.caption}</small>
                </span>
                {theme === t.id && <Check className="theme-check" />}
              </Button>
            ))}
          </div>
        </section>
        <footer className="app-footer">
          <span>Made for the wandering mind.</span>
          <span>
            <span className="footer-star">✧</span> A quieter kind of conversation.
          </span>
        </footer>
        <Dialog open={clearOpen} onOpenChange={setClearOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Begin a new book?</DialogTitle>
              <DialogDescription>
                This clears the conversation saved in this browser. Your current entries cannot be
                recovered.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClearOpen(false)}>
                Keep this book
              </Button>
              <Button
                onClick={() => {
                  setMessages([]);
                  setPage(0);
                  setDraft("");
                  clearError();
                  setClearOpen(false);
                  finishTurn();
                }}
              >
                Start a new book
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
