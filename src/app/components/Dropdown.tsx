import { useState } from "react";
type SortType = "latest" | "az" | "za";

type SortDropdownProps = {
  sortType: SortType;
  setSortType: (value: SortType) => void;
};

const sortOptions: { label: string; value: SortType }[] = [
  { label: "Latest", value: "latest" },
  { label: "A to Z", value: "az" },
  { label: "Z to A", value: "za" },
];

const SortDropdown: React.FC<SortDropdownProps> = ({
  sortType,
  setSortType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = sortOptions.find((opt) => opt.value === sortType);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="bg-zinc-800 text-white px-4 py-2 rounded shadow hover:bg-zinc-700 transition-colors duration-200 flex items-center gap-2"
      >
        {selected?.label}
        <span className="ml-2 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded shadow-lg">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortType(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-white hover:bg-zinc-700 ${
                sortType === option.value ? "font-bold text-emerald-400" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
