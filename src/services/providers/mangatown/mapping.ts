import { RawProviderManga, RawProviderChapter, RawProviderPage } from "../shared/types";
import { ContractValidator } from "../contract-validator";
import { MANGATOWN_CONSTANTS } from "./constants";

export function mapMangaTownDetail(raw: RawProviderManga): RawProviderManga {
  const result = ContractValidator.validateManga(raw, MANGATOWN_CONSTANTS.ID);
  if (!result.isValid || !result.sanitized) {
    throw new Error(`MangaTown manga detail contract validation failed: ${result.errors.join(", ")}`);
  }
  return result.sanitized;
}

export function mapMangaTownChapter(raw: RawProviderChapter): RawProviderChapter {
  const result = ContractValidator.validateChapter(raw, MANGATOWN_CONSTANTS.ID);
  if (!result.isValid || !result.sanitized) {
    throw new Error(`MangaTown chapter contract validation failed: ${result.errors.join(", ")}`);
  }
  return result.sanitized;
}

export function mapMangaTownPages(pages: RawProviderPage[]): RawProviderPage[] {
  const result = ContractValidator.validatePages(pages, MANGATOWN_CONSTANTS.ID);
  if (!result.isValid || !result.sanitized) {
    throw new Error(`MangaTown pages contract validation failed: ${result.errors.join(", ")}`);
  }
  return result.sanitized;
}
