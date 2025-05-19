import { atom } from "recoil";
import { AtomKeys } from "../atomKeys";

export const themeAtom = atom({
  key: AtomKeys.THEME,
  default: 'compact'
})