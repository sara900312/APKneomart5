import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUp, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchProductCategories,
  fetchProductsPage,
  normalizeSearchText,
  type Product,
} from "@/lib/neomart";
import { useLocale } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "المنتجات — NEOMART" },
      {
        name: "description",
        content: "تصفحي كل منتجات الجمال والعناية بالبشرة في NEOMART حسب الفئة.",
      },
    ],
  }),
  component: ProductsPage,
});

const PAGE_SIZE = 4;
const PRODUCTS_VIEW_STATE_KEY = "neomart_products_view";

type ProductsViewState = { q: string; cat: string; scrollY: number };

function readProductsViewState(): ProductsViewState {
  if (typeof window === "undefined") return { q: "", cat: "all", scrollY: 0 };
  try {
    return {
      ...{ q: "", cat: "all", scrollY: 0 },
      ...JSON.parse(sessionStorage.getItem(PRODUCTS_VIEW_STATE_KEY) || "{}"),
    };
  } catch {
    return { q: "", cat: "all", scrollY: 0 };
  }
}

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  all: { ar: "الكل", en: "All" },
  beauty_tools: { ar: "أدوات التجميل", en: "Beauty tools" },
  body_care: { ar: "العناية بالجسم", en: "Body care" },
  hair_care: { ar: "العناية بالشعر", en: "Hair care" },
  makeup: { ar: "المكياج", en: "Makeup" },
  nail_care: { ar: "العناية بالأظافر", en: "Nail care" },
  skincare: { ar: "العناية بالبشرة", en: "Skincare" },
  fragrance: { ar: "العطور", en: "perfumes" },
  perfumes: { ar: "العطور", en: "perfumes" },
  men: { ar: "للرجال", en: "Men" },
  kids: { ar: "للأطفال", en: "Kids" },
};

function categoryLabel(c: string, language: "ar" | "en") {
  const normalizedCategory = c.trim().toLowerCase();
  return CATEGORY_LABELS[normalizedCategory]?.[language] ?? c.replace(/_/g, " ");
}

function LoadingSkeletons() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      aria-label="Loading products"
    >
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <div
          key={index}
          className="glass rounded-3xl overflow-hidden border border-border/50 animate-pulse"
        >
          <div className="aspect-square bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-10 rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductsPage() {
  const navigate = useNavigate();
  const { language, direction, text } = useLocale();
  const [q, setQ] = useState(() => readProductsViewState().q);
  const [cat, setCat] = useState<string>(() => readProductsViewState().cat);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const qRef = useRef(q);
  const catRef = useRef(cat);
  const sentinelRef = useRef<HTMLDivElement>(null);
  qRef.current = q;
  catRef.current = cat;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(normalizeSearchText(q)), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const savedState = readProductsViewState();
    if (savedState.scrollY > 0)
      window.scrollTo({ top: savedState.scrollY, behavior: "instant" as ScrollBehavior });
    const updateScrollTopVisibility = () => {
      setShowScrollTop(window.scrollY > 240);
      sessionStorage.setItem(
        PRODUCTS_VIEW_STATE_KEY,
        JSON.stringify({ q: qRef.current, cat: catRef.current, scrollY: window.scrollY }),
      );
    };
    updateScrollTopVisibility();
    window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTopVisibility);
  }, []);

  useEffect(() => {
    const savedState = readProductsViewState();
    sessionStorage.setItem(
      PRODUCTS_VIEW_STATE_KEY,
      JSON.stringify({ q, cat, scrollY: savedState.scrollY }),
    );
  }, [q, cat]);

  const { data: categoryData = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: fetchProductCategories,
    staleTime: 60_000,
  });
  const categories = useMemo(() => ["all", ...categoryData], [categoryData]);

  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["products", cat, debouncedQuery],
    queryFn: ({ pageParam }) =>
      fetchProductsPage({
        offset: pageParam,
        limit: PAGE_SIZE,
        category: cat,
        search: debouncedQuery,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const products = useMemo<Product[]>(
    () => data?.pages.flatMap((page) => page.products) ?? [],
    [data],
  );

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "240px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div dir={direction} className="min-h-screen max-w-6xl mx-auto flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          {text("رجوع", "Back")}
        </button>
        <h1 className="text-sm font-bold">{text("كل المنتجات", "All products")}</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-card rounded-full border border-border/50 px-4 py-2 focus-within:border-primary/60">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={text(
              "ابحثي عن منتج، فئة، أو ماركة...",
              "Search for a product, category, or brand...",
            )}
            className="flex-1 bg-transparent outline-none text-sm py-1"
          />
          {isFetching && !isFetchingNextPage && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {text("جاري البحث", "Searching")}
            </span>
          )}
        </div>

        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/40"
              }`}
            >
              {categoryLabel(c, language)}
            </button>
          ))}
        </div>

        {isLoading && <LoadingSkeletons />}
        {!isLoading && error && (
          <div className="text-sm text-muted-foreground text-center py-8 space-y-3">
            <p>{text("تعذّر تحميل المنتجات", "Could not load products")}</p>
            <button type="button" onClick={() => void refetch()} className="text-primary font-bold">
              {text("إعادة المحاولة", "Try again")}
            </button>
          </div>
        )}
        {!isLoading && !error && products.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {text("لا توجد منتجات مطابقة", "No matching products")}
          </p>
        )}

        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div ref={sentinelRef} className="min-h-8" aria-hidden="true" />
            {isFetchingNextPage && <LoadingSkeletons />}
            {!hasNextPage && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {text("تم عرض جميع المنتجات", "All products are displayed")}
              </p>
            )}
          </>
        )}
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 end-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:opacity-90 active:scale-95"
          aria-label={text("العودة إلى أعلى المنتجات", "Back to top of products")}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
