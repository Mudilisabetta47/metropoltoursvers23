import type { LandingContent } from "./types";
import {
  busunternehmenHannover,
  busMietenHannover,
  reisebusMietenHannover,
  busvermietungHannover,
  busMietenBremen,
  reisebusMietenBremen,
  busvermietungBremen,
  busMietenHamburg,
} from "./standorte";
import {
  busMieten,
  reisebusMitFahrer,
  schulfahrten,
  vereinsfahrten,
  ausflugsfahrten,
  flughafentransfer,
  shuttleService,
  busCharter,
  gruppenreisen,
} from "./services";

/** Alle SEO-Landingpages in Reihenfolge der Wichtigkeit. */
export const landingPages: LandingContent[] = [
  busMieten,
  busunternehmenHannover,
  busMietenHannover,
  reisebusMietenHannover,
  busvermietungHannover,
  busMietenBremen,
  reisebusMietenBremen,
  busvermietungBremen,
  busMietenHamburg,
  reisebusMitFahrer,
  gruppenreisen,
  schulfahrten,
  vereinsfahrten,
  ausflugsfahrten,
  flughafentransfer,
  shuttleService,
  busCharter,
];

export const landingBySlug: Record<string, LandingContent> = Object.fromEntries(
  landingPages.map((p) => [p.slug, p]),
);

export const landingSlugs = landingPages.map((p) => p.slug);

export type { LandingContent };
