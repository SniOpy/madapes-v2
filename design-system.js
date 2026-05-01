export const designSystem = {
  colors: {
    primary: {
      DEFAULT: "#7C3AED",
      light: "#A855F7",
      dark: "#5B21B6",
      soft: "rgba(124, 58, 237, 0.12)",
      glow: "rgba(124, 58, 237, 0.45)",
    },

    secondary: {
      DEFAULT: "#22D3EE",
      light: "#67E8F9",
      dark: "#0891B2",
      soft: "rgba(34, 211, 238, 0.12)",
    },

    background: {
      DEFAULT: "#08080D",
      dark: "#050509",
      elevated: "#121217",
      card: "#16161D",
      light: "#F8F8FB",
    },

    border: {
      DEFAULT: "#24242A",
      soft: "rgba(255,255,255,0.08)",
      active: "rgba(124,58,237,0.55)",
    },

    text: {
      primary: "#FFFFFF",
      secondary: "#A1A1AA",
      muted: "#71717A",
      dark: "#111111",
    },

    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
  },

  typography: {
    fontFamily: {
      primary: "'Poppins', sans-serif",
      secondary: "'Inter', sans-serif",
    },

    fontSize: {
      h1: "56px",
      h2: "40px",
      h3: "28px",
      h4: "22px",
      body: "16px",
      small: "14px",
      xs: "12px",
    },

    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: "1.05",
      heading: "1.15",
      body: "1.7",
    },

    letterSpacing: {
      tight: "-1.5px",
      normal: "0px",
      wide: "0.5px",
    },
  },

  radius: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "24px",
    full: "999px",
  },

  spacing: {
    xs: "8px",
    sm: "12px",
    md: "20px",
    lg: "32px",
    xl: "48px",
    "2xl": "72px",
    "3xl": "96px",
  },

  shadows: {
    sm: "0 10px 25px rgba(0,0,0,0.25)",
    md: "0 20px 45px rgba(0,0,0,0.35)",
    lg: "0 30px 80px rgba(0,0,0,0.45)",
    glow: "0 0 60px rgba(124,58,237,0.45)",
    cardGlow: "0 0 0 1px rgba(124,58,237,0.25), 0 20px 60px rgba(0,0,0,0.45)",
  },

  gradients: {
    primary: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
    dark: "linear-gradient(180deg, #08080D 0%, #050509 100%)",
    heroGlow:
      "radial-gradient(circle at 70% 40%, rgba(124,58,237,0.45) 0%, rgba(8,8,13,0) 45%)",
    purpleBlur:
      "radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0) 65%)",
  },

  buttons: {
    primary: {
      background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
      color: "#FFFFFF",
      border: "1px solid transparent",
      borderRadius: "14px",
      padding: "14px 24px",
      fontWeight: 600,
      boxShadow: "0 15px 40px rgba(124,58,237,0.35)",
    },

    secondary: {
      background: "transparent",
      color: "#FFFFFF",
      border: "1px solid rgba(255,255,255,0.16)",
      borderRadius: "14px",
      padding: "14px 24px",
      fontWeight: 600,
    },

    ghost: {
      background: "transparent",
      color: "#A855F7",
      border: "none",
      padding: "0",
      fontWeight: 600,
    },
  },

  cards: {
    default: {
      background: "linear-gradient(180deg, #18181F 0%, #101014 100%)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "18px",
      padding: "28px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    },

    hover: {
      border: "1px solid rgba(124,58,237,0.55)",
      boxShadow: "0 0 0 1px rgba(124,58,237,0.25), 0 25px 70px rgba(0,0,0,0.5)",
      transform: "translateY(-4px)",
    },
  },

  inputs: {
    default: {
      background: "#101014",
      color: "#FFFFFF",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "12px",
      padding: "14px 16px",
      fontSize: "14px",
    },

    focus: {
      border: "1px solid rgba(124,58,237,0.75)",
      boxShadow: "0 0 0 3px rgba(124,58,237,0.18)",
    },

    error: {
      border: "1px solid #EF4444",
      color: "#EF4444",
    },
  },

  layout: {
    container: {
      maxWidth: "1180px",
      padding: "0 24px",
      margin: "0 auto",
    },

    section: {
      padding: "96px 0",
    },

    grid: {
      services: "repeat(3, minmax(0, 1fr))",
      portfolio: "repeat(3, minmax(0, 1fr))",
    },
  },

  transitions: {
    fast: "150ms ease",
    normal: "250ms ease",
    slow: "400ms ease",
  },

  zIndex: {
    header: 100,
    modal: 1000,
    overlay: 900,
  },
};