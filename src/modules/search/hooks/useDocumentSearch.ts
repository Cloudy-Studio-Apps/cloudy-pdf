import { useCallback, useEffect, useRef, useState } from "react";
import { getTextItems } from "@/modules/pdf/services/pdf.service";
import type { PdfDocument } from "@/modules/pdf/pdf.types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { DEFAULT_SEARCH_OPTIONS, EMPTY_SEARCH_RESULT, FLUSH_INTERVAL_MS, SEARCH_DEBOUNCE_MS } from "../search.constants";
import { appendMatches, buildPageText, findMatches, stepMatch, toTextRanges } from "../search.utils";
import type { DocumentSearch, PageText, SearchMatch, SearchOptions, SearchResult } from "../search.types";

/**
 * Text search over one document.
 *
 * Pages are scanned in order in the background, so the count grows while it runs
 * ("12 of 41…"); a new query or option cancels the running scan. Each page's text
 * is read once per document and cached, so refining a search doesn't re-read it.
 * On big files the first search reads every page's text from disk; that's fine,
 * since it only happens when the user asks for it.
 */
export function useDocumentSearch(pdf: PdfDocument): DocumentSearch {
  const [isOpen, setOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
  const [result, setResult] = useState<SearchResult>(EMPTY_SEARCH_RESULT);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const pageTexts = useRef(new Map<number, PageText>());
  // Makes match ids unique across searches (the viewer uses them to know when the current match changes).
  const searchCount = useRef(0);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResult(EMPTY_SEARCH_RESULT);
      return;
    }
    let cancelled = false;
    const searchId = ++searchCount.current;
    setResult({ ...EMPTY_SEARCH_RESULT, status: "searching" });

    const readPage = async (pageNumber: number): Promise<PageText> => {
      const cached = pageTexts.current.get(pageNumber);
      if (cached) return cached;
      const page = buildPageText(await getTextItems(pdf, pageNumber));
      pageTexts.current.set(pageNumber, page);
      return page;
    };

    const scan = async () => {
      let found = 0;
      let pending: SearchMatch[] = [];
      let lastFlush = performance.now();
      const flush = () => {
        const batch = pending;
        pending = [];
        lastFlush = performance.now();
        setResult((current) => appendMatches(current, batch));
      };

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await readPage(pageNumber);
        // Checked after every await: the query may have changed meanwhile.
        if (cancelled) return;
        for (const [start, end] of findMatches(page.text, debouncedQuery, options)) {
          pending.push({ id: `${searchId}:${found++}`, pageNumber, ranges: toTextRanges(page, start, end) });
        }
        if (pending.length > 0 && performance.now() - lastFlush > FLUSH_INTERVAL_MS) flush();
      }
      flush();
      setResult((current) => ({ ...current, status: "done" }));
    };

    scan().catch((error) => {
      if (!cancelled) setResult((current) => ({ ...current, status: "error", error: getErrorMessage(error) }));
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, debouncedQuery, options]);

  const open = useCallback(() => {
    setOpen(true);
    setFocusRequest((count) => count + 1);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const toggleOption = useCallback(
    (option: keyof SearchOptions) => setOptions((current) => ({ ...current, [option]: !current[option] })),
    [],
  );
  const next = useCallback(() => setResult((current) => stepMatch(current, 1)), []);
  const previous = useCallback(() => setResult((current) => stepMatch(current, -1)), []);

  return { ...result, isOpen, focusRequest, query, options, open, close, setQuery, toggleOption, next, previous };
}
