import { expect, it } from 'vitest'
import { metricPage } from './vitals'

it('reports only a coarse page group, never an application identifier', () => {
  expect(metricPage('/application/IND-EV-26-DEMO01')).toBe('application')
  expect(metricPage('/admin/applications/123')).toBe('admin')
  expect(metricPage('/payment/123')).toBe('payment')
  expect(metricPage('/help')).toBe('public')
})
