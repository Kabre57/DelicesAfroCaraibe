import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselProps = {
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
};

type CarouselContextProps = {
  contentRef: React.RefObject<HTMLDivElement | null>;
  orientation: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a <Carousel />");
  return context;
}

function Carousel({ orientation = "horizontal", className, children, ...props }: React.ComponentProps<"div"> & CarouselProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const maxScroll = orientation === "horizontal" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    const current = orientation === "horizontal" ? el.scrollLeft : el.scrollTop;
    setCanScrollPrev(current > 0);
    setCanScrollNext(current < maxScroll - 1);
  }, [orientation]);

  const scrollBy = React.useCallback(
    (dir: 1 | -1) => {
      const el = contentRef.current;
      if (!el) return;
      const delta = (orientation === "horizontal" ? el.clientWidth : el.clientHeight) * dir;
      if (orientation === "horizontal") {
        el.scrollBy({ left: delta, behavior: "smooth" });
      } else {
        el.scrollBy({ top: delta, behavior: "smooth" });
      }
      setTimeout(updateScrollState, 250);
    },
    [orientation, updateScrollState]
  );

  React.useEffect(() => {
    updateScrollState();
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState);
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollBy(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollBy(1);
      }
    },
    [scrollBy]
  );

  return (
    <CarouselContext.Provider
      value={{ contentRef, orientation, scrollPrev: () => scrollBy(-1), scrollNext: () => scrollBy(1), canScrollPrev, canScrollNext }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { contentRef, orientation } = useCarousel();

  return (
    <div ref={contentRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        className={cn(
          "flex scroll-smooth snap-x snap-mandatory",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col snap-y",
          className
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full snap-start",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  );
}

function CarouselPrevious({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
export type CarouselApi = null;

