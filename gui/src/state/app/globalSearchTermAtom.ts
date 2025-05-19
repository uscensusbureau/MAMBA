import { atom } from "recoil";
import { AtomKeys } from "../atomKeys";
export const globalSearchTermAtom = atom({
  key: AtomKeys.GLOBAL_SEARCH_TERM,
  default: ''
})