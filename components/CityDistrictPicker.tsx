"use client";

import { useState, useRef, useEffect } from "react";
import citiesData from "@/data/tr-cities-districts.json";
import { Search, Map, ChevronDown, Check } from "lucide-react";

interface CityDistrictPickerProps {
  onSelect: (city: string, district: string) => void;
  defaultCity?: string;
  defaultDistrict?: string;
}

export default function CityDistrictPicker({
  onSelect,
  defaultCity = "",
  defaultDistrict = ""
}: CityDistrictPickerProps) {
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);

  // Search input values
  const [citySearch, setCitySearch] = useState(defaultCity);
  const [districtSearch, setDistrictSearch] = useState(defaultDistrict);

  // Dropdown open states
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);

  const districts = selectedCity
    ? citiesData.find((c) => c.city.toLowerCase() === selectedCity.toLowerCase())?.districts || []
    : [];

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityOpen(false);
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setIsDistrictOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCitySearch(city);
    setSelectedDistrict("");
    setDistrictSearch("");
    setIsCityOpen(false);
    setIsDistrictOpen(true); // Auto open district search for fluid UX
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setDistrictSearch(district);
    setIsDistrictOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCity && selectedDistrict) {
      onSelect(selectedCity, selectedDistrict);
    }
  };

  // Filters
  const filteredCities = citiesData.filter((c) =>
    c.city.toLocaleLowerCase("tr-TR").includes(citySearch.toLocaleLowerCase("tr-TR"))
  );

  const filteredDistricts = districts.filter((d) =>
    d.toLocaleLowerCase("tr-TR").includes(districtSearch.toLocaleLowerCase("tr-TR"))
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-neutral-900 border border-neutral-850 p-5 shadow-xl">
      <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2">
        <Map className="h-4 w-4 text-emerald-400" /> Veya İl/İlçe Seçin
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
        {/* City Autocomplete Combobox */}
        <div ref={cityRef} className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            İl Seçin
          </label>
          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setSelectedCity(""); // Clear selection if typing
                setIsCityOpen(true);
              }}
              onFocus={() => setIsCityOpen(true)}
              placeholder="İl ara... (Örn: İzmir)"
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5 pr-10 text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
          </div>

          {isCityOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-md p-1.5 shadow-2xl">
              {filteredCities.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-neutral-500 font-medium text-center">Sonuç bulunamadı</div>
              ) : (
                filteredCities.map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => handleCitySelect(c.city)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedCity === c.city
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <span>{c.city}</span>
                    {selectedCity === c.city && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* District Autocomplete Combobox */}
        <div ref={districtRef} className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            İlçe Seçin
          </label>
          <div className="relative">
            <input
              type="text"
              value={districtSearch}
              disabled={!selectedCity}
              onChange={(e) => {
                setDistrictSearch(e.target.value);
                setSelectedDistrict(""); // Clear selection if typing
                setIsDistrictOpen(true);
              }}
              onFocus={() => {
                if (selectedCity) setIsDistrictOpen(true);
              }}
              placeholder={selectedCity ? "İlçe ara... (Örn: Foça)" : "Önce il seçin..."}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5 pr-10 text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
          </div>

          {isDistrictOpen && selectedCity && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-md p-1.5 shadow-2xl">
              {filteredDistricts.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-neutral-500 font-medium text-center">Sonuç bulunamadı</div>
              ) : (
                filteredDistricts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDistrictSelect(d)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedDistrict === d
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <span>{d}</span>
                    {selectedDistrict === d && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!selectedCity || !selectedDistrict}
        className="mt-4.5 w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-black uppercase text-white hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20"
      >
        <Search className="h-4 w-4" /> Eczaneleri Listele
      </button>
    </form>
  );
}
