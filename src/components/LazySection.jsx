import React from 'react';

export default function LazySection({
  children,
  fallback = null,
  minHeightClass = 'min-h-[220px]',
  rootMargin = '280px'
}) {
  const [shouldMount, setShouldMount] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        rootMargin
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <section ref={containerRef} className={shouldMount ? '' : minHeightClass}>
      {shouldMount ? children : fallback}
    </section>
  );
}
