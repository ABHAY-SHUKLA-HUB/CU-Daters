import React from 'react';

export default function ScrollReveal({
  className = '',
  delayMs = 0,
  threshold = 0.12,
  children
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const nodeRef = React.useRef(null);

  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={nodeRef}
      className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
