// Shape returned by GET api/personnel/asset-list (snake_case)
export type ApiPersonnelAsset = {
  id: string;
  asset_id: string;
  name: string;
  tag: string;
  category: string;
  status: string;
  date_assigned: string; // yyyy-MM-dd
};

export type PersonnelAssetsResponse = {
  assets: ApiPersonnelAsset[];
  total_assets: number;
  current_page: number;
  page_size: number;
  total_pages: number;
};

// Shape returned by GET api/personnel/asset-list/filter-options
export type AssetFilterOptionsResponse = {
  categories: string[];
  statuses: string[];
};

export type PersonnelAsset = {
  id: string;
  name: string;
  tag: string;
  category: string;
  status: string;
  dateAssigned: string; // yyyy-MM-dd
};

export const toPersonnelAsset = (asset: ApiPersonnelAsset): PersonnelAsset => ({
  id: asset.id,
  name: asset.name,
  tag: asset.tag,
  category: asset.category,
  status: asset.status,
  dateAssigned: asset.date_assigned,
});

export type AssetFilterValues = {
  keyword: string;
  category: string;
  status: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
};

export const EMPTY_ASSET_FILTERS: AssetFilterValues = {
  keyword: "",
  category: "",
  status: "",
  startDate: "",
  endDate: "",
};
