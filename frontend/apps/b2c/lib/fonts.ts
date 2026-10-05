import type { BrandFont } from "@atelio/core/domain";
import { Geist, Inter, Montserrat, Poppins, Roboto } from "next/font/google";

// Une police next/font par police de marque (BrandFont, dans core). Pour en ajouter une,
// l'ajouter à BrandFont puis l'importer ici (et dans le chargement des polices de b2b).
const geist = Geist({ subsets: ["latin"], preload: false });
const inter = Inter({ subsets: ["latin"], preload: false });
const montserrat = Montserrat({ subsets: ["latin"], preload: false });
const poppins = Poppins({ subsets: ["latin"], preload: false, weight: ["400", "500", "600", "700", "800"] });
const roboto = Roboto({ subsets: ["latin"], preload: false, weight: ["400", "500", "700", "900"] });

export const fonts: Record<BrandFont, typeof geist> = { geist, inter, montserrat, poppins, roboto };
