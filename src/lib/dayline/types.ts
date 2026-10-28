export type ColorTag = {
  id: string;
  name: string;
  color: string;
};

export type TimeBlock = {
  id: string;
  date: string;
  start: number;
  end: number;
  colorId: string;
  memo: string;
};

export type Persisted = {
  colors: ColorTag[];
  blocks: TimeBlock[];
  lastColorId: string;
};
