// Zentrale Logik: Wann ist eine Reise buchbar?
// Regel: Nur veröffentlichte + aktive Reisen nehmen Buchungen an.
// Nicht veröffentlichte Reisen bleiben sichtbar, sind aber nur anfragbar.

export interface TourPublishState {
  publish_status?: string | null;
  is_active?: boolean | null;
}

export const isTourPublished = (tour?: TourPublishState | null): boolean =>
  Boolean(tour && tour.publish_status === "published" && tour.is_active !== false);

export const isTourBookable = (tour?: TourPublishState | null): boolean =>
  isTourPublished(tour);

export const TOUR_NOT_BOOKABLE_TITLE = "Buchung noch nicht freigegeben";
export const TOUR_NOT_BOOKABLE_TEXT =
  "Diese Reise ist noch in Vorbereitung und kann aktuell nicht online gebucht werden. Sichern Sie sich Ihren Platz unverbindlich über eine Anfrage – wir melden uns, sobald die Buchung freigegeben ist.";
