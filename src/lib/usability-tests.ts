export type UsabilityReport = {
  focusableCount: number;
  imagesLazyLoaded: number;
  warnings: string[];
};

export function runUsabilityChecks(context: string = 'default'): UsabilityReport {
  const warnings: string[] = [];

  // Check reduced motion respect
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    const animated = document.querySelectorAll('[class*="animate-"]');
    if (animated.length > 0) {
      warnings.push('Usuário prefere menos animação; verifique transições suaves.');
    }
  }

  // Count focusable elements for keyboard navigation
  const focusable = Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

  // Lazy loaded images count
  const imagesLazy = Array.from(document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')).length;

  const report: UsabilityReport = {
    focusableCount: focusable.length,
    imagesLazyLoaded: imagesLazy,
    warnings,
  };

  // Log concise report
  // eslint-disable-next-line no-console
  console.info(`[Usability] ${context}:`, report);
  return report;
}