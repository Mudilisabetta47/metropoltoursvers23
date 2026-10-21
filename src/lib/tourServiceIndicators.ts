export function tourServiceIndicators(services: readonly string[] = []) {
  const included = services.filter(service => !/nicht enthalten|nicht inkl|optional|selbst organisieren/i.test(service));
  return {
    hotel: included.some(service => /hotel|übernachtung|unterkunft/i.test(service)),
    breakfast: included.some(service => /frühstück/i.test(service)),
    bus: included.some(service => /bus|busfahrt/i.test(service)),
    roundTrip: included.some(service => /hin-?\s*und\s*rückfahrt/i.test(service)),
  };
}