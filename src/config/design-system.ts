export const utils = {
  // CSS variable helpers
  cssVar: (name: string) => `var(--${name})`,
  
  // Gradient text
  gradientText: (colors: string[]) => ({
    background: `linear-gradient(135deg, ${colors.join(', ')})`,
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    backgroundClip: 'text',
  } as Record<string, string>),
  
  // Gradient border - returns CSS string for use with style prop
  gradientBorder: (colors: string[], width: string = '1px') => `
    position: relative;
    isolation: isolate;
  `.trim() + `
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: ${width};
      background: linear-gradient(135deg, ${colors.join(', ')});
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
  `.trim(),
  
  // Focus ring - returns CSS string
  focusRing: (color = 'primary') => `
    outline: none;
  `.trim() + `
    &:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px var(--color-${color});
    }
  `.trim(),
  
  // Glass morphism
  glass: {
    background: 'rgba(20, 20, 27, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(58, 58, 74, 0.5)',
  },
  
  glassStrong: {
    background: 'rgba(20, 20, 27, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(58, 58, 74, 0.3)',
  },
  
  // Text gradient
  textGradient: (from: string, to: string, direction = '135deg') => ({
    background: `linear-gradient(${direction}, ${from} 0%, ${to} 100%)`,
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    backgroundClip: 'text',
  } as Record<string, string>),
  
  // Glow effect
  glow: (color: 'primary' | 'accent' | 'secondary' = 'primary', intensity: 'subtle' | 'normal' | 'strong' = 'normal') => {
    const glows: Record<'subtle' | 'normal' | 'strong', string> = {
      subtle: '0 0 10px',
      normal: '0 0 20px',
      strong: '0 0 40px',
    };
    const colors: Record<'primary' | 'accent' | 'secondary', string> = {
      primary: 'rgba(255, 138, 0, 0.3)',
      accent: 'rgba(0, 229, 255, 0.3)',
      secondary: 'rgba(255, 183, 3, 0.3)',
    };
    const baseGlow = glows[intensity];
    const strongGlow = baseGlow.replace('20px', '40px').replace('10px', '20px');
    const baseColor = colors[color];
    const weakColor = baseColor.replace('0.3', '0.15');
    return {
      boxShadow: `${baseGlow} ${baseColor}, ${strongGlow} ${weakColor}`,
    };
  },
};