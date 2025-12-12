// Hero section constants
export const BACKGROUND_IMAGE = "/bgai.png";

export const MUTED_GREEN = "#157F3C"; // A desaturated, muted green

// Gradient overlay configuration
// Creates a white gradient that's strong at top/bottom, transparent in middle
export const GRADIENT_STOPS = [
  { position: 0, opacity: 0.6 }, // Top: strong white overlay
  { position: 15, opacity: 0.4 },
  { position: 25, opacity: 0.2 },
  { position: 40, opacity: 0 }, // Middle: fully transparent (image visible)
  { position: 60, opacity: 0 }, // Middle: fully transparent
  { position: 70, opacity: 0.1 }, // Bottom: gradual fade to white
  { position: 75, opacity: 0.25 },
  { position: 80, opacity: 0.4 },
  { position: 85, opacity: 0.55 },
  { position: 90, opacity: 0.7 },
  { position: 95, opacity: 0.85 },
  { position: 100, opacity: 1 }, // Bottom: fully white (blends with sections below)
] as const;

export const UNIVERSITIES = [
  {
    name: "University of Tennessee Knoxville",
    logo: "/assets/logos/utk-logo.svg",
    width: 200,
    height: 35,
    url: "https://www.utk.edu/",
  },
  {
    name: "University of Calgary",
    logo: "/assets/logos/ucalgary-logo.svg",
    width: 200,
    height: 35,
    url: "https://www.ucalgary.ca/",
  },
  {
    name: "University of Houston",
    logo: "/assets/logos/uh-logo.svg",
    width: 90,
    height: 35,
    url: "https://www.uh.edu/",
  },
  {
    name: "The George Washington University",
    logo: "/assets/logos/gwu-logo.png",
    width: 90,
    height: 35,
    url: "https://www.gwu.edu/",
  },
  {
    name: "Louisiana State University",
    logo: "/assets/logos/lsu-logo.svg",
    width: 180,
    height: 35,
    url: "https://www.lsu.edu/",
  },
  {
    name: "JSTOR",
    logo: "/assets/logos/jstor-logo.svg",
    width: 80,
    height: 35,
    url: "https://www.jstor.org/",
  },
  {
    name: "George Mason University",
    logo: "/assets/logos/gmu-logo.png",
    width: 300,
    height: 35,
    url: "https://www.gmu.edu/",
  },
  {
    name: "pharos university in alexandria",
    logo: "/assets/logos/pua-logo.png",
    width: 150,
    height: 35,
    url: "https://pua.edu.eg/",
  },
  {
    name: "University of California, Berkeley",
    logo: "/assets/logos/ucb-logo.png",
    width: 130,
    height: 35,
    url: "https://www.berkeley.edu/",
  },
  {
    name: "University of Oslo",
    logo: "/assets/logos/uos-logo.png",
    width: 130,
    height: 35,
    url: "https://www.uio.no/",
  },
  {
    name: "Arab Open University",
    logo: "/assets/logos/aoa-logo.png",
    width: 250,
    height: 35,
    url: "https://www.arabou.edu.sa/",
  },
  {
    name: "University of North Carolina at Chapel Hill",
    logo: "/assets/logos/unc-logo.png",
    width: 200,
    height: 35,
    url: "https://www.unc.edu/",
  },
] as const;
