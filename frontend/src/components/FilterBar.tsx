import { useEffect, useRef, useState } from 'react'
import type { PostCategory } from '../types/post'
import { CATEGORY_OPTIONS } from '../constants/postCategory'
import './FilterBar.css'

const SEARCH_DEBOUNCE_MS = 400

interface FilterBarProps {
  q: string
  category: PostCategory | ''
  dateFrom: string
  dateTo: string
  sortByDistance: boolean
  locatingUser: boolean
  onSearchChange: (q: string) => void
  onCategoryChange: (category: PostCategory | '') => void
  onDateRangeApply: (dateFrom: string, dateTo: string) => void
  onToggleSortByDistance: () => void
}

export function FilterBar({
  q,
  category,
  dateFrom,
  dateTo,
  sortByDistance,
  locatingUser,
  onSearchChange,
  onCategoryChange,
  onDateRangeApply,
  onToggleSortByDistance,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(q)
  const [stagedDateFrom, setStagedDateFrom] = useState(dateFrom)
  const [stagedDateTo, setStagedDateTo] = useState(dateTo)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reflect external changes (e.g. browser back/forward) without re-triggering the debounce.
  useEffect(() => {
    setSearchInput(q)
  }, [q])

  // Same for the staged date pickers: only re-sync from outside, never from typing here.
  useEffect(() => {
    setStagedDateFrom(dateFrom)
    setStagedDateTo(dateTo)
  }, [dateFrom, dateTo])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearchChange(value), SEARCH_DEBOUNCE_MS)
  }

  const hasPendingDateChange = stagedDateFrom !== dateFrom || stagedDateTo !== dateTo

  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-bar__search"
        placeholder="Search by title…"
        value={searchInput}
        onChange={(event) => handleSearchInput(event.target.value)}
      />

      <select
        className="filter-bar__select"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value as PostCategory | '')}
      >
        <option value="">All categories</option>
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="filter-bar__date-field">
        <span className="filter-bar__date-label">From</span>
        <input
          type="date"
          className="filter-bar__date"
          value={stagedDateFrom}
          onChange={(event) => setStagedDateFrom(event.target.value)}
        />
      </label>

      <label className="filter-bar__date-field">
        <span className="filter-bar__date-label">To</span>
        <input
          type="date"
          className="filter-bar__date"
          value={stagedDateTo}
          onChange={(event) => setStagedDateTo(event.target.value)}
        />
      </label>

      <button
        type="button"
        className="filter-bar__apply"
        disabled={!hasPendingDateChange}
        onClick={() => onDateRangeApply(stagedDateFrom, stagedDateTo)}
      >
        Apply dates
      </button>

      <button
        type="button"
        className={`filter-bar__distance-toggle${sortByDistance ? ' filter-bar__distance-toggle--active' : ''}`}
        onClick={onToggleSortByDistance}
        disabled={locatingUser}
      >
        {locatingUser ? 'Locating…' : sortByDistance ? '📍 Closest first' : '📍 Close to me'}
      </button>
    </div>
  )
}
