"use client";

import { useRef } from "react";
import Papa from "papaparse";

/* -------------------------------------------------------------------------- */
/*  TYPE DEFS                                                                 */
/* -------------------------------------------------------------------------- */
export type ShipmentRow = {
  date: string;   // ISO - “2025-06-01”
  pallets: number;
};

interface Props {
  /** Called when CSV has been parsed successfully */
  onData: (rows: ShipmentRow[]) => void;
}

/* -------------------------------------------------------------------------- */
/*  COMPONENT                                                                 */
/* -------------------------------------------------------------------------- */
export default function UploadShipments({ onData }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ------------------------------ helpers --------------------------------- */
  const handleFile = () => {
    /* 🟠 probe */ console.log(
      "%c[probe] handleFile() called",
      "color:orange;font-weight:bold"
    );

    const file = fileRef.current?.files?.[0];
    if (!file) {
      console.log("%c[probe] NO file selected", "color:red;font-weight:bold");
      return;
    }

    Papa.parse<ShipmentRow>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        console.log(
          "%c[probe] Papa.parse complete",
          "color:green;font-weight:bold"
        );
        console.table(result.data);

        /* filter out empty rows that Papa might return at EOF */
        const rows = result.data.filter(
          (r) => r.date && typeof r.pallets === "number"
        ) as ShipmentRow[];

        onData(rows);
      },
      error: (err) => {
        console.error("CSV parse error ➜", err);
        alert("CSV could not be read – please check the file format.");
      },
    });
  };

  /* ------------------------------- render --------------------------------- */
  return (
    <>
      {/* ── hidden file input (triggered from Header button) ───────────────── */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        hidden
      />
    </>
  );
}
