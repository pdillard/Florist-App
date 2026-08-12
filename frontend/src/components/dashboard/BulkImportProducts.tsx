'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'

type Product = {
  id: string
  name: string
  description: string | null
  price_cents: number
  stock_qty: number
  is_active: boolean
}

type ParsedRow = {
  rowNumber: number
  name: string
  description: string | null
  priceDollars: number | null
  stock: number
  error: string | null
  matchesExistingId: string | null
}

// A shop's price list almost always already exists somewhere - a
// spreadsheet, an export from whatever they use today - typing it into
// this app one flower at a time is real friction that has nothing to do
// with whether the product is good. This turns "enter your catalog" into
// "drop in the file you already have."

const NAME_KEYS = ['name', 'product', 'product name', 'item', 'item name', 'flower', 'title']
const PRICE_KEYS = ['price', 'price ($)', 'price (usd)', 'cost', 'unit price', 'unit cost']
const STOCK_KEYS = ['stock', 'qty', 'quantity', 'inventory', 'stock qty', 'count', 'stock quantity']
const DESCRIPTION_KEYS = ['description', 'desc', 'notes', 'details']

function normalize(h: string) {
  return h.trim().toLowerCase()
}

function findColumn(headers: string[], candidates: string[]) {
  const normalized = headers.map(normalize)
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate)
    if (idx !== -1) return headers[idx]
  }
  return null
}

function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const value = parseFloat(cleaned)
  return isNaN(value) || value <= 0 ? null : value
}

function parseStock(raw: string | undefined): number {
  if (!raw || !raw.trim()) return 0
  const value = parseInt(raw.replace(/[^0-9-]/g, ''), 10)
  return isNaN(value) || value < 0 ? 0 : value
}

function downloadTemplate() {
  const csv = [
    'name,description,price,stock',
    'Dozen Red Roses,Classic red rose bouquet with baby\'s breath,54.99,25',
    'Sunflower Bunch,Bright sunflowers in a mason jar,32.00,15',
    'Succulent Garden,Assorted succulents in a ceramic planter,28.50,10',
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'product-catalog-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function BulkImportProducts({
  merchantId,
  products,
  onImported,
}: {
  merchantId: string
  products: Product[]
  onImported: (products: Product[]) => void
}) {
  const [pasted, setPasted] = useState('')
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ added: number; updated: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function parseText(text: string) {
    setResult(null)
    setParseError(null)

    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })

    const headers = parsed.meta.fields ?? []
    const nameCol = findColumn(headers, NAME_KEYS)
    const priceCol = findColumn(headers, PRICE_KEYS)
    const stockCol = findColumn(headers, STOCK_KEYS)
    const descCol = findColumn(headers, DESCRIPTION_KEYS)

    if (!nameCol || !priceCol) {
      setParseError(
        `Couldn't find a name and price column in the file. Found columns: ${headers.join(', ') || '(none)'}. Try the template below.`
      )
      setRows(null)
      return
    }

    // If the same name shows up twice in the file, the later row wins -
    // simplest reasonable behavior for "I fixed a typo and re-pasted."
    const existingByName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p.id]))

    const parsedRows: ParsedRow[] = parsed.data.map((raw, i) => {
      const name = (raw[nameCol] ?? '').trim()
      const priceDollars = parsePrice(raw[priceCol])
      const stock = parseStock(stockCol ? raw[stockCol] : undefined)
      const description = descCol ? (raw[descCol] ?? '').trim() || null : null

      let error: string | null = null
      if (!name) error = 'Missing name'
      else if (priceDollars === null) error = 'Missing or invalid price'

      const key = name.toLowerCase()

      return {
        rowNumber: i + 2, // +1 for header row, +1 for 1-indexing
        name,
        description,
        priceDollars,
        stock,
        error,
        matchesExistingId: existingByName.get(key) ?? null,
      }
    })

    // Drop rows superseded by a later duplicate of the same name.
    const lastIndexByName = new Map<string, number>()
    parsedRows.forEach((r, i) => {
      if (r.name) lastIndexByName.set(r.name.toLowerCase(), i)
    })
    const deduped = parsedRows.filter(
      (r, i) => !r.name || lastIndexByName.get(r.name.toLowerCase()) === i
    )

    setRows(deduped)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => parseText(String(reader.result))
    reader.readAsText(file)
  }

  function handlePasteParse() {
    if (!pasted.trim()) return
    parseText(pasted)
  }

  async function handleImport() {
    if (!rows) return
    const valid = rows.filter((r) => !r.error)
    if (valid.length === 0) return

    setImporting(true)
    setResult(null)

    const toInsert = valid.filter((r) => !r.matchesExistingId)
    const toUpdate = valid.filter((r) => r.matchesExistingId)

    let added = 0
    let updated = 0
    let failed = 0
    const newProducts: Product[] = []

    if (toInsert.length > 0) {
      // Same trust model as the single "Add product" form: RLS's
      // products_merchant_write policy is what actually enforces
      // merchant_id, this is a plain client insert, not an RPC.
      const { data, error } = await supabase
        .from('products')
        .insert(
          toInsert.map((r) => ({
            merchant_id: merchantId,
            name: r.name,
            description: r.description,
            price_cents: Math.round((r.priceDollars ?? 0) * 100),
            stock_qty: r.stock,
            is_active: true,
          }))
        )
        .select()

      if (error) {
        failed += toInsert.length
      } else {
        added += data.length
        newProducts.push(...(data as Product[]))
      }
    }

    if (toUpdate.length > 0) {
      const results = await Promise.all(
        toUpdate.map((r) =>
          supabase
            .from('products')
            .update({
              price_cents: Math.round((r.priceDollars ?? 0) * 100),
              stock_qty: r.stock,
              ...(r.description !== null ? { description: r.description } : {}),
            })
            .eq('id', r.matchesExistingId as string)
            .select()
            .single()
        )
      )

      for (const { data, error } of results) {
        if (error || !data) {
          failed += 1
        } else {
          updated += 1
          newProducts.push(data as Product)
        }
      }
    }

    setImporting(false)
    setResult({ added, updated, failed })
    setRows(null)
    setPasted('')

    if (newProducts.length > 0) {
      onImported(newProducts)
    }
  }

  const validCount = rows?.filter((r) => !r.error).length ?? 0
  const errorCount = rows?.filter((r) => r.error).length ?? 0
  const updateCount = rows?.filter((r) => !r.error && r.matchesExistingId).length ?? 0

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <FileSpreadsheet className="h-4 w-4 text-rose-500" />
          Import your catalog
        </h2>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1 text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-black hover:decoration-black"
        >
          <Download className="h-3 w-3" />
          Download template
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Already have a price list in a spreadsheet? Upload a CSV or paste it directly instead of
        typing each item in below. Matches by name will update existing products instead of
        duplicating them.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="hidden"
        />
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Upload CSV
        </Button>
        <span className="text-xs text-gray-400">or paste from Excel/Google Sheets below</span>
      </div>

      <textarea
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        placeholder={'name, description, price, stock\nDozen Red Roses, Classic bouquet, 54.99, 25'}
        rows={4}
        className="mt-3 w-full rounded-lg border border-gray-300 p-2.5 font-mono text-xs outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
      />
      {pasted.trim() && (
        <Button type="button" variant="secondary" onClick={handlePasteParse} className="mt-2">
          Preview
        </Button>
      )}

      {parseError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {parseError}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              <CheckCircle2 className="h-3 w-3" />
              {validCount} ready ({updateCount} update{updateCount === 1 ? '' : 's'},{' '}
              {validCount - updateCount} new)
            </span>
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                <AlertCircle className="h-3 w-3" />
                {errorCount} skipped
              </span>
            )}
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b text-left text-gray-500">
                  <th className="px-3 py-2">Row</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rowNumber} className={`border-b last:border-b-0 ${r.error ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-1.5 text-gray-400">{r.rowNumber}</td>
                    <td className="max-w-[10rem] truncate">{r.name || '—'}</td>
                    <td>{r.priceDollars !== null ? `$${r.priceDollars.toFixed(2)}` : '—'}</td>
                    <td>{r.stock}</td>
                    <td>
                      {r.error ? (
                        <span className="text-red-600">{r.error}</span>
                      ) : r.matchesExistingId ? (
                        <span className="text-blue-600">Will update</span>
                      ) : (
                        <span className="text-green-600">New</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="accent"
            onClick={handleImport}
            loading={importing}
            disabled={validCount === 0}
            className="mt-4"
          >
            Import {validCount} product{validCount === 1 ? '' : 's'}
          </Button>
        </div>
      )}

      {result && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {result.added} added, {result.updated} updated
          {result.failed > 0 && `, ${result.failed} failed`}.
        </div>
      )}
    </div>
  )
}
