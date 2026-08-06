import {
  prependToSheet,
  updateSheetRow,
  deleteSheetRow,
  getSheetData,
} from "@/lib/google-sheets";

export const SHEET_NAMES = {
  MASUK: "Surat Masuk",
  KELUAR: "Surat Keluar",
} as const;

type SyncAction = "create" | "update" | "delete";

export interface SuratMasukSyncPayload {
  externalId: string;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
}

export interface SuratKeluarSyncPayload {
  externalId: string;
  nomor_surat: string;
  tanggal_surat: string;
  agenda?: string;
  tujuan_surat: string;
  perihal: string;
  unit_kerja: string;
}

export async function syncSuratMasukToSheet(
  data: SuratMasukSyncPayload,
  action: SyncAction,
  oldExternalId?: string,
) {
  const sheetName = SHEET_NAMES.MASUK;

  if (action === "create") {
    await prependToSheet(sheetName, [
      [
        data.externalId,
        data.nomor_surat,
        data.tanggal_surat,
        data.tanggal_terima,
        data.asal_surat,
        data.perihal,
      ],
    ]);
    return;
  }

  if (action === "update") {
    const rows = await getSheetData(`${sheetName}!A:A`);
    const externalId = oldExternalId || data.externalId;
    const rowIndex = rows.findIndex((r: string[]) => r[0] === externalId);
    if (rowIndex === -1) return;

    await updateSheetRow(
      `${sheetName}!A${rowIndex + 1}:F${rowIndex + 1}`,
      [[
        data.externalId,
        data.nomor_surat,
        data.tanggal_surat,
        data.tanggal_terima,
        data.asal_surat,
        data.perihal,
      ]],
    );
    return;
  }

  if (action === "delete") {
    const rows = await getSheetData(`${sheetName}!A:A`);
    const rowIndex = rows.findIndex((r: string[]) => r[0] === data.externalId);
    if (rowIndex === -1) return;

    await deleteSheetRow(sheetName, rowIndex);
    return;
  }
}

export async function syncSuratKeluarToSheet(
  data: SuratKeluarSyncPayload,
  action: SyncAction,
  oldExternalId?: string,
) {
  const sheetName = SHEET_NAMES.KELUAR;

  if (action === "create") {
    await prependToSheet(sheetName, [
      [
        data.externalId,
        data.nomor_surat,
        data.tanggal_surat,
        data.agenda || "",
        data.tujuan_surat,
        data.perihal,
        data.unit_kerja,
      ],
    ]);
    return;
  }

  if (action === "update") {
    const rows = await getSheetData(`${sheetName}!A:A`);
    const externalId = oldExternalId || data.externalId;
    const rowIndex = rows.findIndex((r: string[]) => r[0] === externalId);
    if (rowIndex === -1) return;

    await updateSheetRow(
      `${sheetName}!A${rowIndex + 1}:G${rowIndex + 1}`,
      [[
        data.externalId,
        data.nomor_surat,
        data.tanggal_surat,
        data.agenda || "",
        data.tujuan_surat,
        data.perihal,
        data.unit_kerja,
      ]],
    );
    return;
  }

  if (action === "delete") {
    const rows = await getSheetData(`${sheetName}!A:A`);
    const rowIndex = rows.findIndex((r: string[]) => r[0] === data.externalId);
    if (rowIndex === -1) return;

    await deleteSheetRow(sheetName, rowIndex);
    return;
  }
}
