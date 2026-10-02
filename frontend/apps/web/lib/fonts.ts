import { Geist, Inter, Montserrat, Poppins, Roboto } from "next/font/google";

// Polices disponibles pour les clients. Pour en ajouter une, l'importer ici.
const geist = Geist({ subsets: ["latin"], preload: false });
const inter = Inter({ subsets: ["latin"], preload: false });
const montserrat = Montserrat({ subsets: ["latin"], preload: false });
const poppins = Poppins({ subsets: ["latin"], preload: false, weight: ["400", "500", "600", "700", "800"] });
const roboto = Roboto({ subsets: ["latin"], preload: false, weight: ["400", "500", "700", "900"] });

export const fonts = { geist, inter, montserrat, poppins, roboto };

export type FontKey = keyof typeof fonts;
