import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer, Droplets, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  windSpeed: number;
  humidity: number;
  visibility: number;
  icon: string;
}

// Simulated weather for key route cities (would connect to real API)
const generateWeather = (): WeatherData[] => {
  const cities = [
    { city: "München", base: 12 },
    { city: "Wien", base: 14 },
    { city: "Zagreb", base: 16 },
    { city: "Belgrad", base: 18 },
    { city: "Sarajevo", base: 15 },
    { city: "Skopje", base: 20 },
  ];

  const conditions = ["sunny", "cloudy", "rain", "partly_cloudy", "thunderstorm", "snow"];

  return cities.map(c => {
    const variance = Math.floor(Math.random() * 6) - 3;
    const condIndex = Math.floor(Math.random() * 4); // bias toward good weather
    return {
      city: c.city,
      temp: c.base + variance,
      condition: conditions[condIndex],
      windSpeed: Math.floor(Math.random() * 30) + 5,
      humidity: Math.floor(Math.random() * 40) + 40,
      visibility: Math.floor(Math.random() * 5) + 5,
      icon: conditions[condIndex],
    };
  });
};

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case "sunny": return <Sun className="w-4 h-4 text-amber-400" />;
    case "cloudy": return <Cloud className="w-4 h-4 text-zinc-400" />;
    case "rain": return <CloudRain className="w-4 h-4 text-blue-400" />;
    case "snow": return <CloudSnow className="w-4 h-4 text-cyan-300" />;
    case "thunderstorm": return <CloudLightning className="w-4 h-4 text-yellow-400" />;
    default: return <Sun className="w-4 h-4 text-amber-300" />;
  }
};

const getConditionLabel = (condition: string) => {
  switch (condition) {
    case "sunny": return "Sonnig";
    case "cloudy": return "Bewölkt";
    case "rain": return "Regen";
    case "snow": return "Schnee";
    case "thunderstorm": return "Gewitter";
    case "partly_cloudy": return "Teilw. bewölkt";
    default: return condition;
  }
};

const hasWeatherWarning = (data: WeatherData) => {
  return data.condition === "thunderstorm" || data.condition === "snow" || data.windSpeed > 25 || data.visibility < 3;
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData[]>([]);

  useEffect(() => {
    setWeather(generateWeather());
    const interval = setInterval(() => setWeather(generateWeather()), 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const warnings = weather.filter(hasWeatherWarning);

  return (
    <div className="p-3 bg-[#111820] rounded-lg border border-[#1e2836]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-zinc-300">Wetter Routen</h2>
        </div>
        {warnings.length > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
            {warnings.length} Warnung{warnings.length > 1 ? "en" : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {weather.map((w) => (
          <div
            key={w.city}
            className={cn(
              "p-2 rounded border transition-colors",
              hasWeatherWarning(w)
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-[#0c1018] border-[#1e2836]"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-zinc-400 truncate">{w.city}</span>
              {getWeatherIcon(w.condition)}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-white">{w.temp}°</span>
              <span className="text-[9px] text-zinc-500">{getConditionLabel(w.condition)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-600">
              <span className="flex items-center gap-0.5">
                <Wind className="w-2.5 h-2.5" /> {w.windSpeed}km/h
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="w-2.5 h-2.5" /> {w.visibility}km
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
