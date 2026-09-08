// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SiteHeader } from './layout/SiteHeader'
import { DocumentRow } from './documents/DocumentRow'
import { Notice } from './forms/FormPrimitives'
import { AdminActionPanel } from './admin/AdminActionPanel'
import type { Application, DocumentRecord } from '../lib/types'

afterEach(cleanup)

describe('audit accessibility regressions', () => {
  it('lets expanded navigation scroll with the page and restores the toggle on Escape', () => {
    render(<MemoryRouter><SiteHeader /></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(toggle)
    const navigation = screen.getByRole('navigation', { name: 'Mobile navigation' })
    expect(navigation.closest('header')?.classList.contains('sticky')).toBe(false)
    within(navigation).getByRole('link', { name: 'Help' }).focus()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull()
    expect(document.activeElement).toBe(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('distinguishes upload controls and associates format guidance and errors', () => {
    render(<><DocumentRow type="photograph" onChoose={vi.fn()} /><DocumentRow type="passport" onChoose={vi.fn()} error="File is too large" /></>)
    const photograph = screen.getByLabelText('Choose file for Photograph')
    const passport = screen.getByLabelText('Choose file for Passport bio page')
    expect(photograph).not.toBe(passport)
    const descriptions = passport.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent).join(' ')
    expect(descriptions).toContain('10 MB')
    expect(descriptions).toContain('File is too large')
    expect(passport.getAttribute('aria-invalid')).toBe('true')
  })

  it('announces successful updates politely', () => {
    render(<Notice tone="success" title="Saved">Your changes were saved.</Notice>)
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
  })

  it('keeps the selected document when opening a replacement request', () => {
    const documents: DocumentRecord[] = ['photograph', 'passport'].map((documentType, index) => ({ id: index + 1, documentType, originalFilename: `${documentType}.png`, mimeType: 'image/png', status: 'UPLOADED', uploadedAt: '2026-09-08', version: 1 }))
    const application: Application = { id: 1, publicId: 'TEST', status: 'UNDER_REVIEW', email: 'test@example.test', nationality: 'GBR', visaType: 'e-tourist', visaTypeName: 'Tourist', proposedArrival: '', applicantName: 'Test Applicant', dob: '', passportNumber: '', createdAt: '', updatedAt: '', sections: {}, documents, notifications: [], events: [] }
    render(<AdminActionPanel application={application} onUpdated={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Document to review'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Request document replacement' }))
    expect((screen.getByLabelText(/^Document\s*\*?$/) as HTMLSelectElement).value).toBe('2')
  })
})
