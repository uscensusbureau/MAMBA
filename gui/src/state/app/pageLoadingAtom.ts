import { atom } from "recoil";
import { AtomKeys } from "../atomKeys";
export const pageLoadingAtom = atom({
  key: AtomKeys.PAGE_lOADING,
  default: false
})