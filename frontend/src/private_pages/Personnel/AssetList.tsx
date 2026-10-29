import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_BASED_API_URLS as API_URLS } from "../../config";
import Box from "../../components/Box";
import DataTable, { type DataTableColumn } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import TablePagination from "../../components/TablePagination";
import AssetFilters from "../../components/Personnel/AssetFilters";
import {
  EMPTY_ASSET_FILTERS,
  toPersonnelAsset,
  type AssetFilterOptionsResponse,
  type AssetFilterValues,
  type PersonnelAsset,
  type PersonnelAssetsResponse,
} from "../../components/Personnel/assetTypes";
import { getErrorInfo } from "../../utils/getErrorInfo";
import { formatDateOnly } from "../../utils/formatDate";

const PAGE_SIZE = 6;
const BASE_URL = `${API_URLS.Personnel}/asset-list`;

export default function AssetList() {
  const navigate = useNavigate();

  // Table data
  const [assets, setAssets] = useState<PersonnelAsset[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Dropdown options
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Filters: draft = what the inputs show, applied = what the table uses
  const [draft, setDraft] = useState<AssetFilterValues>(EMPTY_ASSET_FILTERS);
  const [applied, setApplied] = useState<AssetFilterValues>(EMPTY_ASSET_FILTERS);
  const [filterError, setFilterError] = useState("");

  // =========================
  // FETCH FILTER OPTIONS
  // =========================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await axios.get<AssetFilterOptionsResponse>(
          `${BASE_URL}/filter-options`,
          { withCredentials: true }
        );
        if (cancelled) return;
        setCategories(res.data.categories ?? []);
        setStatuses(res.data.statuses ?? []);
      } catch (error) {
        if (cancelled) return;
        if (getErrorInfo(error).status === 401) {
          navigate("/login", { replace: true });
        }
        // Dropdowns stay empty on other errors; the table shows its own error
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, navigate]);

  // =========================
  // FETCH ASSETS
  // =========================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setListError("");
      try {
        const res = await axios.get<PersonnelAssetsResponse>(BASE_URL, {
          withCredentials: true,
          params: {
            keyword: applied.keyword.trim() || undefined,
            category: applied.category || undefined,
            status: applied.status || undefined,
            startDate: applied.startDate || undefined,
            endDate: applied.endDate || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        });
        if (cancelled) return;

        const pages = Math.max(1, res.data.total_pages ?? 1);
        if (page > pages) {
          setPage(pages);
          return;
        }

        setAssets((res.data.assets ?? []).map(toPersonnelAsset));
        setTotalAssets(res.data.total_assets ?? 0);
        setTotalPages(pages);
      } catch (error) {
        if (cancelled) return;
        const info = getErrorInfo(error);
        if (info.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setListError(info.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, applied, reloadKey, navigate]);

  const refresh = () => setReloadKey((key) => key + 1);

  // =========================
  // FILTERS
  // =========================
  function handleFilterChange(field: keyof AssetFilterValues, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSearch() {
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
      setFilterError("The start date cannot be later than the end date.");
      return;
    }
    setFilterError("");
    setPage(1);
    setApplied(draft);
  }

  function handleReset() {
    setDraft(EMPTY_ASSET_FILTERS);
    setApplied(EMPTY_ASSET_FILTERS);
    setFilterError("");
    setPage(1);
  }

  // =========================
  // TABLE
  // =========================
  const columns: DataTableColumn<PersonnelAsset>[] = [
    {
      key: "name",
      header: "Asset Name",
      cellClassName: "font-medium text-neutral-900 dark:text-neutral-50",
      render: (asset) => asset.name,
    },
    {
      key: "tag",
      header: "Asset Tag",
      cellClassName: "text-neutral-600 dark:text-neutral-400",
      render: (asset) => asset.tag,
    },
    {
      key: "category",
      header: "Asset Category",
      render: (asset) => asset.category,
    },
    {
      key: "status",
      header: "Asset Status",
      render: (asset) => <StatusBadge status={asset.status} />,
    },
    {
      key: "dateAssigned",
      header: "Date Assigned",
      className: "whitespace-nowrap",
      render: (asset) => formatDateOnly(asset.dateAssigned),
    },
  ];

  return (
    <div className="min-h-full w-full space-y-5 text-neutral-800 dark:text-neutral-100">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Asset List
        </h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Assets currently assigned to you.
        </p>
      </div>

      <AssetFilters
        values={draft}
        categories={categories}
        statuses={statuses}
        error={filterError}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <Box flush>
        <DataTable
          columns={columns}
          rows={assets}
          rowKey={(asset) => asset.id}
          loading={loading}
          error={listError}
          onRetry={refresh}
          emptyMessage="No assets found."
        />
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalAssets}
          pageSize={PAGE_SIZE}
          itemLabel="assets"
          disabled={loading}
          onPageChange={setPage}
        />
      </Box>
    </div>
  );
}
