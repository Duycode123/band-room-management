'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAdminFacilityReports,
  formatFacilityReportDateTime,
  getFacilityReportStats,
  updateAdminFacilityReportStatus,
} from '@/lib/admin/facility-reports/adminFacilityReportApi'
import type { AdminFacilityReport, FacilityReportStatus } from '@/lib/admin/facility-reports/types'

const statusLabels: Record<FacilityReportStatus, string> = {
  OPEN: 'Moi ghi nhan',
  IN_PROGRESS: 'Dang xu ly',
  RESOLVED: 'Da xu ly',
  CLOSED: 'Da dong',
}

const conditionLabels: Record<string, string> = {
  GOOD: 'Tot',
  NEED_CLEANING: 'Can ve sinh',
  NEED_CHECK: 'Can kiem tra',
  BROKEN: 'Bao hong',
}

const statusOptions: FacilityReportStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const inputClass =
  'h-11 w-full rounded-xl border border-outline bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition-all focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/15'

export default function AdminFacilityReportsPanel() {
  const [reports, setReports] = useState<AdminFacilityReport[]>([])
  const [selected, setSelected] = useState<AdminFacilityReport | null>(null)
  const [maintenanceOnly, setMaintenanceOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminFacilityReports(maintenanceOnly ? true : undefined)
      setReports(data)
      setSelected((current) => (current ? data.find((report) => report.id === current.id) ?? current : null))
      setMessage('')
    } catch (error) {
      setReports([])
      setSelected(null)
      setMessage(error instanceof Error ? error.message : 'Khong the tai lich su co so vat chat.')
    } finally {
      setIsLoading(false)
    }
  }, [maintenanceOnly])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const stats = useMemo(() => getFacilityReportStats(reports), [reports])

  const handleSave = async (status: FacilityReportStatus, adminNote: string) => {
    if (!selected) return
    const updated = await updateAdminFacilityReportStatus(selected.id, status, adminNote)
    setSelected(updated)
    setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)))
    setMessage('Da cap nhat bao cao co so vat chat.')
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-on-surface">Bao cao co so vat chat</h2>
          <p className="text-xs text-on-surface-variant">Lich su staff ghi nhan tinh trang phong va thiet bi.</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-medium text-on-surface-variant">
          <input
            type="checkbox"
            checked={maintenanceOnly}
            onChange={(event) => setMaintenanceOnly(event.target.checked)}
            className="h-4 w-4 rounded border-outline text-brand-orange"
          />
          Chi hien de xuat bao tri
        </label>
      </div>

      {message && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          {message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Tong report" value={isLoading ? '...' : stats.total} />
        <MiniStat label="Moi" value={isLoading ? '...' : stats.open} />
        <MiniStat label="Dang xu ly" value={isLoading ? '...' : stats.inProgress} />
        <MiniStat label="Da xu ly/dong" value={isLoading ? '...' : stats.resolved} />
        <MiniStat label="De xuat bao tri" value={isLoading ? '...' : stats.maintenanceSuggested} />
      </div>

      <FacilityReportTable
        reports={reports}
        isLoading={isLoading}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      <FacilityReportDrawer
        report={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
      />
    </section>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-on-surface">{value}</p>
    </div>
  )
}

function FacilityReportTable({
  reports,
  isLoading,
  selectedId,
  onSelect,
}: {
  reports: AdminFacilityReport[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (report: AdminFacilityReport) => void
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-container" />
          ))}
        </div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-sm font-medium text-on-surface">Chua co bao cao co so vat chat.</p>
        <p className="mt-1 text-xs text-on-surface-variant">Staff se tao du lieu tu man phong/thiet bi.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              {['Report', 'Phong/thiet bi', 'Tinh trang', 'Xu ly', 'Thoi gian', 'Hanh dong'].map((header) => (
                <th key={header} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const active = selectedId === report.id
              return (
                <tr key={report.id} className={['border-b border-outline-variant/60 last:border-0', active ? 'bg-primary-container/25' : 'hover:bg-surface-container-low'].join(' ')}>
                  <td className="px-4 py-3 font-display text-xs font-bold text-brand-orange">{report.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">Room #{report.roomId ?? 'N/A'}</p>
                    <p className="text-xs text-on-surface-variant">{report.equipmentId ? `Equipment #${report.equipmentId}` : 'Room-level report'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{conditionLabels[report.condition ?? ''] ?? 'Chua ro'}</p>
                    {report.maintenanceSuggested && <p className="text-xs font-semibold text-brand-orange">De xuat bao tri</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={report.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{formatFacilityReportDateTime(report.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelect(report)}
                      className="rounded-lg border border-outline bg-white px-3 py-1.5 font-display text-xs font-medium text-on-surface-variant hover:border-brand-orange hover:text-brand-orange"
                    >
                      Xu ly
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FacilityReportDrawer({
  report,
  onClose,
  onSave,
}: {
  report: AdminFacilityReport | null
  onClose: () => void
  onSave: (status: FacilityReportStatus, adminNote: string) => Promise<void>
}) {
  const [status, setStatus] = useState<FacilityReportStatus>('OPEN')
  const [adminNote, setAdminNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!report) return
    setStatus(report.status)
    setAdminNote(report.adminNote)
    setMessage('')
  }, [report])

  if (!report) return null

  const save = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      await onSave(status, adminNote)
      setMessage('Da luu cap nhat.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Khong the luu cap nhat.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <button type="button" aria-label="Dong chi tiet" onClick={onClose} className="fixed inset-0 z-40 bg-inverse-surface/50 backdrop-blur-sm" />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-outline-variant bg-white shadow-[var(--shadow-elevated)]">
        <header className="border-b border-outline-variant px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">{report.id}</p>
              <h2 className="font-display text-xl font-bold text-on-surface">Xu ly bao cao co so vat chat</h2>
              <div className="mt-2"><StatusPill status={report.status} /></div>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low">
              X
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <InfoBlock label="Phong" value={`Room #${report.roomId ?? 'N/A'}`} />
          <InfoBlock label="Thiet bi" value={report.equipmentId ? `Equipment #${report.equipmentId}` : 'Khong gan thiet bi'} />
          <InfoBlock label="Tinh trang" value={conditionLabels[report.condition ?? ''] ?? 'Chua ro'} />
          <InfoBlock label="Ghi chu staff" value={report.note || 'Khong co ghi chu'} />
          <InfoBlock label="Thoi gian ghi nhan" value={formatFacilityReportDateTime(report.createdAt)} />
          {report.imageUrl && <img src={report.imageUrl} alt="Anh bao cao co so vat chat" className="mt-4 h-44 w-full rounded-xl border border-outline-variant object-cover" />}

          <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Trang thai xu ly</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as FacilityReportStatus)} className={inputClass}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{statusLabels[option]}</option>
                ))}
              </select>
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Ghi chu admin</span>
              <textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Nhap ghi chu xu ly..."
                className="w-full rounded-xl border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
              />
              <p className="mt-1 text-right text-[10px] text-on-surface-variant">{adminNote.length}/1000</p>
            </label>
            {message && <p className="mt-3 text-xs font-semibold text-on-surface-variant">{message}</p>}
          </div>
        </div>

        <footer className="border-t border-outline-variant bg-surface-container-low/50 px-5 py-4">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void save()}
            className="w-full rounded-xl bg-brand-orange py-2.5 font-display text-sm font-medium text-white hover:bg-brand-orangeHover disabled:opacity-50"
          >
            {isSaving ? 'Dang luu...' : 'Luu cap nhat'}
          </button>
        </footer>
      </aside>
    </>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm text-on-surface">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: FacilityReportStatus }) {
  const styles: Record<FacilityReportStatus, string> = {
    OPEN: 'border-primary-container bg-primary-container text-on-primary-container',
    IN_PROGRESS: 'border-tertiary-container bg-tertiary-container text-on-tertiary-container',
    RESOLVED: 'border-on-secondary-container/40 bg-on-secondary-container text-[#001A0D]',
    CLOSED: 'border-outline-variant bg-surface-container-high text-on-surface-variant',
  }

  return (
    <span className={['inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold', styles[status]].join(' ')}>
      {statusLabels[status]}
    </span>
  )
}
